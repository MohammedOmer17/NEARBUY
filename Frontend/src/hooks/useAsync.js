import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(fn, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null })
  const ticket = useRef(0)

  const run = useCallback(async ({ silent = false } = {}) => {
    const id = ++ticket.current
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fn()
      if (id === ticket.current) setState({ data, loading: false, error: null })
    } catch (error) {
      if (id === ticket.current) setState((s) => ({ data: silent ? s.data : null, loading: false, error }))
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (enabled) run()
    else setState({ data: null, loading: false, error: null })
  }, [run, enabled])

  return { ...state, reload: run }
}
