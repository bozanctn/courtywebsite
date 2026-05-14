// ── Çalışanlar ──────────────────────────────────────────────────

function EmployeesScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [tab,         setTab]         = useState('search');
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [inviteModal, setInviteModal] = useState(null); // null | user object
  const [inviteMsg,   setInviteMsg]   = useState('');
  const [sending,     setSending]     = useState(false);

  useEffect(() => { if (clubId) loadLists(); }, [clubId]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const [invRes, empRes] = await Promise.all([
        sb.from('club_employee_invitations')
          .select('*, profiles!club_employee_invitations_employee_id_fkey(full_name, email)')
          .eq('club_id', clubId)
          .order('created_at', { ascending: false }),
        sb.from('club_employees')
          .select('*, profiles!club_employees_employee_id_fkey(full_name, email)')
          .eq('club_id', clubId)
          .order('created_at', { ascending: false }),
      ]);
      setInvitations(invRes.data || []);
      setEmployees(empRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (q.length < 3) { alert('Arama için en az 3 karakter giriniz.'); return; }
    setSearching(true); setSearched(true);
    try {
      const { data, error } = await sb.from('profiles')
        .select('id, full_name, email')
        .eq('user_type', 'employee')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(20);
      if (error) throw error;
      setResults(data || []);
    } catch (e) { alert(e.message); setResults([]); }
    finally { setSearching(false); }
  };

  const sendInvite = async () => {
    if (!inviteModal) return;
    setSending(true);
    try {
      const { error } = await sb.from('club_employee_invitations').insert({
        club_id:     clubId,
        employee_id: inviteModal.id,
        message:     inviteMsg.trim() || null,
        status:      'pending',
      });
      if (error) {
        if (error.code === '23505') throw new Error('Bu çalışana zaten davet gönderilmiş.');
        throw error;
      }
      setInviteModal(null);
      await loadLists();
      alert(`${inviteModal.full_name} kişisine davet gönderildi.`);
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  };

  const cancelInvitation = async (id, name) => {
    if (!confirm(`${name} davetini iptal etmek istiyor musunuz?`)) return;
    const { error } = await sb.from('club_employee_invitations').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    loadLists();
  };

  const removeEmployee = async (empId, name) => {
    if (!confirm(`${name} adlı çalışanı kulüpten çıkarmak istiyor musunuz?`)) return;
    try {
      const { error: e1 } = await sb.from('club_employees').delete().eq('club_id', clubId).eq('employee_id', empId);
      if (e1) throw e1;
      await sb.from('club_employee_invitations').delete().eq('club_id', clubId).eq('employee_id', empId);
      loadLists();
    } catch (e) { alert(e.message); }
  };

  const statusCls = (s) => ({ pending:'b-info', accepted:'b-success', rejected:'b-muted' }[s] || 'b-muted');
  const statusLbl = (s) => ({ pending:'Beklemede', accepted:'Kabul Edildi', rejected:'Reddedildi' }[s] || s);

  const pendingSet = new Set(invitations.filter(i => i.status === 'pending').map(i => i.employee_id));
  const empIdSet   = new Set(employees.map(e => e.employee_id));

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Çalışanlar</h1>
          <div className="sub">{employees.length} aktif çalışan</div>
        </div>
      </div>

      <Tabs items={[
        { key:'search',      label:'Ara' },
        { key:'invitations', label:'Davetler',   count: invitations.length },
        { key:'employees',   label:'Çalışanlar', count: employees.length },
      ]} active={tab} onChange={setTab} />

      {/* ── Arama ── */}
      {tab === 'search' && (
        <div style={{ marginTop:16 }}>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1, position:'relative' }}>
                <span className="material-icons" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-2)', fontSize:18, pointerEvents:'none' }}>search</span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Ad veya e-posta ile ara (min 3 karakter)"
                  style={{ paddingLeft:40, width:'100%', boxSizing:'border-box' }}
                />
              </div>
              <button className="btn btn-pri" onClick={handleSearch} disabled={searching}>
                {searching ? '…' : 'Ara'}
              </button>
            </div>
          </div>

          {searching && <Spinner size={28} />}

          {!searching && !searched && (
            <EmptyState icon="manage_search" title="Çalışan aramak için en az 3 karakter girin" sub="Kulübe davet etmek istediğiniz çalışanı arayın." />
          )}

          {!searching && searched && results.length === 0 && (
            <EmptyState icon="person_search" title="Çalışan hesabı bulunamadı" sub="Farklı bir arama terimi deneyin." />
          )}

          {!searching && results.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {results.map(u => {
                const alreadySent = pendingSet.has(u.id);
                const isEmp = empIdSet.has(u.id);
                return (
                  <div key={u.id} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <Av name={u.full_name} size="sm" />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{u.full_name}</div>
                      <div style={{ fontSize:12, color:'var(--text-2)' }}>{u.email}</div>
                    </div>
                    {isEmp
                      ? <Badge cls="b-success">Çalışan</Badge>
                      : alreadySent
                        ? <Badge cls="b-info">Gönderildi</Badge>
                        : (
                          <button className="btn btn-pri btn-sm" onClick={() => { setInviteModal(u); setInviteMsg(''); }}>
                            <span className="material-icons" style={{ fontSize:14 }}>send</span> Davet Et
                          </button>
                        )
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Davetler ── */}
      {tab === 'invitations' && (
        loading ? <Spinner /> : invitations.length === 0 ? (
          <div style={{ marginTop:16 }}>
            <EmptyState icon="mail_outline" title="Henüz davet gönderilmedi" sub="Arama sekmesinden çalışan arayıp davet edebilirsiniz." />
          </div>
        ) : (
          <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
            {invitations.map(inv => {
              const name  = inv.profiles?.full_name || '—';
              const email = inv.profiles?.email     || '';
              return (
                <div key={inv.id} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <Av name={name} size="sm" />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{name}</div>
                    <div style={{ fontSize:12, color:'var(--text-2)' }}>{email}</div>
                    {inv.message && <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2, fontStyle:'italic' }}>"{inv.message}"</div>}
                  </div>
                  <Badge cls={statusCls(inv.status)}>{statusLbl(inv.status)}</Badge>
                  {inv.status === 'pending' && (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => cancelInvitation(inv.id, name)} title="İptal et">
                      <span className="material-icons" style={{ fontSize:15, color:'var(--error)' }}>close</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Çalışanlar ── */}
      {tab === 'employees' && (
        loading ? <Spinner /> : employees.length === 0 ? (
          <div style={{ marginTop:16 }}>
            <EmptyState icon="badge" title="Kulübünüzde henüz çalışan yok" sub="Davetler sekmesinden gönderilen davetleri kabul eden çalışanlar burada görünür." />
          </div>
        ) : (
          <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
            {employees.map(emp => {
              const name  = emp.profiles?.full_name || '—';
              const email = emp.profiles?.email     || '';
              return (
                <div key={emp.id} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:20, background:'#DCFCE7', display:'grid', placeItems:'center', flexShrink:0 }}>
                    <span className="material-icons" style={{ fontSize:20, color:'#166534' }}>badge</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{name}</div>
                    <div style={{ fontSize:12, color:'var(--text-2)' }}>{email}</div>
                  </div>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeEmployee(emp.employee_id, name)} title="Çalışanı çıkar">
                    <span className="material-icons" style={{ fontSize:15 }}>person_remove</span>
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Davet Modalı ── */}
      {inviteModal && (
        <Modal title="Davet Gönder" onClose={() => setInviteModal(null)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setInviteModal(null)}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={sendInvite} disabled={sending}>
              {sending ? 'Gönderiliyor…' : 'Davet Gönder'}
            </button>
          </>
        }>
          <div className="fields" style={{ gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, background:'#EFF6FF', borderRadius:10, padding:'12px 14px' }}>
              <Av name={inviteModal.full_name} size="sm" />
              <div>
                <div style={{ fontWeight:700 }}>{inviteModal.full_name}</div>
                <div style={{ fontSize:12, color:'var(--text-2)' }}>{inviteModal.email}</div>
              </div>
            </div>
            <Field label="Mesaj (opsiyonel)">
              <textarea rows={3} value={inviteMsg} onChange={e => setInviteMsg(e.target.value)}
                placeholder="Çalışana iletmek istediğiniz mesajı yazın..." style={{ resize:'vertical' }} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
