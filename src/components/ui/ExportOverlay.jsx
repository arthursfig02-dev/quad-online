const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,.35)',
    zIndex: 50000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
  },
  box: {
    background: '#fff',
    border: '1px solid #d7dcfa',
    borderRadius: 14,
    padding: '28px 32px',
    minWidth: 260,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 8px 30px rgba(14,9,127,.12)',
  },
  spinner: {
    width: 38,
    height: 38,
    border: '4px solid #e5e9ff',
    borderTopColor: '#0e097f',
    borderRadius: '50%',
    animation: 'spin .8s linear infinite',
  },
  msg: {
    fontSize: 14,
    color: '#6f78a8',
  },
}

const keyframes = `@keyframes spin { to { transform: rotate(360deg); } }`

/**
 * <ExportOverlay visible msg="Gerando PDF…" />
 */
export default function ExportOverlay({ visible, msg = 'Gerando arquivo…' }) {
  if (!visible) return null
  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.overlay} role="status" aria-live="polite">
        <div style={styles.box}>
          <div style={styles.spinner} />
          <p style={styles.msg}>{msg}</p>
        </div>
      </div>
    </>
  )
}
