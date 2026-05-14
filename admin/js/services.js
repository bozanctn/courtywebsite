// ── Club Services (Courtly backend'inden taşındı) ───────────────
// Kaynak: C:\Users\Ozan Çetin\Courtly\src\lib\supabase\*Service.ts
// TypeScript → plain JS, `supabase` → global `sb`

// ── Zaman yardımcıları ─────────────────────────────────────────
// Rezervasyonlar DB'de +3 saat ofsetle saklanıyor (Türkiye saati).
// Okurken −3, yazarken +3 uygulanıyor.
function dbTimeToLocal(iso) {
  if (!iso) return iso;
  const d = new Date(iso);
  d.setHours(d.getHours() - 3);
  return d.toISOString();
}
function localTimeToDb(iso) {
  if (!iso) return iso;
  const d = new Date(iso);
  d.setHours(d.getHours() + 3);
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
      .select('*, coach:club_coaches(id, full_name), members:club_group_members(*)')
      .eq('club_id', clubId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(g => ({ ...g, member_count: g.members?.length ?? 0 }));
  },

  async getGroupById(groupId) {
    const { data, error } = await sb.from('club_groups')
      .select('*, coach:club_coaches(id, full_name), members:club_group_members(*)')
      .eq('id', groupId).single();
    if (error) throw error;
    return { ...data, member_count: data.members?.length ?? 0 };
  },

  async createGroup(clubId, groupData, members) {
    if (members.length < 3) throw new Error('Grup oluşturmak için en az 3 üye gereklidir.');
    const { data: group, error: ge } = await sb.from('club_groups')
      .insert([{ ...groupData, club_id: clubId }]).select().single();
    if (ge) throw ge;
    const membersToInsert = members.map(m => ({ ...m, group_id: group.id }));
    const { error: me } = await sb.from('club_group_members').insert(membersToInsert);
    if (me) throw me;
    return this.getGroupById(group.id);
  },

  async updateGroup(groupId, updates) {
    const { error } = await sb.from('club_groups').update(updates).eq('id', groupId);
    if (error) throw error;
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
    const { data, error } = await sb.from('club_group_members')
      .insert([{ ...member, group_id: groupId }]).select().single();
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
