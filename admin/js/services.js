// ── Club Services (Courtly backend'inden taşındı) ───────────────
// Kaynak: C:\Users\Ozan Çetin\Courtly\src\lib\supabase\*Service.ts
// TypeScript → plain JS, `supabase` → global `sb`

// ── Zaman yardımcıları ─────────────────────────────────────────
// Rezervasyonlar DB'de +3 saat ofsetle saklanıyor (Türkiye saati).
// Okurken −3, yazarken +3 uygulanıyor.
function dbTimeToLocal(iso) {
  if (!iso) return iso;
  const d = new Date(iso);
  d.setUTCHours(d.getUTCHours() - 3);
  return d.toISOString();
}
function localTimeToDb(iso) {
  if (!iso) return iso;
  const d = new Date(iso);
  d.setUTCHours(d.getUTCHours() + 3);
  return d.toISOString();
}

// ═══════════════════════════════════════════════════════════════
// MEMBERSHIP SERVICE
// ═══════════════════════════════════════════════════════════════
const MembershipSvc = {

  // ── Paketler ────────────────────────────────────────────────
  async getClubPackages(clubId, activeOnly = true) {
    let q = sb.from('club_membership_packages')
      .select('*').eq('club_id', clubId)
      .order('created_at', { ascending: true });
    if (activeOnly) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async createPackage(clubId, data) {
    const { data: pkg, error } = await sb.from('club_membership_packages').insert({
      club_id: clubId,
      name: data.name,
      description: data.description ?? null,
      price: data.price ?? null,
      price_period: data.price_period ?? 'monthly',
      duration_days: data.duration_days,
      court_extra_fee: data.court_extra_fee ?? null,
      weekly_court_hours_limit: data.weekly_court_hours_limit ?? null,
      cancellation_limit: data.cancellation_limit ?? null,
      penalty_no_reservation: data.penalty_no_reservation ?? false,
      penalty_full_price: data.penalty_full_price ?? false,
      penalty_duration_days: data.penalty_duration_days ?? null,
      allow_guest: data.allow_guest ?? true,
      guest_primetime_only: data.guest_primetime_only ?? false,
      guest_primetime_start: data.guest_primetime_start ?? null,
      guest_primetime_end: data.guest_primetime_end ?? null,
      guest_fee: data.guest_fee ?? null,
      valid_days: data.valid_days ?? 'all',
    }).select().single();
    if (error) throw error;
    return pkg;
  },

  async updatePackage(packageId, data) {
    const { data: pkg, error } = await sb.from('club_membership_packages')
      .update(data).eq('id', packageId).select().single();
    if (error) throw error;
    return pkg;
  },

  async deactivatePackage(packageId) {
    const { error } = await sb.from('club_membership_packages')
      .update({ is_active: false }).eq('id', packageId);
    if (error) throw error;
  },

  // ── Üyelikler ───────────────────────────────────────────────
  async getClubMemberships(clubId, statusFilter) {
    await sb.rpc('expire_past_memberships').catch(() => {});
    let q = sb.from('club_memberships')
      .select('*, package:club_membership_packages(*), profile:profiles(id, full_name, profile_photo_url)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    if (statusFilter && statusFilter.length > 0) q = q.in('status', statusFilter);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async acceptMembership(membershipId) {
    const { data: m, error: fe } = await sb.from('club_memberships')
      .select('user_id, club_id').eq('id', membershipId).single();
    if (fe) throw fe;
    const { error } = await sb.from('club_memberships')
      .update({ status: 'active' }).eq('id', membershipId);
    if (error) throw error;
    if (m.user_id) {
      const { data: club } = await sb.from('club_profiles').select('club_name').eq('id', m.club_id).single();
      await sb.from('notifications').insert({
        user_id: m.user_id, type: 'membership_accepted',
        title: 'Üyelik Onaylandı',
        message: `${club?.club_name ?? 'Kulüp'} kulübüne üyeliğiniz onaylandı.`,
        is_read: false,
      });
    }
  },

  async rejectMembership(membershipId) {
    const { data: m, error: fe } = await sb.from('club_memberships')
      .select('user_id, club_id').eq('id', membershipId).single();
    if (fe) throw fe;
    const { error } = await sb.from('club_memberships')
      .update({ status: 'cancelled' }).eq('id', membershipId);
    if (error) throw error;
    if (m.user_id) {
      const { data: club } = await sb.from('club_profiles').select('club_name').eq('id', m.club_id).single();
      await sb.from('notifications').insert({
        user_id: m.user_id, type: 'membership_rejected',
        title: 'Üyelik Reddedildi',
        message: `${club?.club_name ?? 'Kulüp'} kulübüne üyelik başvurunuz reddedildi.`,
        is_read: false,
      });
    }
  },

  async addManualMember(clubId, data) {
    const { data: m, error } = await sb.from('club_memberships').insert({
      club_id: clubId,
      package_id: data.package_id ?? null,
      user_id: data.user_id ?? null,
      member_name: data.member_name,
      member_phone: data.member_phone ?? null,
      member_email: data.member_email ?? null,
      gender: data.gender ?? null,
      birth_date: data.birth_date ?? null,
      status: 'active',
      join_date: new Date().toISOString().split('T')[0],
    }).select('*, package:club_membership_packages(*), profile:profiles(id, full_name, profile_photo_url)').single();
    if (error) throw error;
    return m;
  },

  async terminateMembership(membershipId) {
    const { error } = await sb.from('club_memberships')
      .update({ status: 'cancelled' }).eq('id', membershipId);
    if (error) throw error;
  },

  async getMemberReservationHistory(membershipId, clubId) {
    const { data: m } = await sb.from('club_memberships').select('user_id').eq('id', membershipId).single();
    if (!m?.user_id) return [];
    const { data: courts } = await sb.from('courts').select('id').eq('club_id', clubId);
    const courtIds = (courts ?? []).map(c => c.id);
    if (courtIds.length === 0) return [];
    const { data, error } = await sb.from('bookings')
      .select('id, start_time, end_time, status, total_amount, court:courts!fk_bookings_court_id(court_number, court_type)')
      .eq('user_id', m.user_id).in('court_id', courtIds)
      .order('start_time', { ascending: false }).limit(20);
    if (error) throw error;
    return (data ?? []).map(b => ({ ...b, start_time: dbTimeToLocal(b.start_time), end_time: dbTimeToLocal(b.end_time) }));
  },
};

// ═══════════════════════════════════════════════════════════════
// COACH SERVICE
// ═══════════════════════════════════════════════════════════════
const CoachSvc = {

  async getClubCoaches(clubId) {
    const { data, error } = await sb.from('club_coaches').select('*')
      .eq('club_id', clubId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getActiveClubCoaches(clubId) {
    const { data, error } = await sb.from('club_coaches').select('*')
      .eq('club_id', clubId).eq('is_active', true).order('full_name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async createClubCoach(clubId, coachData) {
    // E-posta çakışması kontrolü
    const { data: ex } = await sb.from('club_coaches').select('id')
      .eq('club_id', clubId).eq('email', coachData.email).maybeSingle();
    if (ex) throw new Error('Bu e-posta adresiyle zaten bir koç kayıtlı.');

    const { data, error } = await sb.from('club_coaches')
      .insert([{ club_id: clubId, ...coachData, is_active: coachData.is_active ?? true }])
      .select().single();
    if (error) throw error;
    return data;
  },

  async updateClubCoach(clubId, coachId, coachData) {
    if (coachData.email) {
      const { data: ex } = await sb.from('club_coaches').select('id')
        .eq('club_id', clubId).eq('email', coachData.email).neq('id', coachId).maybeSingle();
      if (ex) throw new Error('Bu e-posta adresiyle zaten bir koç kayıtlı.');
    }
    const { data, error } = await sb.from('club_coaches')
      .update(coachData).eq('id', coachId).eq('club_id', clubId).select().single();
    if (error) throw error;
    return data;
  },

  async deleteClubCoach(clubId, coachId) {
    const { error } = await sb.from('club_coaches').delete()
      .eq('id', coachId).eq('club_id', clubId);
    if (error) throw error;
  },

  async toggleCoachStatus(clubId, coachId) {
    const { data: cur, error: fe } = await sb.from('club_coaches')
      .select('is_active').eq('id', coachId).eq('club_id', clubId).single();
    if (fe) throw fe;
    const { data, error } = await sb.from('club_coaches')
      .update({ is_active: !cur.is_active }).eq('id', coachId).eq('club_id', clubId)
      .select().single();
    if (error) throw error;
    return data;
  },

  // Kulübe ait tüm kortları çek
  async getClubCourts(clubId) {
    const { data, error } = await sb.from('courts').select('*')
      .eq('club_id', clubId).eq('is_active', true).order('court_number');
    if (error) throw error;
    return data ?? [];
  },

  // Kulübün belirli gündeki rezervasyonları (görüntülemede −3 saat uygulanıyor)
  async getClubBookingsForDate(clubId, date) {
    const { data: courts, error: ce } = await sb.from('courts').select('id, court_number, court_type')
      .eq('club_id', clubId).eq('is_active', true);
    if (ce) throw ce;
    if (!courts || courts.length === 0) return [];
    const courtIds = courts.map(c => c.id);

    const { data: bookings, error: be } = await sb.from('bookings').select('*')
      .in('court_id', courtIds)
      .gte('start_time', `${date}T00:00:00`).lt('start_time', `${date}T23:59:59`)
      .order('start_time');
    if (be) throw be;

    const userIds = [...new Set((bookings ?? []).map(b => b.user_id).filter(Boolean))];
    let profiles = [];
    if (userIds.length > 0) {
      const { data: pd } = await sb.from('profiles').select('id, full_name, email').in('id', userIds);
      profiles = pd ?? [];
    }

    return (bookings ?? []).map(b => ({
      ...b,
      start_time: dbTimeToLocal(b.start_time),
      end_time:   dbTimeToLocal(b.end_time),
      courts:  courts.find(c => c.id === b.court_id) ?? {},
      profile: profiles.find(p => p.id === b.user_id) ?? {},
    }));
  },
};

// ═══════════════════════════════════════════════════════════════
// LESSON SERVICE
// ═══════════════════════════════════════════════════════════════
const LessonSvc = {

  async getClubLessons(clubId) {
    // Kulübün tüm koçlarını bul, sonra bu koçların derslerini getir
    const { data: coaches } = await sb.from('club_coaches').select('id, full_name').eq('club_id', clubId);
    if (!coaches || coaches.length === 0) return [];
    const coachIds = coaches.map(c => c.id);

    const { data, error } = await sb.from('club_manual_lessons')
      .select('*').in('coach_id', coachIds)
      .order('date', { ascending: false }).limit(100);
    if (error) throw error;
    const coachMap = Object.fromEntries(coaches.map(c => [c.id, c.full_name]));
    return (data ?? []).map(l => ({ ...l, coach_name: coachMap[l.coach_id] ?? '—' }));
  },

  async createManualLesson(lessonData) {
    const { data, error } = await sb.from('club_manual_lessons').insert(lessonData).select().single();
    if (error) throw error;
    return data;
  },

  async updateManualLesson(lessonId, updates) {
    const { data, error } = await sb.from('club_manual_lessons')
      .update(updates).eq('id', lessonId).select().single();
    if (error) throw error;
    return data;
  },

  async deleteManualLesson(lessonId) {
    const { error } = await sb.from('club_manual_lessons').delete().eq('id', lessonId);
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════════
// TOURNAMENT SERVICE
// ═══════════════════════════════════════════════════════════════

// Yardımcı: Fisher-Yates karıştırma
function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Berger round-robin (singles)
function _buildRRSingles(players) {
  const n = players.length % 2 === 0 ? players.length : players.length + 1;
  const t = players.length % 2 === 0 ? [...players] : [...players, '__BYE__'];
  const result = [];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i];
      if (a !== '__BYE__' && b !== '__BYE__') result.push({ round: r + 1, a, b });
    }
    const last = t[n - 1];
    for (let i = n - 1; i > 1; i--) t[i] = t[i - 1];
    t[1] = last;
  }
  return result;
}

// Americano match builder
function _buildAmericano(tournamentId, playerIds, rounds, courts, isTeams) {
  const n = playerIds.length;
  const shuffled = _shuffle(playerIds);
  const step = Math.max(1, Math.floor(n / Math.max(rounds, 1)));
  const rows = [];
  for (let r = 0; r < rounds; r++) {
    const offset = (r * step) % n;
    const rot = [...shuffled.slice(offset), ...shuffled.slice(0, offset)];
    for (let c = 0; c < courts; c++) {
      const base = c * (isTeams ? 4 : 2);
      if (isTeams) {
        if (base + 3 >= n) break;
        rows.push({ tournament_id: tournamentId, round_number: r + 1, court_name: `Kort ${c + 1}`, bracket_position: c,
          team_a_player1_id: rot[base], team_a_player2_id: rot[base + 1],
          team_b_player1_id: rot[base + 2], team_b_player2_id: rot[base + 3],
          score_a: 0, score_b: 0, sets_data: [], status: 'upcoming' });
      } else {
        if (base + 1 >= n) break;
        rows.push({ tournament_id: tournamentId, round_number: r + 1, court_name: `Kort ${c + 1}`, bracket_position: c,
          team_a_player1_id: rot[base], team_b_player1_id: rot[base + 1],
          score_a: 0, score_b: 0, sets_data: [], status: 'upcoming' });
      }
    }
  }
  return rows;
}

// Knockout round 1
function _buildKnockout1(tournamentId, playerIds, isDoubles) {
  const shuffled = _shuffle(playerIds);
  const rows = [];
  if (isDoubles) {
    const pairs = [];
    for (let i = 0; i + 1 < shuffled.length; i += 2) pairs.push([shuffled[i], shuffled[i + 1]]);
    const half = Math.floor(pairs.length / 2);
    for (let i = 0; i < half; i++) {
      rows.push({ tournament_id: tournamentId, round_number: 1, court_name: `Kort ${i + 1}`, bracket_position: i,
        team_a_player1_id: pairs[i][0], team_a_player2_id: pairs[i][1],
        team_b_player1_id: pairs[pairs.length - 1 - i][0], team_b_player2_id: pairs[pairs.length - 1 - i][1],
        score_a: 0, score_b: 0, sets_data: [], status: 'upcoming' });
    }
  } else {
    const half = Math.floor(shuffled.length / 2);
    for (let i = 0; i < half; i++) {
      rows.push({ tournament_id: tournamentId, round_number: 1, court_name: `Kort ${i + 1}`, bracket_position: i,
        team_a_player1_id: shuffled[i], team_b_player1_id: shuffled[shuffled.length - 1 - i],
        score_a: 0, score_b: 0, sets_data: [], status: 'upcoming' });
    }
  }
  return rows;
}

// League (round-robin) matches
function _buildLeague(tournamentId, playerIds, isDoubles, courts) {
  const rows = [];
  if (isDoubles) {
    const shuffled = _shuffle(playerIds);
    const pairs = [];
    for (let i = 0; i + 1 < shuffled.length; i += 2) pairs.push([shuffled[i], shuffled[i + 1]]);
    const n = pairs.length % 2 === 0 ? pairs.length : pairs.length + 1;
    const indices = Array.from({ length: n }, (_, i) => i < pairs.length ? i : -1);
    let idx = 0;
    for (let r = 0; r < n - 1; r++) {
      for (let i = 0; i < n / 2; i++) {
        const iA = indices[i], iB = indices[n - 1 - i];
        if (iA !== -1 && iB !== -1) {
          rows.push({ tournament_id: tournamentId, round_number: r + 1,
            court_name: `Kort ${(idx % courts) + 1}`, bracket_position: idx++,
            team_a_player1_id: pairs[iA][0], team_a_player2_id: pairs[iA][1],
            team_b_player1_id: pairs[iB][0], team_b_player2_id: pairs[iB][1],
            score_a: 0, score_b: 0, sets_data: [], status: 'upcoming' });
        }
      }
      const last = indices[n - 1];
      for (let i = n - 1; i > 1; i--) indices[i] = indices[i - 1];
      indices[1] = last;
    }
  } else {
    const matches = _buildRRSingles(_shuffle(playerIds));
    matches.forEach(({ round, a, b }, i) => {
      rows.push({ tournament_id: tournamentId, round_number: round,
        court_name: `Kort ${(i % courts) + 1}`, bracket_position: i,
        team_a_player1_id: a, team_b_player1_id: b,
        score_a: 0, score_b: 0, sets_data: [], status: 'upcoming' });
    });
  }
  return rows;
}

const TournamentSvc = {

  async getTournamentsByClub(clubId) {
    const { data, error } = await sb.from('tournaments').select('*')
      .eq('club_id', clubId).order('start_date', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async createTournament(data) {
    const { data: t, error } = await sb.from('tournaments').insert(data).select().single();
    if (error) throw error;
    return t;
  },

  async updateTournament(id, data) {
    const { error } = await sb.from('tournaments').update(data).eq('id', id);
    if (error) throw error;
  },

  async deleteTournament(id) {
    const { error } = await sb.from('tournaments').delete().eq('id', id);
    if (error) throw error;
  },

  async updateStatus(id, status) {
    const { error } = await sb.from('tournaments').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async getParticipants(tournamentId) {
    const { data, error } = await sb.from('tournament_participants')
      .select(`*, player_profile:profiles!tournament_participants_player_id_fkey(id, full_name, email),
               partner_profile:profiles!tournament_participants_partner_id_fkey(id, full_name, email)`)
      .eq('tournament_id', tournamentId).order('registered_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async generateAndSaveMatches(tournament, participants) {
    await sb.from('tournament_matches').delete().eq('tournament_id', tournament.id);
    await sb.from('tournament_standings').delete().eq('tournament_id', tournament.id);

    const playerIds = participants.map(p => p.player_id);
    const n = playerIds.length;
    const type = tournament.tournament_type;
    const minPlayers = { americano_teams: 4, americano_singles: 2, singles_knockout: 2, doubles_knockout: 4, singles_league: 2, doubles_league: 4 };
    if (n < (minPlayers[type] ?? 2)) throw new Error(`Bu format için en az ${minPlayers[type]} oyuncu gerekli. Şu an: ${n}`);

    let matchRows = [];
    if (type === 'americano_teams')    matchRows = _buildAmericano(tournament.id, playerIds, tournament.rounds_count, tournament.courts_count, true);
    else if (type === 'americano_singles') matchRows = _buildAmericano(tournament.id, playerIds, tournament.rounds_count, tournament.courts_count, false);
    else if (type === 'singles_knockout')  matchRows = _buildKnockout1(tournament.id, playerIds, false);
    else if (type === 'doubles_knockout')  matchRows = _buildKnockout1(tournament.id, playerIds, true);
    else if (type === 'singles_league')    matchRows = _buildLeague(tournament.id, playerIds, false, tournament.courts_count);
    else if (type === 'doubles_league')    matchRows = _buildLeague(tournament.id, playerIds, true, tournament.courts_count);

    if (matchRows.length === 0) throw new Error('Maç oluşturulamadı.');
    const { error: me } = await sb.from('tournament_matches').insert(matchRows);
    if (me) throw me;

    const standingRows = playerIds.map(pid => ({
      tournament_id: tournament.id, player1_id: pid,
      points: 0, wins: 0, losses: 0, draws: 0, games_won: 0, games_lost: 0,
    }));
    await sb.from('tournament_standings').insert(standingRows);
  },

  async getMatches(tournamentId) {
    const { data, error } = await sb.from('tournament_matches')
      .select(`*, team_a_player1:profiles!tournament_matches_team_a_player1_id_fkey(full_name),
               team_a_player2:profiles!tournament_matches_team_a_player2_id_fkey(full_name),
               team_b_player1:profiles!tournament_matches_team_b_player1_id_fkey(full_name),
               team_b_player2:profiles!tournament_matches_team_b_player2_id_fkey(full_name)`)
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true }).order('bracket_position', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(m => ({ ...m, sets_data: m.sets_data ?? [] }));
  },

  async updateMatchScore(matchId, scoreA, scoreB, setsData) {
    const { error } = await sb.from('tournament_matches').update({
      score_a: scoreA, score_b: scoreB, sets_data: setsData,
      status: 'completed', played_at: new Date().toISOString(),
    }).eq('id', matchId);
    if (error) throw error;
  },

  async getStandings(tournamentId) {
    const { data, error } = await sb.from('tournament_standings')
      .select(`*, player1_profile:profiles!tournament_standings_player1_id_fkey(full_name),
               player2_profile:profiles!tournament_standings_player2_id_fkey(full_name)`)
      .eq('tournament_id', tournamentId).order('points', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async recalculateStandings(tournamentId) {
    const { error } = await sb.rpc('recalculate_tournament_standings', { t_id: tournamentId });
    if (error) throw error;
  },

  isDoublesFormat(type) {
    return ['doubles_knockout', 'doubles_league', 'americano_teams'].includes(type);
  },
};

// ═══════════════════════════════════════════════════════════════
// GROUP SERVICE
// ═══════════════════════════════════════════════════════════════
const GroupSvc = {

  async getClubGroups(clubId) {
    const { data, error } = await sb.from('club_groups')
      .select('*, coach:club_coaches(id, full_name), group_coaches:club_group_coaches(share_percentage, fixed_amount, club_coaches(id, full_name)), members:club_group_members(*)')
      .eq('club_id', clubId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(g => ({
      ...g,
      member_count: g.members?.length ?? 0,
      coaches: ((g.group_coaches ?? []).map(gc => ({
        id: gc.club_coaches?.id,
        full_name: gc.club_coaches?.full_name,
        share_percentage: gc.share_percentage ?? 100,
        fixed_amount: gc.fixed_amount ?? null,
      })).filter(c => c.id)),
    }));
  },

  async getGroupById(groupId) {
    const { data, error } = await sb.from('club_groups')
      .select('*, coach:club_coaches(id, full_name), group_coaches:club_group_coaches(share_percentage, fixed_amount, club_coaches(id, full_name)), members:club_group_members(*)')
      .eq('id', groupId).single();
    if (error) throw error;
    return {
      ...data,
      member_count: data.members?.length ?? 0,
      coaches: ((data.group_coaches ?? []).map(gc => ({
        id: gc.club_coaches?.id,
        full_name: gc.club_coaches?.full_name,
        share_percentage: gc.share_percentage ?? 100,
        fixed_amount: gc.fixed_amount ?? null,
      })).filter(c => c.id)),
    };
  },

  async createGroup(clubId, groupData, members, coachRows) {
    if (members.length < 2) throw new Error('Grup oluşturmak için en az 2 üye gereklidir.');
    const { data: group, error: ge } = await sb.from('club_groups')
      .insert([{ ...groupData, club_id: clubId }]).select().single();
    if (ge) throw ge;
    const membersToInsert = members.map(m => ({ ...m, group_id: group.id }));
    const { error: me } = await sb.from('club_group_members').insert(membersToInsert);
    if (me) throw me;
    if (coachRows && coachRows.length > 0) {
      const rows = coachRows.map(r => ({ ...r, group_id: group.id }));
      const { error: ce } = await sb.from('club_group_coaches').insert(rows);
      if (ce) throw ce;
    }
    return this.getGroupById(group.id);
  },

  async updateGroup(groupId, updates, coachRows) {
    const { error } = await sb.from('club_groups').update(updates).eq('id', groupId);
    if (error) throw error;
    if (coachRows !== undefined) {
      await sb.from('club_group_coaches').delete().eq('group_id', groupId);
      if (coachRows.length > 0) {
        const rows = coachRows.map(r => ({ ...r, group_id: groupId }));
        const { error: ce } = await sb.from('club_group_coaches').insert(rows);
        if (ce) throw ce;
      }
    }
    return this.getGroupById(groupId);
  },

  async deleteGroup(groupId) {
    await sb.from('court_closures').delete().eq('group_id', groupId);
    const { data: posts } = await sb.from('club_group_dues_posts').select('id, finance_record_id').eq('group_id', groupId);
    const financeIds = (posts ?? []).map(p => p.finance_record_id).filter(Boolean);
    if (financeIds.length > 0) await sb.from('club_finances').delete().in('id', financeIds);
    await sb.from('club_group_dues_posts').delete().eq('group_id', groupId);
    await sb.from('club_group_dues').delete().eq('group_id', groupId);
    await sb.from('club_group_members').delete().eq('group_id', groupId);
    const { error } = await sb.from('club_groups').delete().eq('id', groupId);
    if (error) throw error;
  },

  async toggleGroupStatus(groupId) {
    const { data: cur, error: fe } = await sb.from('club_groups')
      .select('is_active').eq('id', groupId).single();
    if (fe) throw fe;
    if (cur.is_active) {
      await sb.from('court_closures').delete().eq('group_id', groupId);
    }
    const { error } = await sb.from('club_groups')
      .update({ is_active: !cur.is_active }).eq('id', groupId);
    if (error) throw error;
  },

  async addMember(groupId, member) {
    const { custom_fee, ...rest } = member;
    const payload = { ...rest, group_id: groupId };
    if (custom_fee !== undefined && custom_fee !== null && custom_fee !== '') payload.custom_fee = Number(custom_fee);
    const { data, error } = await sb.from('club_group_members').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async removeMember(memberId) {
    const { error } = await sb.from('club_group_members').delete().eq('id', memberId);
    if (error) throw error;
  },

  async updateMember(memberId, updates) {
    const { data, error } = await sb.from('club_group_members')
      .update(updates).eq('id', memberId).select().single();
    if (error) throw error;
    return data;
  },
};

// ═══════════════════════════════════════════════════════════════
// GROUP DUES SERVICE
// ═══════════════════════════════════════════════════════════════
const GroupDuesSvc = {

  async getOrCreateDues(groupId, year, month, monthlyFee) {
    const { data: existing, error: fetchErr } = await sb
      .from('club_group_dues')
      .select('*')
      .eq('group_id', groupId)
      .eq('year', year)
      .eq('month', month)
      .order('created_at', { ascending: true });
    if (fetchErr) throw fetchErr;
    if (existing && existing.length > 0) return existing;

    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Oturum açılmamış');

    const { data: members, error: membersErr } = await sb
      .from('club_group_members')
      .select('id, member_name, custom_fee')
      .eq('group_id', groupId);
    if (membersErr) throw membersErr;
    if (!members || members.length === 0) return [];

    const rows = members.map(m => ({
      group_id: groupId,
      club_id: user.id,
      year,
      month,
      member_id: m.id,
      member_name: m.member_name,
      amount: (m.custom_fee != null ? m.custom_fee : monthlyFee) || 0,
      is_paid: false,
    }));

    const { data: created, error: insertErr } = await sb
      .from('club_group_dues')
      .insert(rows)
      .select();
    if (insertErr) throw insertErr;
    return created ?? [];
  },

  async toggleDuePaid(dueId, isPaid) {
    const { data, error } = await sb
      .from('club_group_dues')
      .update({ is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null })
      .eq('id', dueId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getDuesPost(groupId, year, month) {
    const { data, error } = await sb
      .from('club_group_dues_posts')
      .select('*')
      .eq('group_id', groupId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async postDuesToFinance(groupId, groupName, year, month, dues, clubPercentage, splitType, groupCoaches) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Oturum açılmamış');

    const totalAmount = dues.reduce((sum, d) => sum + (d.amount || 0), 0);
    let clubAmount, coachAmount;

    if (splitType === 'fixed_amount' && groupCoaches && groupCoaches.length > 0) {
      const totalFixed = groupCoaches.reduce((s, c) => s + (c.fixed_amount ?? 0), 0);
      coachAmount = Math.round(Math.min(totalFixed, totalAmount) * 100) / 100;
      clubAmount  = Math.round((totalAmount - coachAmount) * 100) / 100;
    } else {
      clubAmount  = Math.round(totalAmount * ((clubPercentage ?? 100) / 100) * 100) / 100;
      coachAmount = Math.round((totalAmount - clubAmount) * 100) / 100;
    }

    const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const description = `${groupName} - ${MONTHS_TR[month - 1]} ${year} aidatı`;
    const today = new Date().toISOString().split('T')[0];

    const { data: financeRecord, error: finErr } = await sb
      .from('club_finances')
      .insert({ club_id: user.id, type: 'income', category: 'Grup Aidatı', amount: clubAmount, description, date: today })
      .select('id').single();
    if (finErr) throw finErr;

    if (groupCoaches && groupCoaches.length > 0 && coachAmount > 0) {
      for (const coach of groupCoaches) {
        let earnAmount;
        if (splitType === 'fixed_amount') {
          earnAmount = Math.round((coach.fixed_amount ?? 0) * 100) / 100;
        } else {
          const pct = coach.share_percentage ?? (100 / groupCoaches.length);
          earnAmount = Math.round(coachAmount * (pct / 100) * 100) / 100;
        }
        if (earnAmount <= 0) continue;
        await sb.from('coach_earnings').insert({
          club_id: user.id, coach_id: coach.id, coach_name: coach.full_name,
          student_name: null, lesson_id: null, booking_id: null,
          amount: earnAmount, court_fee: 0, date: today, description, payment_status: 'unpaid',
        });
      }
    }

    const { error: postErr } = await sb.from('club_group_dues_posts').insert({
      group_id: groupId, club_id: user.id, year, month,
      total_amount: totalAmount, club_amount: clubAmount, coach_amount: coachAmount,
      finance_record_id: financeRecord?.id,
    });
    if (postErr) throw postErr;
  },
};

// ═══════════════════════════════════════════════════════════════
// GROUP SCHEDULE SERVICE
// ═══════════════════════════════════════════════════════════════
const GroupScheduleSvc = {

  async getGroupSchedule(groupId) {
    const { data, error } = await sb
      .from('court_closures')
      .select('*, court:courts(id, court_number, court_type)')
      .eq('group_id', groupId)
      .eq('is_active', true);
    if (error) throw error;
    return data ?? [];
  },

  async saveGroupSchedule(groupId, groupName, coachIds, courtIds, days, startHour, endHour) {
    await sb.from('court_closures').delete().eq('group_id', groupId);
    if (!courtIds.length || !days.length) return;
    const rows = [];
    for (const courtId of courtIds) {
      for (const day of days) {
        if (coachIds.length === 0) {
          rows.push({ court_id: courtId, closure_type: 'recurring_weekly',
            day_of_week: day, start_hour: startHour, end_hour: endHour,
            reason: groupName, group_id: groupId, is_active: true });
        } else {
          for (const coachId of coachIds) {
            rows.push({ court_id: courtId, closure_type: 'recurring_weekly',
              day_of_week: day, start_hour: startHour, end_hour: endHour,
              reason: groupName, group_id: groupId, coach_id: coachId, is_active: true });
          }
        }
      }
    }
    const { error } = await sb.from('court_closures').insert(rows);
    if (error) throw error;
  },

  async checkConflicts(groupId, courtIds, days, startHour, endHour, coaches) {
    const msgs = [];

    // 1) Kort çakışması
    const { data: courtRows } = await sb
      .from('court_closures')
      .select('court_id, day_of_week, start_hour, end_hour, reason, group_id, courts(court_number)')
      .in('court_id', courtIds)
      .in('day_of_week', days)
      .eq('closure_type', 'recurring_weekly')
      .eq('is_active', true)
      .lt('start_hour', endHour)
      .gt('end_hour', startHour);

    for (const row of courtRows ?? []) {
      if (row.group_id === groupId) continue;
      const courtNum = row.courts?.court_number ?? '?';
      const dayName  = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][row.day_of_week ?? 0];
      const label    = row.reason ? ` (${row.reason})` : '';
      msgs.push({ type: 'court',
        msg: `Kort ${courtNum} · ${dayName} ${row.start_hour}:00–${row.end_hour}:00 dolu${label}` });
    }

    // 2) Hoca court_closures çakışması
    for (const coach of coaches) {
      const { data: coachRows } = await sb
        .from('court_closures')
        .select('court_id, day_of_week, start_hour, end_hour, reason, group_id, courts(court_number)')
        .eq('coach_id', coach.id)
        .in('day_of_week', days)
        .eq('closure_type', 'recurring_weekly')
        .eq('is_active', true)
        .lt('start_hour', endHour)
        .gt('end_hour', startHour);

      for (const row of coachRows ?? []) {
        if (row.group_id === groupId) continue;
        const courtNum = row.courts?.court_number ?? '?';
        const dayName  = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][row.day_of_week ?? 0];
        msgs.push({ type: 'coach',
          msg: `${coach.full_name} · Kort ${courtNum} ${dayName} ${row.start_hour}:00–${row.end_hour}:00` });
      }

      // 3) lessons tablosu çakışması
      const { data: coachMeta } = await sb
        .from('club_coaches').select('individual_coach_id').eq('id', coach.id).maybeSingle();
      const todayTs = new Date().toISOString().split('T')[0] + 'T00:00:00';
      const lessonQueries = [];
      if (coachMeta?.individual_coach_id) {
        lessonQueries.push(
          sb.from('lessons').select('start_time, end_time, student_name')
            .eq('coach_id', coachMeta.individual_coach_id).neq('status', 'cancelled').gte('start_time', todayTs)
        );
      }
      lessonQueries.push(
        sb.from('lessons').select('start_time, end_time, student_name')
          .eq('club_coach_id', coach.id).neq('status', 'cancelled').gte('start_time', todayTs)
      );
      const lessonResults = await Promise.all(lessonQueries);
      const allLessons = lessonResults.flatMap(r => r.data ?? []);
      const seen = new Set();
      for (const l of allLessons) {
        const ls = new Date(l.start_time);
        if (!days.includes(ls.getDay())) continue;
        const lsh = ls.getHours() + ls.getMinutes() / 60;
        const leh = new Date(l.end_time).getHours() + new Date(l.end_time).getMinutes() / 60;
        if (startHour < leh && endHour > lsh) {
          const key = `${coach.id}_${ls.getDay()}`;
          if (!seen.has(key)) {
            seen.add(key);
            const dayName = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][ls.getDay()];
            msgs.push({ type: 'coach',
              msg: `${coach.full_name} · Ders: ${l.student_name || 'Öğrenci'} her ${dayName}` });
          }
        }
      }

      // 4) club_manual_lessons çakışması
      const today2 = new Date().toISOString().split('T')[0];
      const { data: manual } = await sb
        .from('club_manual_lessons')
        .select('date, start_time, end_time, student_name')
        .eq('coach_id', coach.id)
        .gte('date', today2);
      const seen2 = new Set();
      for (const ml of manual ?? []) {
        const d = new Date(ml.date);
        if (!days.includes(d.getDay())) continue;
        const [sh, sm] = ml.start_time.split(':').map(Number);
        const [eh, em] = ml.end_time.split(':').map(Number);
        const lsh = sh + sm / 60, leh = eh + em / 60;
        if (startHour < leh && endHour > lsh) {
          const key = `ml_${coach.id}_${d.getDay()}`;
          if (!seen2.has(key)) {
            seen2.add(key);
            const dayName = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][d.getDay()];
            msgs.push({ type: 'coach',
              msg: `${coach.full_name} · Manuel ders: ${ml.student_name || 'Öğrenci'} her ${dayName}` });
          }
        }
      }
    }

    return msgs;
  },

  // Gün bazında per-day kayıt (farklı kortlar + saatler + hocalar, çoklu seans destekli)
  async saveGroupSchedulePerDay(groupId, groupName, daySettings, days, globalCoachIds, diffCoachPerDay, dayCoachIds) {
    await sb.from('court_closures').delete().eq('group_id', groupId);
    const rows = [];
    for (const day of days) {
      const slots = daySettings[day] ?? [{ courts: [], start: 9, end: 11 }];
      const coachIds = diffCoachPerDay ? (dayCoachIds[day] ?? []) : globalCoachIds;
      for (const { courts: dayCourts = [], start = 9, end = 11 } of slots) {
        const sh = Math.floor(start),   sm = Math.round((start % 1) * 60);
        const eh = Math.floor(end),     em = Math.round((end   % 1) * 60);
        for (const courtId of dayCourts) {
          if (coachIds.length === 0) {
            rows.push({ court_id: courtId, closure_type: 'recurring_weekly',
              day_of_week: day, start_hour: sh, start_minute: sm, end_hour: eh, end_minute: em,
              reason: groupName, group_id: groupId, is_active: true });
          } else {
            for (const coachId of coachIds) {
              rows.push({ court_id: courtId, closure_type: 'recurring_weekly',
                day_of_week: day, start_hour: sh, start_minute: sm, end_hour: eh, end_minute: em,
                reason: groupName, group_id: groupId, coach_id: coachId, is_active: true });
            }
          }
        }
      }
    }
    if (rows.length === 0) return;
    const { error } = await sb.from('court_closures').insert(rows);
    if (error) throw error;
  },

  // Gün bazında çakışma kontrolü (çoklu seans destekli)
  async checkConflictsPerDay(groupId, daySettings, days, allCoaches, globalCoachIds, diffCoachPerDay, dayCoachIds) {
    const msgs = [];
    const DN = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
    const fmtH = h => {
      const frac = h % 1;
      const min = frac >= 0.875 ? '45' : frac >= 0.625 ? '30' : frac >= 0.375 ? '15' : '00';
      return `${String(Math.floor(h)).padStart(2,'0')}:${min}`;
    };

    for (const day of days) {
      const slots = daySettings[day] ?? [{ courts: [], start: 9, end: 11 }];
      const coachIds = diffCoachPerDay ? (dayCoachIds[day] ?? []) : globalCoachIds;
      const effectiveCoaches = allCoaches.filter(c => coachIds.includes(c.id));

      // Fetch coach meta once per day (not per slot)
      const coachMetas = {};
      for (const coach of effectiveCoaches) {
        const { data: meta } = await sb.from('club_coaches').select('individual_coach_id').eq('id', coach.id).maybeSingle();
        coachMetas[coach.id] = meta;
      }

      for (const { courts: dayCourts = [], start = 9, end = 11 } of slots) {
        if (!dayCourts.length) continue;
        const startMins = start * 60, endMins = end * 60;

        // Kort çakışması
        const { data: courtRows } = await sb
          .from('court_closures')
          .select('court_id, day_of_week, start_hour, start_minute, end_hour, end_minute, reason, group_id, courts(court_number)')
          .in('court_id', dayCourts)
          .eq('day_of_week', day)
          .eq('closure_type', 'recurring_weekly')
          .eq('is_active', true);
        for (const row of courtRows ?? []) {
          if (row.group_id === groupId) continue;
          const rs = (row.start_hour + (row.start_minute ?? 0) / 60) * 60;
          const re = (row.end_hour   + (row.end_minute   ?? 0) / 60) * 60;
          if (startMins >= re || endMins <= rs) continue;
          const label = row.reason ? ` (${row.reason})` : '';
          msgs.push({ type: 'court', msg: `Kort ${row.courts?.court_number ?? '?'} · ${DN[day]} ${fmtH(row.start_hour + (row.start_minute??0)/60)}–${fmtH(row.end_hour + (row.end_minute??0)/60)} dolu${label}` });
        }

        // Hoca çakışması (closure + lessons + manual) per slot
        for (const coach of effectiveCoaches) {
          const { data: coachRows } = await sb
            .from('court_closures')
            .select('court_id, day_of_week, start_hour, start_minute, end_hour, end_minute, reason, group_id, courts(court_number)')
            .eq('coach_id', coach.id)
            .eq('day_of_week', day)
            .eq('closure_type', 'recurring_weekly')
            .eq('is_active', true);
          for (const row of coachRows ?? []) {
            if (row.group_id === groupId) continue;
            const rs = (row.start_hour + (row.start_minute ?? 0) / 60) * 60;
            const re = (row.end_hour   + (row.end_minute   ?? 0) / 60) * 60;
            if (startMins >= re || endMins <= rs) continue;
            msgs.push({ type: 'coach', msg: `${coach.full_name} · Kort ${row.courts?.court_number ?? '?'} ${DN[day]} ${fmtH(row.start_hour + (row.start_minute??0)/60)}–${fmtH(row.end_hour + (row.end_minute??0)/60)}` });
          }

          const todayTs = new Date().toISOString().split('T')[0] + 'T00:00:00';
          const meta = coachMetas[coach.id];
          const lsnQueries = [];
          if (meta?.individual_coach_id) {
            lsnQueries.push(sb.from('lessons').select('start_time,end_time,student_name')
              .eq('coach_id', meta.individual_coach_id).neq('status','cancelled').gte('start_time', todayTs));
          }
          lsnQueries.push(sb.from('lessons').select('start_time,end_time,student_name')
            .eq('club_coach_id', coach.id).neq('status','cancelled').gte('start_time', todayTs));
          const lsnResults = await Promise.all(lsnQueries);
          const seen = new Set();
          for (const l of lsnResults.flatMap(r => r.data ?? [])) {
            const ls = new Date(l.start_time);
            if (ls.getDay() !== day) continue;
            const lsh = ls.getHours() + ls.getMinutes() / 60;
            const leh = new Date(l.end_time).getHours() + new Date(l.end_time).getMinutes() / 60;
            const key = `${coach.id}_${fmtH(start)}_${fmtH(end)}`;
            if (start < leh && end > lsh && !seen.has(key)) {
              seen.add(key);
              msgs.push({ type: 'coach', msg: `${coach.full_name} · Ders: ${l.student_name || 'Öğrenci'} her ${DN[day]} ${fmtH(start)}–${fmtH(end)}` });
            }
          }

          const today2 = new Date().toISOString().split('T')[0];
          const { data: manual } = await sb.from('club_manual_lessons').select('date,start_time,end_time,student_name')
            .eq('coach_id', coach.id).gte('date', today2);
          const seen2 = new Set();
          for (const ml of manual ?? []) {
            if (new Date(ml.date).getDay() !== day) continue;
            const [msh, msm] = (ml.start_time ?? '0:0').split(':').map(Number);
            const [meh, mem] = (ml.end_time   ?? '0:0').split(':').map(Number);
            const lsh = msh + msm / 60, leh = meh + mem / 60;
            const key2 = `${coach.id}_${fmtH(start)}_${fmtH(end)}`;
            if (start < leh && end > lsh && !seen2.has(key2)) {
              seen2.add(key2);
              msgs.push({ type: 'coach', msg: `${coach.full_name} · Manuel ders: ${ml.student_name || 'Öğrenci'} her ${DN[day]}` });
            }
          }
        }
      }
    }
    return msgs;
  },
};

// ═══════════════════════════════════════════════════════════════
// LESSON PACKAGE SERVICE
// ═══════════════════════════════════════════════════════════════
const LessonPackageSvc = {

  async getClubPackages(clubId) {
    const { data, error } = await sb
      .from('lesson_packages')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async createPackage(clubId, payload) {
    const { data, error } = await sb
      .from('lesson_packages')
      .insert([{ ...payload, club_id: clubId }])
      .select().single();
    if (error) throw error;
    return data;
  },

  async updatePackage(id, payload) {
    const { error } = await sb.from('lesson_packages').update(payload).eq('id', id);
    if (error) throw error;
  },

  async toggleActive(id, isActive) {
    const { error } = await sb.from('lesson_packages').update({ is_active: isActive }).eq('id', id);
    if (error) throw error;
  },

  async deletePackage(id) {
    const { error } = await sb.from('lesson_packages').delete().eq('id', id);
    if (error) throw error;
  },

  async getPlayerPackages(clubId) {
    const { data, error } = await sb
      .from('player_lesson_packages')
      .select(`
        *,
        package:lesson_packages(id, name, total_lessons, price, validity_days, coach_percentage),
        player:profiles!player_id(id, full_name)
      `)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async confirmPayment(playerPackageId, validityDays, price, playerName, packageName, clubId) {
    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (validityDays || 90));
    const { error } = await sb
      .from('player_lesson_packages')
      .update({ payment_status: 'paid', status: 'active', total_paid: price, expiry_date: expiry.toISOString() })
      .eq('id', playerPackageId);
    if (error) throw error;
    await sb.from('club_finances').insert([{
      club_id: clubId, type: 'income', category: 'Ders Paketi Geliri',
      amount: price, description: `${packageName} - ${playerName}`, date: today,
    }]);
  },

  async assignCoach(playerPackageId, coachId) {
    const { error } = await sb
      .from('player_lesson_packages').update({ coach_id: coachId }).eq('id', playerPackageId);
    if (error) throw error;
  },

  async getPackageStats(clubId) {
    const { data } = await sb
      .from('player_lesson_packages')
      .select('status, payment_status, total_paid, total_lessons, used_lessons')
      .eq('club_id', clubId);
    const rows = data ?? [];
    return {
      totalRevenue: rows.filter(r => r.payment_status === 'paid').reduce((s, r) => s + (r.total_paid || 0), 0),
      activeCount:  rows.filter(r => r.status === 'active' && r.payment_status === 'paid').length,
      pendingCount: rows.filter(r => r.payment_status === 'pending').length,
      completedCount: rows.filter(r => r.status === 'completed').length,
    };
  },
};

// ═══════════════════════════════════════════════════════════════
// RESERVATION SERVICE (Kulüp tarafı)
// ═══════════════════════════════════════════════════════════════
const ReservationSvc = {

  // Kulübün tüm rezervasyonlarını getir (DB zamanı −3 saat ile düzeltilir)
  async getClubBookings(clubId) {
    const courtIds = await getClubCourtIds(clubId);
    if (courtIds.length === 0) return [];
    const { data, error } = await sb.from('bookings')
      .select(`*, courts!fk_bookings_court_id(id, court_number, court_type, surface_type, hourly_rate, is_indoor)`)
      .in('court_id', courtIds).order('start_time', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(b => ({
      ...b,
      start_time: dbTimeToLocal(b.start_time),
      end_time:   dbTimeToLocal(b.end_time),
    }));
  },

  // Belirli bir günün rezervasyonlarını getir
  async getBookingsForDay(clubId, dateStr) {
    const courtIds = await getClubCourtIds(clubId);
    if (courtIds.length === 0) return [];
    const { data, error } = await sb.from('bookings')
      .select(`*, courts!bookings_court_id_fkey(court_number, court_type),
               booking_players!booking_players_booking_id_fkey(player_id, is_primary_player, profiles!booking_players_player_id_fkey(id, full_name, email))`)
      .in('court_id', courtIds)
      .gte('start_time', `${dateStr}T00:00:00`).lte('start_time', `${dateStr}T23:59:59`)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(b => ({
      ...b,
      start_time: dbTimeToLocal(b.start_time),
      end_time:   dbTimeToLocal(b.end_time),
    }));
  },

  async updateBookingStatus(bookingId, status) {
    const { error } = await sb.from('bookings').update({ status }).eq('id', bookingId);
    if (error) throw error;
  },
};
