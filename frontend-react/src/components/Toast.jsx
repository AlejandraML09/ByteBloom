import { useState, useCallback } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  const showToast = useCallback((text) => {
    setMsg(text)
    setVisible(true)
    setTimeout(() => setVisible(false), 3500)
  }, [])

  return { msg, visible, showToast }
}

export default function Toast({ msg, visible }) {
  return <div className={`toast${visible ? ' show' : ''}`}>{msg}</div>
}
