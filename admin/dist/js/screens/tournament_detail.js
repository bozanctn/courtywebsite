function getSetsWon(sets) {
  return sets.reduce((acc, s) => {
    if (s.a > s.b) acc.a++;
    else if (s.b > s.a) acc.b++;
    return acc;
  }, { a: 0, b: 0 });
}
function formatSets(sets) {
  return sets.map((s) => `${s.a}-${s.b}`).join("  ");
}
function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function assignSlot(row, slot, m) {
  if (!m) return;
  if (m.id) row[slot + "_id"] = m.id;
  else if (m.name) row[slot + "_name"] = m.name;
}
function minPlayersFor(type) {
  const min = { americano_teams: 4, americano_singles: 2, singles_knockout: 2, doubles_knockout: 4, singles_league: 2, doubles_league: 4 };
  return min[type] ?? 2;
}
function toMembers(participants) {
  const members = [];
  for (const p of participants) {
    if (p.player_id) members.push({ id: p.player_id });
    else if (p.manual_name) members.push({ name: p.manual_name });
    if (p.partner_id) members.push({ id: p.partner_id });
  }
  return members;
}
function toTeams(participants) {
  const teams = [];
  const solos = [];
  for (const p of participants) {
    if (p.player_id && p.partner_id) teams.push([{ id: p.player_id }, { id: p.partner_id }]);
    else if (p.player_id) solos.push({ id: p.player_id });
    else if (p.manual_name) solos.push({ name: p.manual_name });
  }
  const shuffledSolos = shuffleArr(solos);
  if (shuffledSolos.length % 2 === 1) {
    throw new Error("\xC7ift format\u0131nda e\u015Fle\u015Femeyen 1 oyuncu kald\u0131. Bir oyuncu daha ekleyin veya bir oyuncuyu \xE7\u0131kar\u0131n.");
  }
  for (let i = 0; i + 1 < shuffledSolos.length; i += 2) teams.push([shuffledSolos[i], shuffledSolos[i + 1]]);
  return shuffleArr(teams);
}
function buildAmericanoMatches(tid, members, rounds, courts, isTeams) {
  const n = members.length;
  const shuffled = shuffleArr(members);
  const step = Math.max(1, Math.floor(n / Math.max(rounds, 1)));
  const rows = [];
  for (let r = 0; r < rounds; r++) {
    const offset = r * step % n;
    const rotated = [...shuffled.slice(offset), ...shuffled.slice(0, offset)];
    for (let c = 0; c < courts; c++) {
      const base = c * (isTeams ? 4 : 2);
      if (base + (isTeams ? 3 : 1) >= n) break;
      const row = {
        tournament_id: tid,
        round_number: r + 1,
        court_name: `Kort ${c + 1}`,
        bracket_position: c,
        score_a: 0,
        score_b: 0,
        sets_data: [],
        status: "upcoming"
      };
      if (isTeams) {
        assignSlot(row, "team_a_player1", rotated[base]);
        assignSlot(row, "team_a_player2", rotated[base + 1]);
        assignSlot(row, "team_b_player1", rotated[base + 2]);
        assignSlot(row, "team_b_player2", rotated[base + 3]);
      } else {
        assignSlot(row, "team_a_player1", rotated[base]);
        assignSlot(row, "team_b_player1", rotated[base + 1]);
      }
      rows.push(row);
    }
  }
  return rows;
}
function buildKnockoutRound1(tid, teams) {
  const shuffled = shuffleArr(teams);
  const n = shuffled.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
  const byes = bracketSize - n;
  const rows = [];
  for (let i = 0; i < byes; i++) {
    const row = {
      tournament_id: tid,
      round_number: 1,
      court_name: "Bay",
      bracket_position: i,
      score_a: 1,
      score_b: 0,
      sets_data: [],
      status: "completed"
    };
    assignSlot(row, "team_a_player1", shuffled[i][0]);
    assignSlot(row, "team_a_player2", shuffled[i][1]);
    rows.push(row);
  }
  const rest = shuffled.slice(byes);
  for (let i = 0; i + 1 < rest.length; i += 2) {
    const matchIdx = i / 2;
    const row = {
      tournament_id: tid,
      round_number: 1,
      court_name: `Kort ${matchIdx + 1}`,
      bracket_position: byes + matchIdx,
      score_a: 0,
      score_b: 0,
      sets_data: [],
      status: "upcoming"
    };
    assignSlot(row, "team_a_player1", rest[i][0]);
    assignSlot(row, "team_a_player2", rest[i][1]);
    assignSlot(row, "team_b_player1", rest[i + 1][0]);
    assignSlot(row, "team_b_player2", rest[i + 1][1]);
    rows.push(row);
  }
  return rows;
}
function buildRoundRobin(teamCount) {
  const n = teamCount % 2 === 0 ? teamCount : teamCount + 1;
  const indices = Array.from({ length: n }, (_, i) => i < teamCount ? i : -1);
  const result = [];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const iA = indices[i], iB = indices[n - 1 - i];
      if (iA !== -1 && iB !== -1) result.push({ round: r + 1, iA, iB });
    }
    const last = indices[n - 1];
    for (let i = n - 1; i > 1; i--) indices[i] = indices[i - 1];
    indices[1] = last;
  }
  return result;
}
function buildLeagueMatches(tid, teams, courts) {
  const rows = [];
  buildRoundRobin(teams.length).forEach(({ round, iA, iB }, idx) => {
    const row = {
      tournament_id: tid,
      round_number: round,
      court_name: `Kort ${idx % courts + 1}`,
      bracket_position: idx,
      score_a: 0,
      score_b: 0,
      sets_data: [],
      status: "upcoming"
    };
    assignSlot(row, "team_a_player1", teams[iA][0]);
    assignSlot(row, "team_a_player2", teams[iA][1]);
    assignSlot(row, "team_b_player1", teams[iB][0]);
    assignSlot(row, "team_b_player2", teams[iB][1]);
    rows.push(row);
  });
  return rows;
}
function sideTeam(m, side) {
  const team = [];
  const p1Id = side === "a" ? m.team_a_player1_id : m.team_b_player1_id;
  const p1Name = side === "a" ? m.team_a_player1_name : m.team_b_player1_name;
  const p2Id = side === "a" ? m.team_a_player2_id : m.team_b_player2_id;
  const p2Name = side === "a" ? m.team_a_player2_name : m.team_b_player2_name;
  if (p1Id || p1Name) team.push({ id: p1Id || void 0, name: p1Name || void 0 });
  if (p2Id || p2Name) team.push({ id: p2Id || void 0, name: p2Name || void 0 });
  return team;
}
function hydrateMatchNames(m) {
  return {
    ...m,
    sets_data: m.sets_data || [],
    team_a_player1: m.team_a_player1 || (m.team_a_player1_name ? { full_name: m.team_a_player1_name } : null),
    team_a_player2: m.team_a_player2 || (m.team_a_player2_name ? { full_name: m.team_a_player2_name } : null),
    team_b_player1: m.team_b_player1 || (m.team_b_player1_name ? { full_name: m.team_b_player1_name } : null),
    team_b_player2: m.team_b_player2 || (m.team_b_player2_name ? { full_name: m.team_b_player2_name } : null)
  };
}
const T_TYPE_LABEL = {
  americano_teams: "Americano - Tak\u0131mlar",
  americano_singles: "Americano - Bireysel",
  singles_knockout: "Tekler Eleme",
  doubles_knockout: "\xC7iftler Eleme",
  singles_league: "Tekler Lig",
  doubles_league: "\xC7iftler Lig"
};
const T_GENDER_LABEL = { mixed: "Karma", male: "Erkekler", female: "Kad\u0131nlar" };
function ManageTournamentScreen({ tournamentId, onBack }) {
  const { useState, useEffect, useCallback, useMemo } = React;
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [generating, setGenerating] = useState(false);
  const [addPModal, setAddPModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [addingManual, setAddingManual] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [scoreModal, setScoreModal] = useState(null);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [setsEntered, setSetsEntered] = useState([]);
  const [setInputA, setSetInputA] = useState("");
  const [setInputB, setSetInputB] = useState("");
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [savingScore, setSavingScore] = useState(false);
  const load = useCallback(async () => {
    try {
      const [tRes, pRes, mRes, sRes] = await Promise.all([
        sb.from("tournaments").select("*").eq("id", tournamentId).single(),
        sb.from("tournament_participants").select("*, player_profile:profiles!tournament_participants_player_id_fkey(id,full_name,email), partner_profile:profiles!tournament_participants_partner_id_fkey(id,full_name,email)").eq("tournament_id", tournamentId).order("registered_at", { ascending: true }),
        sb.from("tournament_matches").select("*, team_a_player1:profiles!tournament_matches_team_a_player1_id_fkey(full_name), team_a_player2:profiles!tournament_matches_team_a_player2_id_fkey(full_name), team_b_player1:profiles!tournament_matches_team_b_player1_id_fkey(full_name), team_b_player2:profiles!tournament_matches_team_b_player2_id_fkey(full_name)").eq("tournament_id", tournamentId).order("round_number", { ascending: true }).order("bracket_position", { ascending: true }),
        sb.from("tournament_standings").select("*, player1_profile:profiles!tournament_standings_player1_id_fkey(full_name), player2_profile:profiles!tournament_standings_player2_id_fkey(full_name)").eq("tournament_id", tournamentId).order("points", { ascending: false }).order("wins", { ascending: false }).order("games_won", { ascending: false })
      ]);
      if (tRes.error) throw tRes.error;
      setTournament(tRes.data);
      setParticipants(pRes.data || []);
      setMatches((mRes.data || []).map(hydrateMatchNames));
      setStandings((sRes.data || []).map((s) => ({
        ...s,
        player1_profile: s.player1_profile || (s.player1_name ? { full_name: s.player1_name } : null),
        player2_profile: s.player2_profile || (s.player2_name ? { full_name: s.player2_name } : null)
      })));
    } catch (e) {
      console.error(e);
    }
  }, [tournamentId]);
  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);
  const addManualParticipant = async () => {
    if (!manualName.trim()) return;
    setAddingManual(true);
    try {
      const { error } = await sb.from("tournament_participants").insert({
        tournament_id: tournamentId,
        player_id: null,
        manual_name: manualName.trim(),
        status: "registered"
      });
      if (error) throw error;
      setManualName("");
      setAddPModal(false);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setAddingManual(false);
    }
  };
  const removeParticipant = async (p) => {
    const displayName = p.player_profile?.full_name || p.manual_name || "Bu oyuncu";
    if (!confirm(`${displayName} turnuvadan \xE7\u0131kar\u0131ls\u0131n m\u0131?`)) return;
    setRemovingId(p.id);
    try {
      const { error } = await sb.from("tournament_participants").delete().eq("id", p.id);
      if (error) throw error;
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setRemovingId(null);
    }
  };
  const tournamentAccountIds = async () => {
    const { data } = await sb.from("tournament_participants").select("player_id, partner_id").eq("tournament_id", tournamentId);
    const ids = /* @__PURE__ */ new Set();
    (data || []).forEach((r) => {
      if (r.player_id) ids.add(r.player_id);
      if (r.partner_id) ids.add(r.partner_id);
    });
    return [...ids];
  };
  const insertNotifs = async (rows) => {
    try {
      if (!rows || rows.length === 0) return;
      const { error } = await sb.from("notifications").insert(rows);
      if (error) console.error("turnuva bildirimi:", error);
    } catch (e) {
      console.error(e);
    }
  };
  const hasFee = (tournament?.entry_fee ?? 0) > 0;
  const paidCount = participants.filter((p) => p.payment_status === "paid").length;
  const paidTotal = participants.reduce((s, p) => s + (p.payment_status === "paid" ? Number(p.total_paid || 0) : 0), 0);
  const markPaid = async (p) => {
    const name = p.player_profile?.full_name || p.manual_name || "Kat\u0131l\u0131mc\u0131";
    const raw = prompt(`${name} i\xE7in al\u0131nan tutar\u0131 girin (TL). Kasaya "Turnuva Geliri" olarak i\u015Flenecek.`, String(tournament?.entry_fee ?? ""));
    if (raw === null) return;
    const amount = parseFloat(String(raw).replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      alert("Ge\xE7erli bir tutar girin.");
      return;
    }
    try {
      const { error } = await sb.rpc("set_tournament_payment", {
        p_participant_id: p.id,
        p_paid: true,
        p_amount: amount
      });
      if (error) throw error;
      await load();
    } catch (e) {
      alert(e.message);
    }
  };
  const undoPay = async (p) => {
    const name = p.player_profile?.full_name || p.manual_name || "Bu kat\u0131l\u0131mc\u0131";
    if (!confirm(`${name} i\xE7in tahsilat geri al\u0131ns\u0131n m\u0131? Kasadaki ${Number(p.total_paid || 0).toFixed(2)} TL'lik gelir kayd\u0131 silinecek.`)) return;
    try {
      const { error } = await sb.rpc("set_tournament_payment", {
        p_participant_id: p.id,
        p_paid: false,
        p_amount: null
      });
      if (error) throw error;
      await load();
    } catch (e) {
      alert(e.message);
    }
  };
  const generateMatches = async () => {
    if (!tournament) return;
    const members = toMembers(participants);
    const minNeeded2 = minPlayersFor(tournament.tournament_type);
    if (members.length < minNeeded2) {
      alert(`Bu format i\xE7in en az ${minNeeded2} oyuncu gerekli.
\u015Eu an: ${members.length} oyuncu`);
      return;
    }
    const msg = matches.length > 0 ? "Ma\xE7lar zaten olu\u015Fturulmu\u015F. Yeniden olu\u015Fturmak mevcut ma\xE7lar\u0131 silecek. Devam edilsin mi?" : `${members.length} oyuncu i\xE7in ${tournament.rounds_count} tur, ${tournament.courts_count} kortluk ma\xE7 program\u0131 olu\u015Fturulsun mu?`;
    if (!confirm(msg)) return;
    setGenerating(true);
    try {
      const type = tournament.tournament_type;
      let matchRows = [];
      if (type === "americano_teams") matchRows = buildAmericanoMatches(tournament.id, members, tournament.rounds_count, tournament.courts_count, true);
      else if (type === "americano_singles") matchRows = buildAmericanoMatches(tournament.id, members, tournament.rounds_count, tournament.courts_count, false);
      else if (type === "singles_knockout") matchRows = buildKnockoutRound1(tournament.id, members.map((m) => [m]));
      else if (type === "doubles_knockout") matchRows = buildKnockoutRound1(tournament.id, toTeams(participants));
      else if (type === "singles_league") matchRows = buildLeagueMatches(tournament.id, members.map((m) => [m]), tournament.courts_count);
      else if (type === "doubles_league") matchRows = buildLeagueMatches(tournament.id, toTeams(participants), tournament.courts_count);
      if (matchRows.length === 0) throw new Error("Ma\xE7 olu\u015Fturulamad\u0131.");
      await sb.from("tournament_matches").delete().eq("tournament_id", tournament.id);
      await sb.from("tournament_standings").delete().eq("tournament_id", tournament.id);
      const { error: me } = await sb.from("tournament_matches").insert(matchRows);
      if (me) throw me;
      const { error: se } = await sb.rpc("recalculate_tournament_standings", { t_id: tournament.id });
      if (se) throw se;
      const ids = await tournamentAccountIds();
      await insertNotifs(ids.map((uid) => ({
        user_id: uid,
        type: "general",
        is_read: false,
        title: "\u{1F4CB} Ma\xE7 Program\u0131 Haz\u0131r",
        message: `${tournament.title} turnuvas\u0131n\u0131n ma\xE7 program\u0131 a\xE7\u0131kland\u0131.`,
        data: { notif_key: "tournamentMatchesPublished", notif_vars: { title: tournament.title } }
      })));
      await load();
      setActiveTab("matches");
      alert("Ma\xE7 program\u0131 olu\u015Fturuldu!");
    } catch (e) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  };
  const finishTournament = async () => {
    if (!confirm("Kazanan g\xFCncel s\u0131ralamaya g\xF6re belirlenecek ve turnuva tamamlanacak. Devam edilsin mi?")) return;
    try {
      const { data: winner, error } = await sb.rpc("complete_tournament", { t_id: tournamentId });
      if (error) throw error;
      const winnerName = winner?.player1_name ? `${winner.player1_name}${winner.player2_name ? ` & ${winner.player2_name}` : ""}` : "";
      if (winnerName) {
        const ids = await tournamentAccountIds();
        await insertNotifs(ids.map((uid) => ({
          user_id: uid,
          type: "general",
          is_read: false,
          title: "\u{1F3C1} Turnuva Sona Erdi",
          message: `${tournament.title} tamamland\u0131. Kazanan: ${winnerName}.`,
          data: { notif_key: "tournamentCompleted", notif_vars: { title: tournament.title, winner: winnerName } }
        })));
      }
      await load();
      alert(winnerName ? `\u{1F3C6} Kazanan: ${winnerName}` : "Turnuva tamamland\u0131.");
    } catch (e) {
      alert(e.message);
    }
  };
  const changeStatus = async (status) => {
    const labels = { ongoing: "Devam Ediyor", cancelled: "\u0130ptal Edildi" };
    if (!confirm(`Turnuvay\u0131 "${labels[status]}" olarak i\u015Faretlemek istiyor musunuz?`)) return;
    try {
      const { error } = await sb.from("tournaments").update({ status }).eq("id", tournamentId);
      if (error) throw error;
      await load();
    } catch (e) {
      alert(e.message);
    }
  };
  const isSetsBased = tournament?.scoring_type === "sets";
  const openScoreModal = (match) => {
    if (isSetsBased) {
      setSetsEntered([]);
      setSetInputA("");
      setSetInputB("");
      setCurrentSetIdx(0);
    } else {
      setScoreA(String(match.score_a ?? 0));
      setScoreB(String(match.score_b ?? 0));
    }
    setScoreModal({ match });
  };
  const isValidSetScore = (aStr, bStr) => {
    const a = parseInt(aStr), b = parseInt(bStr);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return false;
    const hi = Math.max(a, b), lo = Math.min(a, b);
    return hi === 6 && lo <= 4 || hi === 7 && (lo === 5 || lo === 6);
  };
  const persistScore = async (sA, sB, setsData) => {
    if (!scoreModal) return;
    setSavingScore(true);
    try {
      const { error } = await sb.from("tournament_matches").update({
        score_a: sA,
        score_b: sB,
        sets_data: setsData,
        status: "completed",
        played_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", scoreModal.match.id);
      if (error) throw error;
      await sb.rpc("recalculate_tournament_standings", { t_id: tournamentId });
      setScoreModal(null);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingScore(false);
    }
  };
  const savePointsScore = () => persistScore(parseInt(scoreA) || 0, parseInt(scoreB) || 0, []);
  const handleSetNext = () => {
    const a = setInputA.trim(), b = setInputB.trim();
    if (!a || !b) {
      alert("Her iki skoru da girin.");
      return;
    }
    if (!isValidSetScore(a, b)) {
      alert("Ge\xE7ersiz set skoru.\nGe\xE7erli skorlar: 6-0, 6-1, 6-2, 6-3, 6-4, 7-5, 7-6");
      return;
    }
    const newSets = [...setsEntered, { a, b }];
    setSetsEntered(newSets);
    const numeric = newSets.map((s) => ({ a: parseInt(s.a) || 0, b: parseInt(s.b) || 0 }));
    const won = getSetsWon(numeric);
    if (won.a >= 2 || won.b >= 2) {
      persistScore(won.a, won.b, numeric);
    } else {
      setSetInputA("");
      setSetInputB("");
      setCurrentSetIdx((prev) => prev + 1);
    }
  };
  const advanceKnockout = async () => {
    if (!tournament) return;
    const maxRound = Math.max(...matches.map((m) => m.round_number), 0);
    if (maxRound === 0) return;
    const roundMatches = matches.filter((m) => m.round_number === maxRound);
    if (!roundMatches.every((m) => m.status === "completed")) {
      alert("Bu turdaki t\xFCm ma\xE7lar tamamlanmadan bir sonraki tura ge\xE7ilemez.");
      return;
    }
    if (!confirm(`Tur ${maxRound + 1} olu\u015Fturulsun mu?`)) return;
    setGenerating(true);
    try {
      const winners = roundMatches.map((m) => {
        const teamA = sideTeam(m, "a");
        const teamB = sideTeam(m, "b");
        if (teamB.length === 0) return teamA;
        const sets = m.sets_data || [];
        let winnerIsA;
        if (sets.length > 0) {
          const w = getSetsWon(sets);
          if (w.a === w.b) throw new Error(`${m.court_name || "Ma\xE7"} (Tur ${maxRound}) beraberlikle bitmi\u015F g\xF6r\xFCn\xFCyor. Eleme turunda beraberlik olamaz \u2014 skoru d\xFCzeltin.`);
          winnerIsA = w.a > w.b;
        } else {
          if (m.score_a === m.score_b) throw new Error(`${m.court_name || "Ma\xE7"} (Tur ${maxRound}) beraberlikle bitmi\u015F g\xF6r\xFCn\xFCyor. Eleme turunda beraberlik olamaz \u2014 skoru d\xFCzeltin.`);
          winnerIsA = m.score_a > m.score_b;
        }
        return winnerIsA ? teamA : teamB;
      });
      if (winners.length < 2) {
        alert("Turnuva tamamland\u0131!");
        return;
      }
      const nextRound = maxRound + 1;
      const newMatches = [];
      const advancing = /* @__PURE__ */ new Set();
      let pos = 0;
      for (let i = 0; i + 1 < winners.length; i += 2) {
        const row = {
          tournament_id: tournamentId,
          round_number: nextRound,
          court_name: `Kort ${pos + 1}`,
          bracket_position: pos,
          score_a: 0,
          score_b: 0,
          sets_data: [],
          status: "upcoming"
        };
        assignSlot(row, "team_a_player1", winners[i][0]);
        assignSlot(row, "team_a_player2", winners[i][1]);
        assignSlot(row, "team_b_player1", winners[i + 1][0]);
        assignSlot(row, "team_b_player2", winners[i + 1][1]);
        [...winners[i], ...winners[i + 1]].forEach((m) => {
          if (m && m.id) advancing.add(m.id);
        });
        newMatches.push(row);
        pos++;
      }
      if (winners.length % 2 === 1) {
        const byeTeam = winners[winners.length - 1];
        const row = {
          tournament_id: tournamentId,
          round_number: nextRound,
          court_name: "Bay",
          bracket_position: pos,
          score_a: 1,
          score_b: 0,
          sets_data: [],
          status: "completed"
        };
        assignSlot(row, "team_a_player1", byeTeam[0]);
        assignSlot(row, "team_a_player2", byeTeam[1]);
        newMatches.push(row);
      }
      if (newMatches.length > 0) {
        const { error } = await sb.from("tournament_matches").insert(newMatches);
        if (error) throw error;
      }
      const advIds = [...advancing];
      if (advIds.length > 0) {
        await insertNotifs(advIds.map((uid) => ({
          user_id: uid,
          type: "general",
          is_read: false,
          title: "\u27A1\uFE0F Yeni Tur",
          message: `${tournament.title} turnuvas\u0131nda ${nextRound}. tur ba\u015Flad\u0131. Ma\xE7\u0131n haz\u0131r!`,
          data: { notif_key: "tournamentNextRound", notif_vars: { title: tournament.title, round: nextRound } }
        })));
      }
      await load();
      alert(`Tur ${nextRound} olu\u015Fturuldu!`);
    } catch (e) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  };
  const groupedMatches = useMemo(() => matches.reduce((acc, m) => {
    if (!acc[m.round_number]) acc[m.round_number] = [];
    acc[m.round_number].push(m);
    return acc;
  }, {}), [matches]);
  const peopleCount = toMembers(participants).length;
  const minNeeded = tournament ? minPlayersFor(tournament.tournament_type) : 4;
  const statusMeta = () => {
    const s = tournament?.status;
    if (s === "upcoming") return { label: "YAKLA\u015EAN", bg: "#EEF2FF", color: "var(--brand-navy)" };
    if (s === "ongoing") return { label: "DEVAM ED\u0130YOR", bg: "#DCFCE7", color: "#22C55E" };
    if (s === "completed") return { label: "TAMAMLANDI", bg: "#F1F5F9", color: "var(--text-2)" };
    return { label: "\u0130PTAL", bg: "#FEF2F2", color: "#EF4444" };
  };
  const tabItems = [
    { key: "info", label: "Bilgi" },
    { key: "standings", label: "S\u0131ralama" },
    { key: "matches", label: `Ma\xE7lar${matches.length > 0 ? ` (${matches.length})` : ""}` }
  ];
  if (loading) return /* @__PURE__ */ React.createElement(Spinner, null);
  if (!tournament) return /* @__PURE__ */ React.createElement(EmptyState, { icon: "emoji_events", title: "Turnuva bulunamad\u0131" });
  const sm = statusMeta();
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head", style: { flexWrap: "wrap", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-icon", onClick: onBack }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "arrow_back")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { style: { marginBottom: 2 } }, tournament.title || "Turnuva Y\xF6net"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, tournament.sport, " \xB7 ", T_TYPE_LABEL[tournament.tournament_type] || tournament.tournament_type))), /* @__PURE__ */ React.createElement("span", { style: { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: sm.bg, color: sm.color } }, sm.label)), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement(Tabs, { items: tabItems, active: activeTab, onChange: setActiveTab })), activeTab === "info" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, tournament.status === "completed" && tournament.winner_info && /* @__PURE__ */ React.createElement("div", { style: { background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 16, padding: 20, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "#F57F17", marginBottom: 10 } }, "\u{1F3C6} KAZANANLAR \u{1F3C6}"), /* @__PURE__ */ React.createElement("div", { style: { background: "#FF8F00", borderRadius: 20, display: "inline-block", padding: "8px 24px" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", fontWeight: 800, fontSize: 16 } }, tournament.winner_info.player1_name, tournament.winner_info.player2_name ? ` & ${tournament.winner_info.player2_name}` : ""))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, marginBottom: 12 } }, "Turnuva Bilgisi"), [
    ["Spor", (tournament.sport || "").charAt(0).toUpperCase() + (tournament.sport || "").slice(1)],
    ["Format", T_TYPE_LABEL[tournament.tournament_type] || tournament.tournament_type],
    ["Oyuncular", `${tournament.current_players ?? 0} / ${tournament.max_players}`],
    ["Turlar", String(tournament.rounds_count ?? "-")],
    ["Kortlar", String(tournament.courts_count ?? "-")],
    ["Cinsiyet", T_GENDER_LABEL[tournament.gender] || tournament.gender || "-"],
    ["\xDCcret", tournament.entry_fee > 0 ? fmtMoney(tournament.entry_fee) : "\xDCcretsiz"],
    ["Ba\u015Flang\u0131\xE7", tournament.start_date ? fmtDate(tournament.start_date) : "-"],
    ["Biti\u015F", tournament.end_date ? fmtDate(tournament.end_date) : "-"]
  ].map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, k), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600 } }, v)))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700 } }, "Kay\u0131tl\u0131 Oyuncular (", participants.length, "/", tournament.max_players, ")"), tournament.status === "upcoming" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: () => {
    setManualName("");
    setAddPModal(true);
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "person_add"), " Ekle")), hasFee && participants.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--bg)", borderRadius: 10, padding: "8px 10px", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: paidCount === participants.length ? "#22C55E" : "#E65100" } }, "payments"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600 } }, "Tahsilat: ", paidCount, "/", participants.length, " kat\u0131l\u0131mc\u0131 \xB7 ", paidTotal.toFixed(2), " TL")), participants.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "20px 0", color: "var(--text-2)", fontSize: 13 } }, "Hen\xFCz kay\u0131t yok.") : participants.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: p.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 28, height: 28, borderRadius: 14, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--brand-navy)", flexShrink: 0 } }, i + 1), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 500 } }, p.player_profile?.full_name || p.manual_name || "Bilinmiyor"), p.partner_profile && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, "E\u015Fi: ", p.partner_profile.full_name)), !p.player_id && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, background: "#FFF3E0", color: "#E65100", borderRadius: 10, padding: "2px 8px" } }, "Manuel"), hasFee ? p.payment_status === "paid" ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => undoPay(p),
      title: "\xD6demeyi geri al",
      style: { fontSize: 11, fontWeight: 600, background: "#E8F5E9", color: "#22C55E", borderRadius: 10, padding: "2px 8px", border: "none", cursor: "pointer" }
    },
    "\xD6dendi \u2713"
  ) : /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => markPaid(p),
      title: "Tahsilat i\u015Faretle",
      style: { fontSize: 11, fontWeight: 600, background: "#FFF3E0", color: "#E65100", borderRadius: 10, padding: "2px 8px", border: "none", cursor: "pointer" }
    },
    "\xD6denmedi"
  ) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, background: "#E8F5E9", color: "#22C55E", borderRadius: 10, padding: "2px 8px" } }, "Kay\u0131tl\u0131"), tournament.status === "upcoming" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => removeParticipant(p),
      disabled: removingId === p.id,
      style: { background: "none", border: "none", cursor: removingId === p.id ? "default" : "pointer", padding: 2, display: "flex" },
      title: "Turnuvadan \xE7\u0131kar"
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: removingId === p.id ? "#CBD5E1" : "#EF4444" } }, "person_remove")
  )))), (tournament.status === "upcoming" || tournament.status === "ongoing") && peopleCount >= minNeeded && /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-sm",
      onClick: generateMatches,
      disabled: generating,
      style: { background: "#8B5CF6", color: "#fff", padding: "12px", justifyContent: "center", borderRadius: 12, gap: 8 }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "shuffle"),
    generating ? "Olu\u015Fturuluyor\u2026" : matches.length > 0 ? "Ma\xE7lar\u0131 Yeniden Olu\u015Ftur" : "Ma\xE7 Program\u0131 Olu\u015Ftur"
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, tournament.status === "upcoming" && /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn",
      onClick: () => changeStatus("ongoing"),
      style: { background: "#22C55E", color: "#fff", padding: "12px", justifyContent: "center", borderRadius: 12, gap: 8 }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "play_arrow"),
    " Turnuvay\u0131 Ba\u015Flat"
  ), tournament.status === "ongoing" && /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-pri",
      onClick: finishTournament,
      style: { padding: "12px", justifyContent: "center", borderRadius: 12, gap: 8 }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "flag"),
    " Turnuvay\u0131 Bitir"
  ), (tournament.status === "upcoming" || tournament.status === "ongoing") && /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-danger",
      onClick: () => changeStatus("cancelled"),
      style: { padding: "12px", justifyContent: "center", borderRadius: 12, gap: 8 }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "cancel"),
    " Turnuvay\u0131 \u0130ptal Et"
  ))), activeTab === "standings" && (standings.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "leaderboard", title: "S\u0131ralama hen\xFCz olu\u015Fturulmad\u0131", sub: "Ma\xE7lar oynand\u0131k\xE7a burada g\xFCncellenecek." }) : /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { width: 32, textAlign: "center" } }, "#"), /* @__PURE__ */ React.createElement("th", null, "Oyuncu"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "center" } }, "Puan"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "center" } }, "G"), /* @__PURE__ */ React.createElement("th", { style: { textAlign: "center" } }, "M"), !isSetsBased && /* @__PURE__ */ React.createElement("th", { style: { textAlign: "center" } }, "B"))), /* @__PURE__ */ React.createElement("tbody", null, standings.map((s, i) => /* @__PURE__ */ React.createElement("tr", { key: s.id }, /* @__PURE__ */ React.createElement("td", { style: { textAlign: "center", fontWeight: 800 } }, i + 1), /* @__PURE__ */ React.createElement("td", null, s.player1_profile?.full_name || "-", s.player2_profile ? ` & ${s.player2_profile.full_name}` : ""), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "center", fontWeight: 800, color: "var(--brand-navy)" } }, s.points), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "center", fontWeight: 700, color: "#22C55E" } }, s.wins), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "center", fontWeight: 700, color: "#EF4444" } }, s.losses), !isSetsBased && /* @__PURE__ */ React.createElement("td", { style: { textAlign: "center" } }, s.draws))))))), activeTab === "matches" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 20 } }, (tournament.tournament_type === "singles_knockout" || tournament.tournament_type === "doubles_knockout") && matches.length > 0 && (() => {
    const maxRound = Math.max(...matches.map((m) => m.round_number));
    const roundDone = matches.filter((m) => m.round_number === maxRound).every((m) => m.status === "completed");
    const isFinal = matches.filter((m) => m.round_number === maxRound).length === 1;
    return roundDone && !isFinal ? /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn",
        onClick: advanceKnockout,
        disabled: generating,
        style: { background: "#8B5CF6", color: "#fff", padding: "12px", justifyContent: "center", borderRadius: 12, gap: 8 }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "arrow_forward"),
      generating ? "Olu\u015Fturuluyor\u2026" : `Tur ${maxRound + 1}'i Olu\u015Ftur`
    ) : null;
  })(), matches.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "sports_tennis",
      title: "Hen\xFCz ma\xE7 olu\u015Fturulmad\u0131",
      sub: peopleCount >= minNeeded ? "Bilgi sekmesinden ma\xE7 program\u0131 olu\u015Fturun." : `Ma\xE7 olu\u015Fturmak i\xE7in ${Math.max(0, minNeeded - peopleCount)} oyuncu daha gerekli.`
    }
  ) : Object.entries(groupedMatches).map(([round, roundMatches]) => {
    const allDone = roundMatches.every((m) => m.status === "completed");
    return /* @__PURE__ */ React.createElement("div", { key: round }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: 0.5 } }, "Tur ", round), allDone && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#22C55E", fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "check_circle"), " Tamamland\u0131")), roundMatches.map((m) => {
      const hasSets = m.sets_data && m.sets_data.length > 0;
      const aWon = m.status === "completed" && m.score_a > m.score_b;
      const bWon = m.status === "completed" && m.score_b > m.score_a;
      const msBg = m.status === "completed" ? "#E8F5E9" : m.status === "ongoing" ? "#FFF3E0" : "#EEF2FF";
      const msColor = m.status === "completed" ? "#22C55E" : m.status === "ongoing" ? "#F59E0B" : "var(--brand-navy)";
      const msLabel = m.status === "completed" ? "B\u0130TT\u0130" : m.status === "ongoing" ? "DEVAM" : "YAKLA\u015EAN";
      return /* @__PURE__ */ React.createElement("div", { key: m.id, className: "card", style: { marginBottom: 10, padding: 14 } }, m.court_name && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13, color: "var(--brand-navy)" } }, "sports_tennis"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--brand-navy)", flex: 1 } }, m.court_name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: msBg, color: msColor } }, msLabel)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "stretch", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "8px 10px", borderRadius: 10, background: aWon ? "#E8F5E9" : "var(--bg)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, fontWeight: 700, color: "var(--text-2)", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 } }, "Tak\u0131m A"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: aWon ? 700 : 500, color: aWon ? "#22C55E" : "var(--text-1)" } }, m.team_a_player1?.full_name || "-"), m.team_a_player2 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: aWon ? "#22C55E" : "var(--text-2)" } }, m.team_a_player2.full_name)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", minWidth: 70, flexShrink: 0 } }, m.status === "completed" ? hasSets ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, textAlign: "center" } }, formatSets(m.sets_data)) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22, fontWeight: 800 } }, /* @__PURE__ */ React.createElement("span", { style: { color: aWon ? "#22C55E" : "var(--text-1)" } }, m.score_a), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-2)", margin: "0 3px", fontSize: 16 } }, "\u2013"), /* @__PURE__ */ React.createElement("span", { style: { color: bWon ? "#22C55E" : "var(--text-1)" } }, m.score_b)) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--text-2)" } }, "vs")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "8px 10px", borderRadius: 10, background: bWon ? "#E8F5E9" : "var(--bg)", textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, fontWeight: 700, color: "var(--text-2)", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 } }, "Tak\u0131m B"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: bWon ? 700 : 500, color: bWon ? "#22C55E" : "var(--text-1)" } }, m.team_b_player1?.full_name || "-"), m.team_b_player2 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: bWon ? "#22C55E" : "var(--text-2)" } }, m.team_b_player2.full_name))), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-ghost btn-sm",
          onClick: () => openScoreModal(m),
          style: { width: "100%", justifyContent: "center" }
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "edit"),
        m.status === "completed" ? "Skoru D\xFCzenle" : "Skor Gir"
      ));
    }));
  })), addPModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Manuel Kat\u0131l\u0131mc\u0131 Ekle",
      onClose: () => setAddPModal(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setAddPModal(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-pri btn-sm",
          onClick: addManualParticipant,
          disabled: addingManual || !manualName.trim()
        },
        addingManual ? "Ekleniyor\u2026" : "Ekle"
      ))
    },
    /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-2)", marginBottom: 14 } }, "Uygulamada hesab\u0131 olmayan ki\u015Fileri isim yazarak ekleyebilirsiniz."),
    /* @__PURE__ */ React.createElement(Field, { label: "Ad Soyad" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: manualName,
        placeholder: "Ad Soyad",
        onChange: (e) => setManualName(e.target.value),
        onKeyDown: (e) => e.key === "Enter" && addManualParticipant()
      }
    ))
  ), scoreModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: isSetsBased ? `Set ${currentSetIdx + 1}` : "Skor Gir",
      sub: scoreModal.match.court_name ? `${scoreModal.match.court_name} \xB7 Tur ${scoreModal.match.round_number}` : void 0,
      onClose: () => setScoreModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setScoreModal(null) }, "\u0130ptal"), isSetsBased ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleSetNext, disabled: savingScore }, savingScore ? "\u2026" : currentSetIdx >= 2 ? "Kaydet" : "Devam \u2192") : /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: savePointsScore, disabled: savingScore }, savingScore ? "\u2026" : "Kaydet"))
    },
    isSetsBased && setsEntered.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 } }, setsEntered.map((s, i) => /* @__PURE__ */ React.createElement("span", { key: i, style: { background: "#EEF2FF", borderRadius: 10, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "var(--brand-navy)" } }, "Set ", i + 1, ": ", s.a, "-", s.b))),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", textAlign: "center", minHeight: 36 } }, scoreModal.match.team_a_player1?.full_name || "Tak\u0131m A", scoreModal.match.team_a_player2 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("br", null), scoreModal.match.team_a_player2.full_name) : null), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        value: isSetsBased ? setInputA : scoreA,
        onChange: (e) => isSetsBased ? setSetInputA(e.target.value) : setScoreA(e.target.value),
        style: { textAlign: "center", fontSize: 32, fontWeight: 800, width: "100%", padding: "10px 0", border: "2px solid var(--border)", borderRadius: 12 }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 800, color: "var(--text-2)", flexShrink: 0 } }, "\u2013"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", textAlign: "center", minHeight: 36 } }, scoreModal.match.team_b_player1?.full_name || "Tak\u0131m B", scoreModal.match.team_b_player2 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("br", null), scoreModal.match.team_b_player2.full_name) : null), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        value: isSetsBased ? setInputB : scoreB,
        onChange: (e) => isSetsBased ? setSetInputB(e.target.value) : setScoreB(e.target.value),
        style: { textAlign: "center", fontSize: 32, fontWeight: 800, width: "100%", padding: "10px 0", border: "2px solid var(--border)", borderRadius: 12 }
      }
    )))
  ));
}
