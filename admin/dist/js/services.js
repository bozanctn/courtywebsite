// ── Club Services (Courtly backend'inden taşındı) ───────────────
// Kaynak: C:\Users\Ozan Çetin\Courtly\src\lib\supabase\*Service.ts
// TypeScript → plain JS, `supabase` → global `sb`

// İki ismin "aynı kişi" olabilecek kadar benzer olup olmadığı (mobil ile aynı).
// Tam eşit / biri diğerini içeriyor / anlamlı (2+ harf) ortak kelime → true.
function namesLookSimilar(a, b) {
  const norm = (s) => (s || '').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9\s]/g, ' ').trim();
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const stop = new Set(['bey', 'hanim', 'hanım', 'hn', 'bay', 'sn', 'the']);
  const toks = (s) => new Set(s.split(/\s+/).filter(w => w.length >= 2 && !stop.has(w)));
  const ta = toks(na), tb = toks(nb);
  for (const w of ta) if (tb.has(w)) return true;
  return false;
}

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
      .select('*, package:club_membership_packages(*), profile:profiles(id, full_name, profile_photo_url, birth_date)')
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
    }).select('*, package:club_membership_packages(*), profile:profiles(id, full_name, profile_photo_url, birth_date)').single();
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
      .gte('start_time', localTimeToDb(`${date}T00:00`)).lt('start_time', localTimeToDb(`${date}T23:59`))
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
// Maç üretimi ve turnuva yönetim mantığı screens/tournament_detail.jsx
// içindedir (takım/manuel-isim bazlı güncel model). Buradaki eski
// üretim kopyası kaldırıldı — burada yalnız CRUD/sorgu yardımcıları kalır.
// ═══════════════════════════════════════════════════════════════

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
  // Optimizasyon: tüm DB sorguları döngüden önce tek Promise.all ile çekilir (~7 sorgu sabit, gün/slot/antrenör sayısından bağımsız)
  async checkConflictsPerDay(groupId, daySettings, days, allCoaches, globalCoachIds, diffCoachPerDay, dayCoachIds) {
    const msgs = [];
    const DN = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
    const fmtH = h => {
      const frac = h % 1;
      const min = frac >= 0.875 ? '45' : frac >= 0.625 ? '30' : frac >= 0.375 ? '15' : '00';
      return `${String(Math.floor(h)).padStart(2,'0')}:${min}`;
    };

    // ── 1. Tüm kort ve antrenör ID'lerini topla ───────────────────────────────
    const allCourtIds = [...new Set(days.flatMap(day =>
      (daySettings[day] ?? []).flatMap(sl => sl.courts ?? [])
    ))];
    const allCoachIds = [...new Set(days.flatMap(day =>
      diffCoachPerDay ? (dayCoachIds[day] ?? []) : globalCoachIds
    ))];

    if (allCourtIds.length === 0 && allCoachIds.length === 0) return msgs;

    const todayDb  = localTimeToDb(new Date().toISOString());
    const todayTs  = new Date().toISOString().split('T')[0] + 'T00:00:00';
    const today2   = new Date().toISOString().split('T')[0];

    // ── 2. Tüm veriyi tek Promise.all ile paralel çek ─────────────────────────
    const [coachMetaRows, courtClosureRows, coachClosureRows, bkRows, lsnClubRows, manualRows] =
      await Promise.all([
        allCoachIds.length > 0
          ? sb.from('club_coaches').select('id, individual_coach_id').in('id', allCoachIds)
          : { data: [] },
        allCourtIds.length > 0
          ? sb.from('court_closures')
              .select('court_id, day_of_week, start_hour, start_minute, end_hour, end_minute, reason, group_id, courts(court_number)')
              .in('court_id', allCourtIds).in('day_of_week', days)
              .eq('closure_type', 'recurring_weekly').eq('is_active', true)
          : { data: [] },
        allCoachIds.length > 0
          ? sb.from('court_closures')
              .select('court_id, day_of_week, start_hour, start_minute, end_hour, end_minute, reason, group_id, coach_id, courts(court_number)')
              .in('coach_id', allCoachIds).in('day_of_week', days)
              .eq('closure_type', 'recurring_weekly').eq('is_active', true)
          : { data: [] },
        allCourtIds.length > 0
          ? sb.from('bookings')
              .select('court_id, start_time, end_time, courts!fk_bookings_court_id(court_number)')
              .in('court_id', allCourtIds).in('status', ['pending', 'confirmed'])
              .gte('start_time', todayDb)
          : { data: [] },
        allCoachIds.length > 0
          ? sb.from('lessons').select('coach_id, club_coach_id, start_time, end_time, student_name')
              .in('club_coach_id', allCoachIds).neq('status', 'cancelled').gte('start_time', todayTs)
          : { data: [] },
        allCoachIds.length > 0
          ? sb.from('club_manual_lessons').select('coach_id, date, start_time, end_time, student_name')
              .in('coach_id', allCoachIds).gte('date', today2)
          : { data: [] },
      ]);

    // individual_coach_id'leri topla, tek ek sorguyla dersleri çek
    const indToClub = {};
    const individualCoachIds = [];
    for (const r of coachMetaRows.data ?? []) {
      if (r.individual_coach_id) {
        indToClub[r.individual_coach_id] = r.id;
        individualCoachIds.push(r.individual_coach_id);
      }
    }
    const lsnIndRows = individualCoachIds.length > 0
      ? (await sb.from('lessons').select('coach_id, club_coach_id, start_time, end_time, student_name')
          .in('coach_id', individualCoachIds).neq('status', 'cancelled').gte('start_time', todayTs)).data ?? []
      : [];

    // ── 3. Lookup map'leri oluştur (in-memory) ────────────────────────────────
    const mk = (map, key, val) => { (map[key] = map[key] || []).push(val); };

    // Kort closure: key = `${court_id}_${day}`
    const courtClosureMap = {};
    for (const r of courtClosureRows.data ?? []) mk(courtClosureMap, `${r.court_id}_${r.day_of_week}`, r);

    // Antrenör closure: key = `${coach_id}_${day}`
    const coachClosureMap = {};
    for (const r of coachClosureRows.data ?? []) mk(coachClosureMap, `${r.coach_id}_${r.day_of_week}`, r);

    // Booking: key = `${court_id}_${dow_tr}` (dbTimeToLocal ile TR saati)
    const bkMap = {};
    for (const b of bkRows.data ?? []) {
      const ls = new Date(dbTimeToLocal(b.start_time));
      const le = new Date(dbTimeToLocal(b.end_time));
      mk(bkMap, `${b.court_id}_${ls.getDay()}`, {
        courtNum: b.courts?.court_number ?? '?',
        bsh: ls.getHours() + ls.getMinutes() / 60,
        beh: le.getHours() + le.getMinutes() / 60,
      });
    }

    // Ders: key = `${club_coach_id}_${dow}`
    const lessonMap = {};
    for (const l of [...lsnIndRows, ...(lsnClubRows.data ?? [])]) {
      const clubId = l.club_coach_id || indToClub[l.coach_id];
      if (!clubId) continue;
      const ls = new Date(l.start_time);
      const le = new Date(l.end_time);
      mk(lessonMap, `${clubId}_${ls.getDay()}`, {
        lsh: ls.getHours() + ls.getMinutes() / 60,
        leh: le.getHours() + le.getMinutes() / 60,
        student: l.student_name,
      });
    }

    // Manuel ders: key = `${coach_id}_${dow}`
    const manualMap = {};
    for (const ml of manualRows.data ?? []) {
      const [msh, msm] = (ml.start_time ?? '0:0').split(':').map(Number);
      const [meh, mem] = (ml.end_time   ?? '0:0').split(':').map(Number);
      mk(manualMap, `${ml.coach_id}_${new Date(ml.date + 'T12:00:00').getDay()}`, {
        lsh: msh + msm / 60, leh: meh + mem / 60, student: ml.student_name,
      });
    }

    // ── 4. Çakışma kontrolü — tamamen in-memory ───────────────────────────────
    for (const day of days) {
      const slots = daySettings[day] ?? [{ courts: [], start: 9, end: 11 }];
      const coachIds = diffCoachPerDay ? (dayCoachIds[day] ?? []) : globalCoachIds;
      const effectiveCoaches = allCoaches.filter(c => coachIds.includes(c.id));

      for (const { courts: dayCourts = [], start = 9, end = 11 } of slots) {
        if (!dayCourts.length) continue;
        const startMins = start * 60, endMins = end * 60;

        for (const courtId of dayCourts) {
          // Kort closure çakışması
          for (const row of courtClosureMap[`${courtId}_${day}`] ?? []) {
            if (row.group_id === groupId) continue;
            const rs = (row.start_hour + (row.start_minute ?? 0) / 60) * 60;
            const re = (row.end_hour   + (row.end_minute   ?? 0) / 60) * 60;
            if (startMins >= re || endMins <= rs) continue;
            const label = row.reason ? ` (${row.reason})` : '';
            msgs.push({ type: 'court', msg: `Kort ${row.courts?.court_number ?? '?'} · ${DN[day]} ${fmtH(row.start_hour + (row.start_minute??0)/60)}–${fmtH(row.end_hour + (row.end_minute??0)/60)} dolu${label}` });
          }

          // Rezervasyon çakışması
          const seenBk = new Set();
          for (const b of bkMap[`${courtId}_${day}`] ?? []) {
            if (startMins >= b.beh * 60 || endMins <= b.bsh * 60) continue;
            const bkKey = `${courtId}_${day}`;
            if (!seenBk.has(bkKey)) {
              seenBk.add(bkKey);
              msgs.push({ type: 'court', msg: `Kort ${b.courtNum} · ${DN[day]} ${fmtH(b.bsh)}–${fmtH(b.beh)} aktif rezervasyon var` });
            }
          }
        }

        for (const coach of effectiveCoaches) {
          // Antrenör closure çakışması
          for (const row of coachClosureMap[`${coach.id}_${day}`] ?? []) {
            if (row.group_id === groupId) continue;
            const rs = (row.start_hour + (row.start_minute ?? 0) / 60) * 60;
            const re = (row.end_hour   + (row.end_minute   ?? 0) / 60) * 60;
            if (startMins >= re || endMins <= rs) continue;
            msgs.push({ type: 'coach', msg: `${coach.full_name} · Kort ${row.courts?.court_number ?? '?'} ${DN[day]} ${fmtH(row.start_hour + (row.start_minute??0)/60)}–${fmtH(row.end_hour + (row.end_minute??0)/60)}` });
          }

          // Ders çakışması
          const seen = new Set();
          for (const l of lessonMap[`${coach.id}_${day}`] ?? []) {
            const key = `${coach.id}_${day}_${fmtH(start)}_${fmtH(end)}`;
            if (start < l.leh && end > l.lsh && !seen.has(key)) {
              seen.add(key);
              msgs.push({ type: 'coach', msg: `${coach.full_name} · Ders: ${l.student || 'Öğrenci'} her ${DN[day]} ${fmtH(start)}–${fmtH(end)}` });
            }
          }

          // Manuel ders çakışması
          const seen2 = new Set();
          for (const ml of manualMap[`${coach.id}_${day}`] ?? []) {
            const key2 = `${coach.id}_${day}_${fmtH(start)}_${fmtH(end)}`;
            if (start < ml.leh && end > ml.lsh && !seen2.has(key2)) {
              seen2.add(key2);
              msgs.push({ type: 'coach', msg: `${coach.full_name} · Manuel ders: ${ml.student || 'Öğrenci'} her ${DN[day]}` });
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
    // Bağlı player_lesson_packages kayıtlarını bul
    const { data: playerPkgs } = await sb
      .from('player_lesson_packages')
      .select('id')
      .eq('package_id', id);
    const playerPkgIds = (playerPkgs || []).map(p => p.id);

    // lesson_package_sessions → player_lesson_packages → lesson_packages sırasıyla sil
    if (playerPkgIds.length > 0) {
      const { error: sessErr } = await sb
        .from('lesson_package_sessions')
        .delete()
        .in('player_package_id', playerPkgIds);
      if (sessErr) throw sessErr;

      const { error: plpErr } = await sb
        .from('player_lesson_packages')
        .delete()
        .in('id', playerPkgIds);
      if (plpErr) throw plpErr;
    }

    const { error } = await sb.from('lesson_packages').delete().eq('id', id);
    if (error) throw error;
  },

  async getPlayerPackages(clubId) {
    const { data, error } = await sb
      .from('player_lesson_packages')
      .select(`
        *,
        package:lesson_packages(id, name, total_lessons, price, validity_days, coach_percentage, coach_payout_mode),
        player:profiles!player_id(id, full_name)
      `)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    // Müşteriye bağlı paketlerde güncel adı club_customers'tan çöz (manual_player_name eski kalabilir:
    // müşteri adı CRM'de değişince paket satırındaki serbest metin güncellenmez). Tek doğru kaynak = müşteri.
    const custIds = [...new Set(rows.map(r => r.club_customer_id).filter(Boolean))];
    if (custIds.length > 0) {
      const { data: custs } = await sb.from('club_customers').select('id, full_name').in('id', custIds);
      const nameMap = new Map((custs || []).map(c => [c.id, c.full_name]));
      rows.forEach(r => { if (r.club_customer_id && nameMap.has(r.club_customer_id)) r._customerName = nameMap.get(r.club_customer_id); });
    }
    return rows;
  },

  // Paket satışı finans kaydı (kulüp NET geliri + upfront hoca hakedişi). confirmPayment ve
  // müşteri profilinden paket düzenleme (Bekliyor→Ödendi) tarafından paylaşılır.
  // Kulüp her iki modda da satışta NET payını alır. Hoca payı: upfront → satışta bir kerede;
  // per_session → seans başına birikir (burada yazılmaz).
  async _recordPackageSaleFinances({ clubId, price, playerName, packageName, coachInfo, payoutMode }) {
    const today      = new Date().toISOString().split('T')[0];
    const mode       = payoutMode === 'per_session' ? 'per_session' : 'upfront';
    const total      = Math.round((price || 0) * 100) / 100;
    const coachPct   = coachInfo?.coachPayRate || 0;
    const coachAmt   = coachPct > 0 ? Math.round(total * (coachPct / 100) * 100) / 100 : 0;
    const clubAmt    = Math.round((total - coachAmt) * 100) / 100;
    const promises   = [];
    if (clubAmt > 0) {
      promises.push(sb.from('club_finances').insert({
        club_id: clubId, type: 'income', category: 'Ders Paketi Geliri',
        amount: clubAmt, description: `${packageName} - ${playerName}`, date: today,
      }));
    }
    if (mode === 'upfront' && coachInfo && coachAmt > 0) {
      promises.push(sb.from('coach_earnings').insert({
        club_id:    clubId,
        coach_id:   coachInfo.clubCoachId || null,
        individual_coach_id: coachInfo.individualCoachId || null,
        coach_name: coachInfo.coachName,
        amount:     coachAmt,
        court_fee:  0,
        date:       today,
        description: `Ders Paketi - ${packageName} - ${playerName}`,
        payment_status: 'unpaid',
        collected_by_coach: false,
        court_fee_settled:  false,
      }));
    }
    const results = await Promise.all(promises);
    const failed = results.find(r => r && r.error);
    if (failed) throw new Error(`Gelir/hoca hakediş kaydı yazılamadı: ${failed.error.message}. Lütfen finans kayıtlarını elle kontrol edin.`);
  },

  async confirmPayment(playerPackageId, validityDays, price, playerName, packageName, clubId, coachInfo, payoutMode) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (validityDays || 90));
    const { error } = await sb
      .from('player_lesson_packages')
      .update({ payment_status: 'paid', status: 'active', total_paid: price, expiry_date: expiry.toISOString() })
      .eq('id', playerPackageId);
    if (error) throw error;
    await LessonPackageSvc._recordPackageSaleFinances({ clubId, price, playerName, packageName, coachInfo, payoutMode });
  },

  // Müşteri profilinden mevcut (kayıtlı) paketi düzenle: ödeme durumu, kalan/toplam ders,
  // tahsil edilen tutar, son kullanma, durum, antrenör, notlar. financeOpts verilirse
  // (Bekliyor→Ödendi geçişi) satış finansı da yazılır. Ters geçişte (Ödendi→Bekliyor) finans
  // OTOMATİK geri alınmaz — çağıran taraf kullanıcıyı uyarır.
  async updatePlayerPackage(id, fields, financeOpts) {
    const { error } = await sb.from('player_lesson_packages')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    if (financeOpts) await LessonPackageSvc._recordPackageSaleFinances(financeOpts);
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
      pendingCount: rows.filter(r => r.payment_status === 'pending' && r.status !== 'cancelled').length,
      completedCount: rows.filter(r => r.status === 'completed').length,
    };
  },

  async searchPlayers(query) {
    if (!query || !query.trim()) return [];
    const { data, error } = await sb
      .from('profiles')
      .select('id, full_name, email')
      .ilike('full_name', `%${query.trim()}%`)
      .eq('user_type', 'player')
      .limit(20);
    if (error) throw error;
    return data ?? [];
  },

  async manualEnrollPlayer(enrollData) {
    const { data: pkg, error: pkgErr } = await sb
      .from('lesson_packages')
      .select('*')
      .eq('id', enrollData.package_id)
      .single();
    if (pkgErr || !pkg) throw new Error('Paket bulunamadı');

    const usedLessons = enrollData.used_lessons ?? 0;
    const isPaid = (enrollData.payment_status ?? 'paid') === 'paid';
    let expiryDate = null;
    if (isPaid) {
      const d = new Date();
      d.setDate(d.getDate() + pkg.validity_days);
      expiryDate = d.toISOString();
    }
    const totalPaid = enrollData.total_paid ?? (isPaid ? pkg.price : null);

    const { data: plp, error } = await sb
      .from('player_lesson_packages')
      .insert({
        player_id:          enrollData.player_id ?? null,
        manual_player_name: enrollData.player_id ? null : (enrollData.manual_player_name?.trim() ?? null),
        manual_player_phone: enrollData.player_id ? null : (enrollData.manual_player_phone?.trim() ?? null),
        club_customer_id:   enrollData.club_customer_id ?? null,
        package_id:         enrollData.package_id,
        club_id:            enrollData.club_id,
        coach_id:           enrollData.coach_id ?? pkg.coach_id ?? null,
        coach_payout_mode:  pkg.coach_payout_mode ?? 'upfront',
        total_lessons:      pkg.total_lessons,
        used_lessons:       usedLessons,
        payment_status:     isPaid ? 'paid' : 'pending',
        status:             'active',
        total_paid:         totalPaid,
        expiry_date:        expiryDate,
        notes:              enrollData.notes ?? null,
      })
      .select().single();
    if (error) throw error;

    if (isPaid && totalPaid && totalPaid > 0) {
      const displayName = enrollData.player_id
        ? (enrollData.player_name ?? 'Üye')
        : (enrollData.manual_player_name?.trim() ?? 'Üye');
      const today      = new Date().toISOString().split('T')[0];
      // Kulüp her iki modda da NET payını satışta alır; hoca payı upfront'ta satışta, per_session'da seans başına.
      const mode       = pkg.coach_payout_mode === 'per_session' ? 'per_session' : 'upfront';
      const total      = Math.round(totalPaid * 100) / 100;
      // Öncelik: pakette tanımlı % (varsa) → yoksa hocanın profil oranı
      const coachPct   = Number(pkg.coach_percentage) > 0 ? Number(pkg.coach_percentage) : (enrollData.coach_pay_rate || 0);
      const coachAmt   = (coachPct > 0 && enrollData.coach_id)
        ? Math.round(total * (coachPct / 100) * 100) / 100 : 0;
      const clubAmt    = Math.round((total - coachAmt) * 100) / 100;
      const promises   = [];
      if (clubAmt > 0) {
        promises.push(sb.from('club_finances').insert({
          club_id: enrollData.club_id, type: 'income', category: 'Ders Paketi Geliri',
          amount: clubAmt, description: `${pkg.name} - ${displayName}`, date: today,
        }));
      }
      if (mode === 'upfront' && coachAmt > 0 && enrollData.coach_name) {
        promises.push(sb.from('coach_earnings').insert({
          club_id:    enrollData.club_id,
          coach_id:   enrollData.coach_db_id || null,
          coach_name: enrollData.coach_name,
          amount:     coachAmt,
          court_fee:  0,
          date:       today,
          description: `Ders Paketi - ${pkg.name} - ${displayName}`,
          payment_status: 'unpaid',
        }));
      }
      const meResults = await Promise.all(promises);
      const meFailed = meResults.find(r => r && r.error);
      if (meFailed) throw new Error(`Kayıt oluşturuldu ancak gelir/hoca hakediş kaydı yazılamadı: ${meFailed.error.message}. Lütfen finans kayıtlarını elle kontrol edin.`);
    }
    return plp;
  },

  async cancelPlayerPackage(playerPackageId, opts) {
    const { error } = await sb
      .from('player_lesson_packages')
      .update({ status: 'cancelled' })
      .eq('id', playerPackageId);
    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];
    const refund = opts?.refund;
    const clawback = opts?.coachClawback;

    // Önce hoca clawback tutarını hesapla — gideri netleştirmek için gerekli (Model B).
    let coachRefund = 0;
    let cc = null;
    if (clawback && clawback.individualCoachId && clawback.totalLessons > 0 && clawback.remaining > 0) {
      // pp.coach_id kimi akışta club_coaches.id, kimi akışta profiles.id (individual_coach_id) olabiliyor;
      // ikisiyle de eşleştir ki hoca kaydı garanti bulunsun.
      const { data } = await sb.from('club_coaches')
        .select('id, full_name, coach_pay_rate, individual_coach_id')
        .or(`id.eq.${clawback.individualCoachId},individual_coach_id.eq.${clawback.individualCoachId}`)
        .eq('club_id', clawback.clubId).maybeSingle();
      cc = data || null;
      if (cc) {
        const pct = Number(clawback.packageCoachPct) > 0 ? Number(clawback.packageCoachPct) : (cc.coach_pay_rate || 0);
        const coachShare = (Number(clawback.totalPaid) || 0) * (pct / 100);
        coachRefund = Math.round(coachShare * clawback.remaining / clawback.totalLessons * 100) / 100;
      }
    }

    // 1) Kullanılmayan derslerin ücreti iade → gider (Model B: yalnız KULÜP payı yazılır;
    //    hocadan geri alınan pay aşağıda ayrı clawback satırıyla döner, bu yüzden giderden düşülür).
    if (refund && refund.amount > 0) {
      const clubExpense = Math.round((refund.amount - coachRefund) * 100) / 100;
      if (clubExpense > 0) {
        const { error: expErr } = await sb.from('club_finances').insert({
          club_id:     refund.clubId,
          type:        'expense',
          category:    'Ders Paketi İadesi',
          amount:      clubExpense,
          description: `İade - ${refund.packageName} - ${refund.playerName} (${refund.remaining} kullanılmayan ders)`,
          date:        today,
        });
        if (expErr) throw new Error(`Paket iptal edildi ancak iade gideri yazılamadı: ${expErr.message}. Lütfen finans kaydını elle kontrol edin.`);
      }
    }

    // 2) Hoca toplu ödendiyse (upfront) hoca hakedişini kullanılmayan pay kadar azalt (negatif düzeltme)
    if (cc && coachRefund > 0) {
      const { error: cbErr } = await sb.from('coach_earnings').insert({
        club_id:            clawback.clubId,
        coach_id:           cc.id,
        individual_coach_id: cc.individual_coach_id || null,
        coach_name:         cc.full_name,
        student_name:       clawback.playerName || null,
        amount:             -coachRefund,
        court_fee:          0,
        date:               today,
        description:        `Paket iptali - hoca iade payı - ${clawback.packageName} - ${clawback.playerName} (${clawback.remaining} kullanılmayan ders)`,
        payment_status:     'unpaid',
      });
      if (cbErr) throw new Error(`Paket iptal edildi ve iade gideri yazıldı ancak hoca iade payı yazılamadı: ${cbErr.message}. Lütfen hoca hakedişini elle kontrol edin.`);
    }
  },

  async enrollCustomerPackage({ clubId, customerUserId, customerName,
                                 packageId, packageName, totalLessons,
                                 customPrice, customCoachPct, validityDays,
                                 coachId, paymentStatus, totalPaid, notes,
                                 clubCustomerId }) {
    // Mobil ile birebir: atomik RPC (net bölüşüm modeli). Paket + kulüp NET payı
    // (club_finances) + upfront hoca hakedişi (coach_earnings, individual_coach_id
    // dahil) TEK transaction'da yazılır — eski "paket oluştu, finans patladı"
    // tutarsızlığı olamaz. Pay/oran/expiry/status hesabı sunucuda (tek kaynak).
    const { data, error } = await sb.rpc('enroll_customer_package', {
      p_club_id:            clubId,
      p_player_id:          customerUserId || null,
      p_manual_player_name: customerUserId ? null : (customerName?.trim() || null),
      p_package_id:         packageId || null,
      p_package_name:       packageName,
      p_total_lessons:      Number(totalLessons),
      p_custom_price:       packageId ? null : (customPrice ? Number(customPrice) : null),
      p_custom_coach_pct:   packageId ? null : (customCoachPct != null ? Number(customCoachPct) : 70),
      p_validity_days:      validityDays ? Number(validityDays) : null,
      p_coach_id:           coachId || null,
      p_payment_status:     paymentStatus,
      p_total_paid:         paymentStatus === 'paid' ? (Number(totalPaid) || 0) : 0,
      p_club_customer_id:   clubCustomerId || null,
      p_notes:              notes || null,
    });
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
      .gte('start_time', localTimeToDb(`${dateStr}T00:00`)).lte('start_time', localTimeToDb(`${dateStr}T23:59`))
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

// ═══════════════════════════════════════════════════════════════
// CUSTOMER SERVICE (CRM — kulüp müşterileri)
// ═══════════════════════════════════════════════════════════════
const CustomerSvc = {

  async getClubCustomers(clubId) {
    const { data, error } = await sb.from('club_customers')
      .select('*').eq('club_id', clubId).eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async createCustomer(clubId, data) {
    const { data: c, error } = await sb.from('club_customers').insert({
      club_id:    clubId,
      full_name:  data.full_name.trim(),
      phone:      data.phone.trim(),
      email:      data.email?.trim()      || null,
      gender:     data.gender             || null,
      birth_date: data.birth_date         || null,
      notes:      data.notes?.trim()      || null,
    }).select().single();
    if (error) throw error;
    return c;
  },

  async updateCustomer(id, data) {
    const { data: c, error } = await sb.from('club_customers').update({
      full_name:  data.full_name.trim(),
      phone:      data.phone.trim(),
      email:      data.email?.trim()      || null,
      gender:     data.gender             || null,
      birth_date: data.birth_date         || null,
      notes:      data.notes?.trim()      || null,
    }).eq('id', id).select().single();
    if (error) throw error;
    return c;
  },

  async deleteCustomer(id) {
    const { error } = await sb.from('club_customers').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },

  async getCustomerStats(customerId, clubId, customerUserId, customerName) {
    const { data: courts } = await sb.from('courts').select('id').eq('club_id', clubId);
    const courtIds = (courts ?? []).map(c => c.id);
    const { data: coaches } = await sb.from('club_coaches').select('id').eq('club_id', clubId);
    const coachIds = (coaches ?? []).map(c => c.id);

    // Manuel özel dersler (kişi bağı: player_id / club_customer_id; isim = eski kayıt fallback)
    const mlOr = [];
    if (customerUserId) mlOr.push(`player_id.eq.${customerUserId}`);
    if (customerId)     mlOr.push(`club_customer_id.eq.${customerId}`);
    if (customerName?.trim() && !customerName.includes(',')) mlOr.push(`student_name.eq.${customerName.trim()}`);

    const [bk1, bk2, pkgs, pkgsManual, lessons, lessonsName, manualLs] = await Promise.all([
      courtIds.length > 0
        ? sb.from('bookings').select('total_amount').eq('club_customer_id', customerId).in('court_id', courtIds).neq('status', 'cancelled')
        : { data: [] },
      customerUserId && courtIds.length > 0
        ? sb.from('bookings').select('total_amount').eq('user_id', customerUserId).in('court_id', courtIds).neq('status', 'cancelled').is('club_customer_id', null)
        : { data: [] },
      customerUserId
        ? sb.from('player_lesson_packages').select('total_paid').eq('player_id', customerUserId).eq('club_id', clubId).eq('payment_status', 'paid').neq('status', 'cancelled')
        : { data: [] },
      customerName?.trim()
        ? sb.from('player_lesson_packages').select('total_paid').is('player_id', null).eq('manual_player_name', customerName.trim()).eq('club_id', clubId).eq('payment_status', 'paid').neq('status', 'cancelled')
        : { data: [] },
      customerUserId && coachIds.length > 0
        ? sb.from('lessons').select('amount').eq('student_id', customerUserId).in('club_coach_id', coachIds).neq('status', 'cancelled').eq('payment_status', 'paid')
        : { data: [] },
      customerName?.trim() && coachIds.length > 0
        ? sb.from('lessons').select('amount').is('student_id', null).eq('student_name', customerName.trim()).in('club_coach_id', coachIds).neq('status', 'cancelled').eq('payment_status', 'paid')
        : { data: [] },
      mlOr.length > 0
        ? sb.from('club_manual_lessons').select('id, amount').eq('club_id', clubId).eq('payment_status', 'paid').or(mlOr.join(','))
        : { data: [] },
    ]);
    const allBk   = [...(bk1.data ?? []), ...(bk2.data ?? [])];
    const allPkgs = [...(pkgs.data ?? []), ...(pkgsManual.data ?? [])];
    const allLs   = [...(lessons.data ?? []), ...(lessonsName.data ?? [])];
    const allMl   = manualLs.data ?? [];
    return {
      totalSpent: Math.round((
        allBk.reduce((s, b) => s + (b.total_amount || 0), 0) +
        allPkgs.reduce((s, p) => s + (p.total_paid || 0), 0) +
        allLs.reduce((s, l) => s + (l.amount || 0), 0) +
        allMl.reduce((s, l) => s + (l.amount || 0), 0)
      ) * 100) / 100,
      bookingCount: allBk.length,
      packageCount: allPkgs.length,
    };
  },

  async getCustomerLessons(customerUserId, clubId, customerName, customerId) {
    const { data: coaches } = await sb.from('club_coaches').select('id, individual_coach_id, profiles(full_name)').eq('club_id', clubId);
    const coachIds = (coaches ?? []).map(c => c.id);
    if (coachIds.length === 0) return [];

    const coachNameMap = {};
    for (const c of (coaches ?? [])) coachNameMap[c.id] = c.profiles?.full_name ?? '';

    const sel = 'id, date, start_time, end_time, student_name, club_coach_id, location, amount, payment_status, status, lesson_package_sessions(id)';
    const queries = [];
    if (customerUserId) {
      queries.push(sb.from('lessons').select(sel).eq('student_id', customerUserId).in('club_coach_id', coachIds).neq('status', 'cancelled').order('date', { ascending: false }).limit(50));
    }
    if (customerName?.trim()) {
      queries.push(sb.from('lessons').select(sel).is('student_id', null).eq('student_name', customerName.trim()).in('club_coach_id', coachIds).neq('status', 'cancelled').order('date', { ascending: false }).limit(50));
    }

    // Manuel özel dersler (kişi bağı: player_id / club_customer_id; isim = eski kayıt fallback)
    const mlOr = [];
    if (customerUserId) mlOr.push(`player_id.eq.${customerUserId}`);
    if (customerId)     mlOr.push(`club_customer_id.eq.${customerId}`);
    if (customerName?.trim() && !customerName.includes(',')) mlOr.push(`student_name.eq.${customerName.trim()}`);
    if (mlOr.length > 0) {
      queries.push(sb.from('club_manual_lessons')
        .select('id, date, start_time, end_time, student_name, coach_id, coach_name, location, amount, payment_status')
        .eq('club_id', clubId).or(mlOr.join(','))
        .order('date', { ascending: false }).limit(50)
        .then(res => ({
          data: (res.data ?? []).map(m => ({
            id:               m.id,
            date:             m.date ?? null,
            start_time:       `${m.date}T${(m.start_time || '').slice(0, 5)}`,
            end_time:         m.end_time ? `${m.date}T${(m.end_time || '').slice(0, 5)}` : null,
            student_name:     m.student_name ?? null,
            club_coach_id:    m.coach_id ?? null,
            location:         m.location ?? null,
            amount:           m.amount ?? 0,
            payment_status:   m.payment_status ?? 'unpaid',
            coach_name_manual: m.coach_name ?? null,
            lesson_package_sessions: [],
          })),
        })));
    }

    const results = await Promise.all(queries);
    const seen = new Set();
    const rows = [];
    for (const res of results) {
      for (const row of (res.data ?? [])) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          rows.push({
            id:               row.id,
            start_time:       row.start_time ?? row.date ?? '',
            end_time:         row.end_time ?? null,
            date:             row.date ?? null,
            student_name:     row.student_name ?? null,
            coach_name:       coachNameMap[row.club_coach_id] ?? row.coach_name_manual ?? null,
            location:         row.location ?? null,
            amount:           row.amount ?? 0,
            payment_status:   row.payment_status ?? 'pending',
            is_package_lesson: Array.isArray(row.lesson_package_sessions) && row.lesson_package_sessions.length > 0,
          });
        }
      }
    }
    return rows.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  },

  async getCustomerBookings(customerId, clubId, customerUserId) {
    const { data: courts } = await sb.from('courts').select('id').eq('club_id', clubId);
    const courtIds = (courts ?? []).map(c => c.id);
    if (courtIds.length === 0) return [];
    const sel = 'id, start_time, end_time, status, payment_status, total_amount, court:courts!fk_bookings_court_id(court_number, court_type)';
    const [r1, r2] = await Promise.all([
      sb.from('bookings').select(sel)
        .eq('club_customer_id', customerId).in('court_id', courtIds)
        .order('start_time', { ascending: false }).limit(30),
      customerUserId
        ? sb.from('bookings').select(sel)
            .eq('user_id', customerUserId).in('court_id', courtIds)
            .is('club_customer_id', null).order('start_time', { ascending: false }).limit(30)
        : { data: [] },
    ]);
    const seen = new Set();
    const rows = [];
    for (const b of [...(r1.data ?? []), ...(r2.data ?? [])]) {
      if (!seen.has(b.id)) { seen.add(b.id); rows.push(b); }
    }
    return rows
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 30)
      .map(b => ({ ...b, start_time: dbTimeToLocal(b.start_time), end_time: dbTimeToLocal(b.end_time) }));
  },

  async getCustomerLessonPackages(customerId, clubId, customerUserId, customerName) {
    // Öğrenciler sekmesiyle aynı mantık: tüm paketleri çek, istemci tarafında filtrele.
    // Bu sayede player_id farklı bir hesaba bağlı olsa da profile join'ındaki full_name eşleşirse bulunur.
    const sel = '*, package:lesson_packages(name, total_lessons, price, validity_days, coach_percentage, coach_payout_mode), player:profiles!player_id(id, full_name)';
    const { data, error } = await sb.from('player_lesson_packages')
      .select(sel)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const name = customerName?.trim()?.toLowerCase();
    return (data ?? []).filter(p =>
      p.status !== 'cancelled' && (
        (customerUserId && p.player_id === customerUserId) ||
        (name && p.manual_player_name?.trim()?.toLowerCase() === name) ||
        (name && p.player?.full_name?.trim()?.toLowerCase() === name)
      )
    );
  },

  // ANINDA eşleme — paylaşımlı RPC (ders/paket/rezervasyon/grup tam birleşme +
  // hesap bilgilerini müşteri üstüne yazma). Mobil ile birebir aynı.
  async linkToProfile(customerId, userId) {
    const { error } = await sb.rpc('link_customer_to_account', {
      p_customer_id: customerId, p_user_id: userId,
    });
    if (error) throw error;
  },

  // ── Rıza tabanlı eşleme (kulüp davet gönderir → oyuncu mobilden Kabul/Ret) ──
  async requestAccountLink(customerId, userId) {
    const { error } = await sb.rpc('request_customer_account_link', {
      p_customer_id: customerId, p_user_id: userId,
    });
    if (error) throw error;
  },
  // Müşterinin mevcut eşleme kaydı (bekleyen/onaylı) — durum + Geri Al için
  async getAccountLink(customerId) {
    const { data } = await sb.from('customer_account_links')
      .select('id, status, user_id')
      .eq('customer_id', customerId)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle();
    return data || null;
  },
  async revertAccountLink(linkId) {
    const { error } = await sb.rpc('revert_customer_account_link', { p_link_id: linkId });
    if (error) throw error;
  },

  // ── Otomatik telefon-eşleşme önerisi (suggested_user_id) ──
  async getProfileBrief(userId) {
    const { data } = await sb.from('profiles').select('id, full_name, email').eq('id', userId).maybeSingle();
    return data || null;
  },
  async dismissSuggestion(customerId) {
    await sb.from('club_customers').update({ suggested_user_id: null }).eq('id', customerId);
  },

  // ── Telefon-otoriter dedup (müşteri ekleme) ──
  // Bu kulüpte aynı numaralı aktif müşteri var mı (mükerrer uyarısı).
  async findCustomerByPhone(phone, clubId, excludeId) {
    const norm = (p) => { const d = (p || '').replace(/\D/g, ''); return d.length > 10 ? d.slice(-10) : d; };
    const target = norm(phone);
    if (target.length < 7 || /^(\d)\1*$/.test(target)) return null;  // eksik/placeholder
    let q = sb.from('club_customers').select('id, full_name, phone')
      .eq('club_id', clubId).eq('is_active', true).ilike('phone', `%${target.slice(-7)}%`);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q;
    const hit = (data || []).find(c => norm(c.phone) === target);
    return hit ? { id: hit.id, full_name: hit.full_name } : null;
  },
  // Aynı numaralı CourtyCLUB oyuncu hesapları (0/1/çok).
  async findAccountsByPhone(phone) {
    const norm = (p) => { const d = (p || '').replace(/\D/g, ''); return d.length > 10 ? d.slice(-10) : d; };
    const target = norm(phone);
    if (target.length < 7 || /^(\d)\1*$/.test(target)) return [];
    const { data } = await sb.from('profiles').select('id, full_name, email, phone')
      .eq('user_type', 'player').not('phone', 'is', null).ilike('phone', `%${target.slice(-7)}%`).limit(20);
    return (data || []).filter(p => norm(p.phone) === target)
      .map(p => ({ id: p.id, full_name: p.full_name, email: p.email || '' }));
  },

  // ── Grup "aynı kişi mi?" onayı için aday listeleri ──
  // Bu kulüpte aynı numaralı (gerçek telefon) TÜM aktif müşteriler.
  async findCustomersByPhone(phone, clubId) {
    const norm = (p) => { const d = (p || '').replace(/\D/g, ''); return d.length > 10 ? d.slice(-10) : d; };
    const target = norm(phone);
    if (target.length < 7 || /^(\d)\1*$/.test(target)) return [];
    const { data } = await sb.from('club_customers').select('id, full_name, phone')
      .eq('club_id', clubId).eq('is_active', true).ilike('phone', `%${target.slice(-7)}%`);
    return (data || []).filter(c => norm(c.phone) === target)
      .map(c => ({ id: c.id, full_name: c.full_name }));
  },
  // İsmi BENZER aktif müşteriler (telefonsuz "çocuk" için "aynı çocuk mu?" onayı).
  async findSimilarCustomersByName(name, clubId) {
    const nm = (name || '').trim();
    const first = nm.split(/\s+/)[0] || '';
    if (first.length < 2) return [];
    const { data } = await sb.from('club_customers').select('id, full_name')
      .eq('club_id', clubId).eq('is_active', true).ilike('full_name', `%${first}%`).limit(30);
    return (data || []).filter(c => namesLookSimilar(c.full_name, nm))
      .map(c => ({ id: c.id, full_name: c.full_name }));
  },

  // Müşterinin aktif kulüp üyeliği + paketi (rozet için). Hesap → telefon → isim ile eşler.
  async getCustomerMembership(clubId, userId, fullName, phone) {
    const nowIso = new Date().toISOString();
    const { data } = await sb.from('club_memberships')
      .select('user_id, member_name, member_phone, status, expires_at, package:club_membership_packages(name)')
      .eq('club_id', clubId)
      .in('status', ['active', 'pending'])
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)   // süresi geçenleri gösterme
      .order('created_at', { ascending: false });          // en güncel üyelik önce
    if (!data || data.length === 0) return null;
    const norm = (p) => { const d = (p || '').replace(/\D/g, ''); return d.length > 10 ? d.slice(-10) : d; };
    const p10 = norm(phone);
    const realPhone = p10.length === 10 && !/^(\d)\1{9}$/.test(p10);
    const nm = (fullName || '').trim().toLowerCase();
    const hit = data.find(m =>
      (userId && m.user_id === userId) ||
      (realPhone && norm(m.member_phone) === p10) ||
      (nm && (m.member_name || '').trim().toLowerCase() === nm)
    );
    if (!hit) return null;
    return { packageName: hit.package?.name || null, status: hit.status };
  },
};

// ── Toplu Bildirim (Custom Push) ───────────────────────────────
// Kaynak: src/lib/supabase/clubBroadcastService.ts — mobil ile birebir.
// send_club_broadcast SECURITY DEFINER RPC ile hedef kullanıcılara notifications
// satırı ekler; push tetikleyicisi otomatik gönderir. Yalnız aktif + hesabı olanlar.
const BroadcastSvc = {
  // Alıcı sayıları (yalnız aktif + uygulama hesabı olan). Kulüp RLS ile okuyabildiği için istemcide sayılır.
  async getRecipientCounts(clubId) {
    const [membersRes, customersRes] = await Promise.all([
      sb.from('club_memberships').select('user_id')
        .eq('club_id', clubId).eq('status', 'active').not('user_id', 'is', null),
      sb.from('club_customers').select('user_id')
        .eq('club_id', clubId).eq('is_active', true).not('user_id', 'is', null),
    ]);
    if (membersRes.error) throw membersRes.error;
    if (customersRes.error) throw customersRes.error;
    const memberIds   = new Set((membersRes.data   || []).map(r => r.user_id));
    const customerIds = new Set((customersRes.data || []).map(r => r.user_id));
    const bothIds     = new Set([...memberIds, ...customerIds]);
    return { members: memberIds.size, customers: customerIds.size, both: bothIds.size };
  },
  // Seçili kitleye özel push gönderir. Dönen: gerçekten gönderilen kişi sayısı.
  async sendBroadcast(audience, title, message) {
    const { data, error } = await sb.rpc('send_club_broadcast', {
      p_audience: audience, p_title: title, p_message: message,
    });
    if (error) throw error;
    return data?.sent ?? 0;
  },
};
