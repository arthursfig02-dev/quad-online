import { useState, useImperativeHandle, forwardRef, useRef } from 'react'

const COLORS = {
  success: '#22c55e',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    '#7C83F7',
}

const styles = {
  base: {
    position: 'fixed',
    bottom: 28,
    left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    padding: '10px 22px',
    borderRadius: 30,
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity .3s, transform .3s',
    zIndex: 99999,
    boxShadow: '0 8px 30px rgba(14,9,127,.12)',
    whiteSpace: 'nowrap',
  },
  show: {
    opacity: 1,
    transform: 'translateX(-50%) translateY(0)',
  },
}

/**
 * Uso:
 *   const toastRef = useRef()
 *   <Toast ref={toastRef} />
 *   toastRef.current.show('Mensagem!', 'success')
 */
const Toast = forwardRef(function Toast(_, ref) {
  const [state, setState] = useState({ msg: '', color: COLORS.success, visible: false })
  const timerRef = useRef(null)

  useImperativeHandle(ref, () => ({
    show(msg, type = 'success', duration = 2400) {
      clearTimeout(timerRef.current)
      setState({ msg, color: COLORS[type] ?? type, visible: true })
      timerRef.current = setTimeout(() =>
        setState(s => ({ ...s, visible: false })), duration)
    }
  }))

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        ...styles.base,
        ...(state.visible ? styles.show : {}),
        background: state.color,
      }}
    >
      {state.msg}
    </div>
  )
})

export default Toast
