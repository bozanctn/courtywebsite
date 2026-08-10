function ChatScreen({ clubId, clubProfile }) {
  const { useState, useEffect, useRef } = React;
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMs, setLoadingMs] = useState(false);
  const msEndRef = useRef(null);
  const subRef = useRef(null);
  const myUserId = React.useRef(null);
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      myUserId.current = data.session?.user?.id;
    });
    if (clubId) loadChats();
    return () => subRef.current?.unsubscribe();
  }, [clubId]);
  useEffect(() => {
    msEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const loadChats = async () => {
    setLoading(true);
    const clubUserId2 = clubProfile?.id;
    if (!clubUserId2) {
      setLoading(false);
      return;
    }
    const { data: msgs } = await sb.from("messages").select("*").or(`sender_id.eq.${clubUserId2},receiver_id.eq.${clubUserId2}`).order("created_at", { ascending: false }).limit(200);
    if (!msgs?.length) {
      setChats([]);
      setLoading(false);
      return;
    }
    const otherIds = [...new Set(msgs.map((m) => m.sender_id === clubUserId2 ? m.receiver_id : m.sender_id))];
    const { data: profs } = await sb.from("profiles").select("id,full_name,email").in("id", otherIds);
    const profMap = Object.fromEntries((profs || []).map((p) => [p.id, p]));
    const chatMap = {};
    msgs.forEach((m) => {
      const otherId = m.sender_id === clubUserId2 ? m.receiver_id : m.sender_id;
      const other = profMap[otherId] || { id: otherId, full_name: "Bilinmeyen", email: "" };
      if (!chatMap[otherId] || new Date(m.created_at) > new Date(chatMap[otherId].lastMsg?.created_at || 0)) {
        chatMap[otherId] = { user: other, lastMsg: m, unread: 0 };
      }
      if (!m.is_read && m.receiver_id === clubUserId2) chatMap[otherId].unread++;
    });
    setChats(Object.values(chatMap).sort((a, b) => new Date(b.lastMsg?.created_at || 0) - new Date(a.lastMsg?.created_at || 0)));
    setLoading(false);
  };
  const openChat = async (chat) => {
    setActive(chat);
    setLoadingMs(true);
    const clubUserId2 = clubProfile?.id;
    subRef.current?.unsubscribe();
    const { data } = await sb.from("messages").select("*").or(`and(sender_id.eq.${clubUserId2},receiver_id.eq.${chat.user.id}),and(sender_id.eq.${chat.user.id},receiver_id.eq.${clubUserId2})`).order("created_at", { ascending: true });
    setMessages(data || []);
    setLoadingMs(false);
    await sb.from("messages").update({ is_read: true }).eq("receiver_id", clubUserId2).eq("sender_id", chat.user.id).eq("is_read", false);
    loadChats();
    subRef.current = sb.channel(`chat-${chat.user.id}`).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `receiver_id=eq.${clubUserId2}`
    }, (payload) => {
      if (payload.new.sender_id === chat.user.id) {
        setMessages((prev) => [...prev, payload.new]);
      }
    }).subscribe();
  };
  const sendMsg = async () => {
    if (!text.trim() || !active) return;
    const clubUserId2 = clubProfile?.id;
    const msg = text.trim();
    setText("");
    await sb.from("messages").insert({
      sender_id: clubUserId2,
      receiver_id: active.user.id,
      content: msg,
      is_read: false
    });
    setMessages((prev) => [...prev, {
      id: Date.now(),
      sender_id: clubUserId2,
      receiver_id: active.user.id,
      content: msg,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }]);
    loadChats();
  };
  const filteredChats = chats.filter((c) => {
    if (!search) return true;
    return (c.user.full_name || "").toLowerCase().includes(search.toLowerCase()) || (c.user.email || "").toLowerCase().includes(search.toLowerCase());
  });
  const clubUserId = clubProfile?.id;
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in", style: { padding: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "chat-layout", style: { minHeight: "calc(100vh - 64px)" } }, /* @__PURE__ */ React.createElement("div", { className: "chat-list" }, /* @__PURE__ */ React.createElement("div", { className: "chat-list-h" }, /* @__PURE__ */ React.createElement("div", { className: "search" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "search"), /* @__PURE__ */ React.createElement("input", { placeholder: "Sohbet ara\u2026", value: search, onChange: (e) => setSearch(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "chat-list-body" }, loading ? /* @__PURE__ */ React.createElement(Spinner, { size: 28 }) : filteredChats.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "chat", title: "Sohbet yok", sub: "Hen\xFCz mesaj al\u0131nmad\u0131." }) : filteredChats.map((c) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: c.user.id,
      className: `chat-item${active?.user?.id === c.user.id ? " active" : ""}`,
      onClick: () => openChat(c)
    },
    /* @__PURE__ */ React.createElement(Av, { name: c.user.full_name }),
    /* @__PURE__ */ React.createElement("div", { className: "body" }, /* @__PURE__ */ React.createElement("div", { className: "top" }, /* @__PURE__ */ React.createElement("span", { className: "n" }, c.user.full_name || c.user.email), /* @__PURE__ */ React.createElement("span", { className: "t" }, fmtTime(c.lastMsg?.created_at))), /* @__PURE__ */ React.createElement("div", { className: "m" }, c.lastMsg?.content || "")),
    c.unread > 0 && /* @__PURE__ */ React.createElement("span", { className: "unread" }, c.unread)
  )))), /* @__PURE__ */ React.createElement("div", { className: "chat-panel" }, !active ? /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(EmptyState, { icon: "chat_bubble_outline", title: "Bir sohbet se\xE7in", sub: "Sol taraftan bir konu\u015Fmaya t\u0131klay\u0131n." })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "chat-panel-h" }, /* @__PURE__ */ React.createElement(Av, { name: active.user.full_name }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "n" }, active.user.full_name || active.user.email), /* @__PURE__ */ React.createElement("div", { className: "o" }, active.user.email))), /* @__PURE__ */ React.createElement("div", { className: "chat-msgs" }, loadingMs ? /* @__PURE__ */ React.createElement(Spinner, { size: 24 }) : messages.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "chat_bubble", title: "Mesaj yok", sub: "\u0130lk mesaj\u0131 g\xF6nderin." }) : messages.map((m, i) => {
    const isMe = m.sender_id === clubUserId;
    return /* @__PURE__ */ React.createElement("div", { key: m.id || i, className: `msg ${isMe ? "me" : "them"}` }, m.content, /* @__PURE__ */ React.createElement("span", { className: "ts" }, fmtTime(m.created_at)));
  }), /* @__PURE__ */ React.createElement("div", { ref: msEndRef })), /* @__PURE__ */ React.createElement("div", { className: "chat-input" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      placeholder: "Mesaj yaz\u0131n\u2026",
      value: text,
      onChange: (e) => setText(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMsg();
        }
      }
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-icon", onClick: sendMsg, disabled: !text.trim() }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "send")))))));
}
function NotificationsScreen({ clubId }) {
  const { useState, useEffect, useRef } = React;
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = useRef(null);
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      userId.current = data.session?.user?.id;
      if (userId.current) load(userId.current);
    });
  }, []);
  const load = async (uid) => {
    const id = uid || userId.current;
    if (!id) return;
    setLoading(true);
    const { data } = await sb.from("notifications").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(80);
    setNotifs(data || []);
    setLoading(false);
  };
  const markRead = async (id) => {
    await sb.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };
  const markAllRead = async () => {
    if (!userId.current) return;
    await sb.from("notifications").update({ is_read: true }).eq("user_id", userId.current).eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };
  const del = async (id) => {
    await sb.from("notifications").delete().eq("id", id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };
  const delAll = async () => {
    if (!confirm("T\xFCm bildirimleri silmek istedi\u011Finizden emin misiniz?")) return;
    if (!userId.current) return;
    await sb.from("notifications").delete().eq("user_id", userId.current);
    setNotifs([]);
  };
  const typeStyle = (type) => {
    switch (type) {
      case "booking_created":
        return { icon: "calendar_today", color: "#3B82F6", bg: "#EFF6FF" };
      case "booking_confirmed":
        return { icon: "check_circle", color: "#22C55E", bg: "#DCFCE7" };
      case "booking_cancelled":
        return { icon: "cancel", color: "#EF4444", bg: "#FEF2F2" };
      case "payment_success":
        return { icon: "payments", color: "#F59E0B", bg: "#FFFBEB" };
      case "booking_reminder":
        return { icon: "schedule", color: "#8B5CF6", bg: "#F5F3FF" };
      case "lesson_reminder":
        return { icon: "school", color: "#8B5CF6", bg: "#F5F3FF" };
      case "lesson_created":
        return { icon: "school", color: "#0D9488", bg: "#F0FDFA" };
      case "member":
      case "membership_approved":
        return { icon: "person_add", color: "#22C55E", bg: "#DCFCE7" };
      case "membership_rejected":
        return { icon: "person_remove", color: "#EF4444", bg: "#FEF2F2" };
      case "friend_request":
        return { icon: "group_add", color: "#3B82F6", bg: "#EFF6FF" };
      case "friend_request_accepted":
        return { icon: "group", color: "#22C55E", bg: "#DCFCE7" };
      case "message":
        return { icon: "chat", color: "#003399", bg: "#EEF2FF" };
      case "payment":
        return { icon: "account_balance_wallet", color: "#F59E0B", bg: "#FFFBEB" };
      default:
        return { icon: "notifications", color: "#003399", bg: "#EEF2FF" };
    }
  };
  const unreadCount = notifs.filter((n) => !n.is_read).length;
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Bildirimler"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, unreadCount > 0 ? `${unreadCount} okunmam\u0131\u015F bildirim` : "T\xFCm bildirimler okundu")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, unreadCount > 0 && /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: markAllRead }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "done_all"), "T\xFCm\xFCn\xFC Okundu"), notifs.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", style: { color: "#EF4444" }, onClick: delAll }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "delete_sweep"), "Temizle"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, loading ? /* @__PURE__ */ React.createElement(Spinner, null) : notifs.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement(EmptyState, { icon: "notifications_none", title: "Bildirim yok", sub: "Yeni bildirimler burada g\xF6r\xFCnecek." })) : notifs.map((n) => {
    const ts = typeStyle(n.type);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: n.id,
        className: "card",
        style: {
          padding: 0,
          borderLeft: `3px solid ${n.is_read ? "transparent" : ts.color}`,
          cursor: !n.is_read ? "pointer" : "default",
          position: "relative",
          overflow: "hidden"
        },
        onClick: () => !n.is_read && markRead(n.id)
      },
      !n.is_read && /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        top: 14,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: ts.color
      } }),
      /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: {
        width: 40,
        height: 40,
        borderRadius: 12,
        flexShrink: 0,
        background: ts.bg,
        display: "grid",
        placeItems: "center"
      } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20, color: ts.color } }, ts.icon)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--text-1)", marginBottom: 3 } }, n.title || "Bildirim"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, fmtDateTime(n.created_at))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexShrink: 0 } }, !n.is_read && /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "icon-btn",
          title: "Okundu i\u015Faretle",
          style: { width: 28, height: 28, borderRadius: 8, background: "#DCFCE7" },
          onClick: (e) => {
            e.stopPropagation();
            markRead(n.id);
          }
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "#22C55E" } }, "check")
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "icon-btn",
          title: "Sil",
          style: { width: 28, height: 28, borderRadius: 8, background: "#FEF2F2" },
          onClick: (e) => {
            e.stopPropagation();
            del(n.id);
          }
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "#EF4444" } }, "delete_outline")
      ))), (n.message || n.body) && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, paddingLeft: 52 } }, n.message || n.body))
    );
  })));
}
