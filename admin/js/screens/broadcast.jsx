// ── Toplu Bildirim Modalı (Custom Push) ────────────────────────
// Mobil ClubBroadcastScreen ile birebir: kitle seç (üye/müşteri/ikisi) → başlık +
// mesaj → gönder. BroadcastSvc.sendBroadcast → send_club_broadcast RPC → push.
// Yalnız aktif + uygulama hesabı olan üye/müşteriler alıcıdır.

const AUDIENCE_OPTS = [
  { key: 'members',   label: 'Üyeler',     icon: 'card_membership' },
  { key: 'customers', label: 'Müşteriler', icon: 'people' },
  { key: 'both',      label: 'İkisi',      icon: 'groups' },
];
const TITLE_MAX = 80;
const MSG_MAX   = 500;

window.ClubBroadcastModal = function ClubBroadcastModal({ clubId, initialAudience, onClose }) {
  const { useState, useEffect } = React;

  const [audience, setAudience] = useState(initialAudience || 'both');
  const [title, setTitle]       = useState('');
  const [message, setMessage]   = useState('');
  const [counts, setCounts]     = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!clubId) return;
      try {
        setLoadingCounts(true);
        const c = await BroadcastSvc.getRecipientCounts(clubId);
        if (alive) setCounts(c);
      } catch (e) { console.error('Broadcast counts:', e.message); }
      finally { if (alive) setLoadingCounts(false); }
    })();
    return () => { alive = false; };
  }, [clubId]);

  const recipientCount = counts ? counts[audience] : 0;

  const doSend = async () => {
    if (!title.trim() || !message.trim()) { alert('Lütfen başlık ve mesaj girin.'); return; }
    if (recipientCount === 0) { alert('Seçilen kitlede uygulama hesabı olan aktif kişi bulunmuyor.'); return; }
    if (!confirm(`${recipientCount} kişiye gönderilecek. Onaylıyor musunuz?`)) return;
    setSending(true);
    try {
      const sent = await BroadcastSvc.sendBroadcast(audience, title.trim(), message.trim());
      alert(`${sent} kişiye bildirim gönderildi.`);
      onClose?.();
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('not_authorized'))     alert('Bu işlem için kulüp hesabı gerekiyor.');
      else if (msg.includes('empty_message')) alert('Başlık ve mesaj boş olamaz.');
      else                                    alert('Bildirim gönderilemedi. Lütfen tekrar deneyin.');
    } finally { setSending(false); }
  };

  return (
    <Modal
      title="Toplu Bildirim"
      sub="Aktif üye ve müşterilerine özel push bildirimi gönder"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Vazgeç</button>
          <button className="btn btn-pri btn-sm" onClick={doSend} disabled={sending || loadingCounts}>
            <span className="material-icons" style={{ fontSize: 16 }}>send</span>
            {sending ? ' Gönderiliyor…' : ` Gönder${recipientCount > 0 ? ` (${recipientCount})` : ''}`}
          </button>
        </>
      }
    >
      <div className="fields" style={{ gap: 14 }}>
        {/* Kitle */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kime gönderilsin?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {AUDIENCE_OPTS.map(opt => {
              const active = audience === opt.key;
              const n = counts ? counts[opt.key] : 0;
              return (
                <button key={opt.key} type="button" onClick={() => setAudience(opt.key)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--brand-navy)' : 'var(--border)'}`,
                    background: active ? 'var(--brand-navy)' : '#fff',
                    color: active ? '#fff' : 'var(--text-1)',
                  }}>
                  <span className="material-icons" style={{ fontSize: 18, color: active ? '#fff' : 'var(--brand-navy)' }}>{opt.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
                  <span style={{
                    minWidth: 22, padding: '1px 6px', borderRadius: 10, fontSize: 12, fontWeight: 700, textAlign: 'center',
                    background: active ? 'rgba(255,255,255,0.22)' : '#EEF2FF',
                    color: active ? '#fff' : 'var(--brand-navy)',
                  }}>{loadingCounts ? '…' : n}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.4 }}>
            {loadingCounts
              ? 'Alıcılar hesaplanıyor…'
              : `Bu bildirim ${recipientCount} kişiye ulaşacak. Yalnız uygulama hesabı olan aktif üye/müşteriler push alır.`}
          </div>
        </div>

        {/* Başlık */}
        <Field label="Başlık">
          <input value={title} maxLength={TITLE_MAX}
            onChange={e => setTitle(e.target.value)}
            placeholder="Örn. Bu hafta sonu turnuva!" />
          <div style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'right', marginTop: 4 }}>{title.length}/{TITLE_MAX}</div>
        </Field>

        {/* Mesaj */}
        <Field label="Mesaj">
          <textarea rows={5} value={message} maxLength={MSG_MAX}
            onChange={e => setMessage(e.target.value)}
            placeholder="Bildirim içeriğini yazın…" style={{ resize: 'vertical' }} />
          <div style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'right', marginTop: 4 }}>{message.length}/{MSG_MAX}</div>
        </Field>
      </div>
    </Modal>
  );
};
