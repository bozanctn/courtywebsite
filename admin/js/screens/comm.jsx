// ── Sohbet & Bildirimler ────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// SOHBET
// ═══════════════════════════════════════════════════════════════
function ChatScreen({ clubId, clubProfile }) {
  const { useState, useEffect, useRef } = React;
  const [chats,     setChats]     = useState([]);
  const [active,    setActive]    = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [text,      setText]      = useState('');
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [loadingMs, setLoadingMs] = useState(false);
  const msEndRef = useRef(null);
  const subRef   = useRef(null);
  const myUserId = React.useRef(null);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      myUserId.current = data.session?.user?.id;
    });
    if (clubId) loadChats();
    return () => subRef.current?.unsubscribe();
  }, [clubId]);

  useEffect(() => {
    msEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    setLoading(true);
    // Kulüp profil user_id'sini al
    const clubUserId = clubProfile?.user_id;
    if (!clubUserId) { setLoading(false); return; }

    const { data } = await sb
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id,full_name,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,email)')
      .or(`sender_id.eq.${clubUserId},receiver_id.eq.${clubUserId}`)
      .order('created_at', { ascending: false })
      .limit(200);

    // Grup by other user
    const chatMap = {};
    (data || []).forEach(m => {
      const other = m.sender_id === clubUserId ? m.receiver : m.sender;
      if (!other) return;
      if (!chatMap[other.id] || new Date(m.created_at) > new Date(chatMap[other.id].lastMsg?.created_at || 0)) {
        chatMap[other.id] = { user: other, lastMsg: m, unread: 0 };
      }
      if (!m.is_read && m.receiver_id === clubUserId) chatMap[other.id].unread++;
    });
    setChats(Object.values(chatMap).sort((a,b) => new Date(b.lastMsg?.created_at||0) - new Date(a.lastMsg?.created_at||0)));
    setLoading(false);
  };

  const openChat = async (chat) => {
    setActive(chat);
    setLoadingMs(true);
    const clubUserId = clubProfile?.user_id;
    subRef.current?.unsubscribe();

    const { data } = await sb
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${clubUserId},receiver_id.eq.${chat.user.id}),and(sender_id.eq.${chat.user.id},receiver_id.eq.${clubUserId})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingMs(false);

    // Okundu işaretle
    await sb.from('messages').update({ is_read: true })
      .eq('receiver_id', clubUserId).eq('sender_id', chat.user.id).eq('is_read', false);
    loadChats();

    // Realtime subscription
    subRef.current = sb.channel(`chat-${chat.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${clubUserId}`,
      }, payload => {
        if (payload.new.sender_id === chat.user.id) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();
  };

  const sendMsg = async () => {
    if (!text.trim() || !active) return;
    const clubUserId = clubProfile?.user_id;
    const msg = text.trim();
    setText('');
    await sb.from('messages').insert({
      sender_id:   clubUserId,
      receiver_id: active.user.id,
      content:     msg,
      is_read:     false,
    });
    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now(), sender_id: clubUserId, receiver_id: active.user.id,
      content: msg, created_at: new Date().toISOString(),
    }]);
    loadChats();
  };

  const filteredChats = chats.filter(c => {
    if (!search) return true;
    return (c.user.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
           (c.user.email || '').toLowerCase().includes(search.toLowerCase());
  });

  const clubUserId = clubProfile?.user_id;

  return (
    <div className="page fade-in" style={{ padding: 0, flex: 1 }}>
      <div className="chat-layout" style={{ minHeight:'calc(100vh - 64px)' }}>
        {/* Sol: chat listesi */}
        <div className="chat-list">
          <div className="chat-list-h">
            <div className="search">
              <span className="material-icons">search</span>
              <input placeholder="Sohbet ara…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="chat-list-body">
            {loading ? <Spinner size={28} /> : filteredChats.length === 0 ? (
              <EmptyState icon="chat" title="Sohbet yok" sub="Henüz mesaj alınmadı." />
            ) : filteredChats.map(c => (
              <div
                key={c.user.id}
                className={`chat-item${active?.user?.id === c.user.id ? ' active' : ''}`}
                onClick={() => openChat(c)}
              >
                <Av name={c.user.full_name} />
                <div className="body">
                  <div className="top">
                    <span className="n">{c.user.full_name || c.user.email}</span>
                    <span className="t">{fmtTime(c.lastMsg?.created_at)}</span>
                  </div>
                  <div className="m">{c.lastMsg?.content || ''}</div>
                </div>
                {c.unread > 0 && <span className="unread">{c.unread}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Sağ: mesaj paneli */}
        <div className="chat-panel">
          {!active ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <EmptyState icon="chat_bubble_outline" title="Bir sohbet seçin" sub="Sol taraftan bir konuşmaya tıklayın." />
            </div>
          ) : (
            <>
              <div className="chat-panel-h">
                <Av name={active.user.full_name} />
                <div>
                  <div className="n">{active.user.full_name || active.user.email}</div>
                  <div className="o">{active.user.email}</div>
                </div>
              </div>
              <div className="chat-msgs">
                {loadingMs ? <Spinner size={24} /> : messages.length === 0 ? (
                  <EmptyState icon="chat_bubble" title="Mesaj yok" sub="İlk mesajı gönderin." />
                ) : messages.map((m, i) => {
                  const isMe = m.sender_id === clubUserId;
                  return (
                    <div key={m.id || i} className={`msg ${isMe ? 'me' : 'them'}`}>
                      {m.content}
                      <span className="ts">{fmtTime(m.created_at)}</span>
                    </div>
                  );
                })}
                <div ref={msEndRef} />
              </div>
              <div className="chat-input">
                <input
                  placeholder="Mesaj yazın…"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                />
                <button className="btn btn-pri btn-icon" onClick={sendMsg} disabled={!text.trim()}>
                  <span className="material-icons">send</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BİLDİRİMLER
// ═══════════════════════════════════════════════════════════════
function NotificationsScreen({ clubId }) {
  const { useState, useEffect, useRef } = React;
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const userId = useRef(null);

  useEffect(() => {
    // notifications.user_id = auth.users.id = club_profiles.id
    sb.auth.getSession().then(({ data }) => {
      userId.current = data.session?.user?.id;
      if (userId.current) load(userId.current);
    });
  }, []);

  const load = async (uid) => {
    const id = uid || userId.current;
    if (!id) return;
    setLoading(true);
    const { data } = await sb
      .from('notifications')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifs(data || []);
    setLoading(false);
  };

  const markRead = async (id) => {
    await sb.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!userId.current) return;
    await sb.from('notifications').update({ is_read: true }).eq('user_id', userId.current).eq('is_read', false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const del = async (id) => {
    await sb.from('notifications').delete().eq('id', id);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const iconFor = (type) => {
    const m = { booking: 'event_available', member: 'person_add', payment: 'payments', message: 'chat', system: 'info' };
    return m[type] || 'notifications';
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Bildirimler</h1>
          <div className="sub">{unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tümü okundu'}</div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={markAllRead}>
            <span className="material-icons">done_all</span>
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      <div className="card tight">
        {loading ? <Spinner /> : notifs.length === 0 ? (
          <EmptyState icon="notifications_none" title="Bildirim yok" sub="Yeni bildirimler burada görünecek." />
        ) : notifs.map(n => (
          <div key={n.id} className={`notif-item${!n.is_read ? ' unread' : ''}`} onClick={() => !n.is_read && markRead(n.id)}>
            <div className="ic-wrap">
              <span className="material-icons">{iconFor(n.type)}</span>
            </div>
            <div className="body">
              <div className="t">{n.title || 'Bildirim'}</div>
              {n.body && <div className="s">{n.body}</div>}
              <div className="time">{fmtDateTime(n.created_at)}</div>
            </div>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              {!n.is_read && <span className="badge b-info" style={{ fontSize:9 }}>YENİ</span>}
              <button className="icon-btn" style={{ width:30, height:30 }} title="Sil" onClick={(e) => { e.stopPropagation(); del(n.id); }}>
                <span className="material-icons" style={{ fontSize:16 }}>close</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
