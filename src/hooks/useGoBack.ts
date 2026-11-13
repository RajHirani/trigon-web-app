import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/** Back to where the user came from; a direct visit (no history in this app) goes to `fallback`. */
export function useGoBack(fallback = '/dashboard') {
  const navigate = useNavigate()
  return useCallback(() => {
    if ((window.history.state as { idx?: number } | null)?.idx) navigate(-1)
    else navigate(fallback)
  }, [navigate, fallback])
}
