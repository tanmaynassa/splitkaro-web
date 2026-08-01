export default function InteractiveDemo({ onTryNow }) {
  return (
    <div
      onClick={onTryNow}
      style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f8faff 100%)',
        border: '1.5px solid #d1fae5',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes sk-fade {
          0%, 100% { opacity: 0; transform: translateY(6px); }
          8%, 22% { opacity: 1; transform: translateY(0); }
          30% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes sk-fade2 {
          0%, 28% { opacity: 0; transform: translateY(6px); }
          36%, 50% { opacity: 1; transform: translateY(0); }
          58% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes sk-fade3 {
          0%, 56% { opacity: 0; transform: translateY(6px); }
          64%, 78% { opacity: 1; transform: translateY(0); }
          86% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes sk-fade4 {
          0%, 84% { opacity: 0; transform: translateY(6px); }
          92%, 98% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; }
        }
        .sk-step1 { animation: sk-fade 10s ease-in-out infinite; opacity: 0; }
        .sk-step2 { animation: sk-fade2 10s ease-in-out infinite; opacity: 0; }
        .sk-step3 { animation: sk-fade3 10s ease-in-out infinite; opacity: 0; }
        .sk-step4 { animation: sk-fade4 10s ease-in-out infinite; opacity: 0; }
      `}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: 20 }}>
          Demo
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af', background: 'rgba(255,255,255,0.8)', padding: '3px 10px', borderRadius: 20 }}>
          Tap to try with your bill →
        </span>
      </div>

      {/* Stacked screens — all rendered, CSS controls visibility */}
      <div style={{ position: 'relative', minHeight: 260, margin: '0 14px' }}>

        {/* Step 1: Upload */}
        <div className="sk-step1" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 72, height: 72, background: 'white', borderRadius: 16, border: '1.5px solid #d1fae5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: 28 }}>📄</span>
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>zepto.pdf</span>
          </div>
          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>Uploading invoice...</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>Download from Zepto → share here</span>
        </div>

        {/* Step 2: Item list with tags */}
        <div className="sk-step2" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Zepto — 12-07-2026</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>₹277</span>
          </div>
          {[
            { name: 'Cucumber English', amt: 41, tag: 'Shared', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
            { name: 'Amul Milk', amt: 30, tag: 'Shared', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
            { name: 'Amul Paneer x2', amt: 190, tag: 'Shared', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
            { name: 'Too Yumm Karare', amt: 16, tag: 'Shared', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: item.bg, border: `1px solid ${item.border}`, borderRadius: 10, padding: '6px 10px' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>₹{item.amt}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: item.color, background: 'white', border: `1px solid ${item.border}`, padding: '2px 8px', borderRadius: 6 }}>{item.tag}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>Tap items to tag them →</div>
        </div>

        {/* Step 3: After tagging */}
        <div className="sk-step3" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Zepto — 12-07-2026</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>₹277</span>
          </div>
          {[
            { name: 'Cucumber English', amt: 41, tag: 'Shared', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
            { name: 'Amul Milk', amt: 30, tag: 'You', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
            { name: 'Amul Paneer x2', amt: 190, tag: 'Shared', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
            { name: 'Too Yumm Karare', amt: 16, tag: 'Rohan', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: item.bg, border: `1px solid ${item.border}`, borderRadius: 10, padding: '6px 10px' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>₹{item.amt}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: item.color, background: 'white', border: `1px solid ${item.border}`, padding: '2px 8px', borderRadius: 6 }}>{item.tag}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-around', background: 'white', border: '1px solid #d1fae5', borderRadius: 10, padding: '7px 12px' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#9ca3af' }}>You</div><div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>₹146</div></div>
            <div style={{ width: 1, background: '#f3f4f6' }} />
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#9ca3af' }}>Rohan</div><div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>₹131</div></div>
          </div>
        </div>

        {/* Step 4: Done */}
        <div className="sk-step4" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 40 }}>✅</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Logged to Splitwise</span>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Rohan owes you</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>₹131</div>
          </div>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>No math. No manual entry.</span>
        </div>

      </div>

      <div style={{ height: 14 }} />
    </div>
  )
}
