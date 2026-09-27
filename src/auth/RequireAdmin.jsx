import { Navigate } from 'react-router-dom'
import { useAdminAuth } from './AdminAuth.jsx'

export default function RequireAdmin({ children }) {
  const { admin } = useAdminAuth()

  if (!admin) {
    return <Navigate to="/login" replace />
  }

  return children
}