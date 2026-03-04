import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { canEditCaiDat } from '@/lib/permissions'

export default function CaiDatPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('userInfo')
      const info = raw ? JSON.parse(raw) : {}
      if (!canEditCaiDat(info.clubPermission || '')) {
        navigate('/dashboard', { replace: true })
        return
      }
      navigate('/dashboard/cai-dat/website', { replace: true })
    } catch {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return null
}
