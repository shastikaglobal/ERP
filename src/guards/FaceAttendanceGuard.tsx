import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  children: React.ReactNode;
};

// Roles that are allowed to access the Face Attendance page.
// Everyone else is redirected to their own dashboard.
const ALLOWED_ROLES = ['admin', 'hr', 'operations', 'manager', 'secretary'];

export default function FaceAttendanceGuard({ children }: Props) {
  const { profile, loading, roleSlugs } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  }

  if (!profile?.email) {
    return <Navigate to="/dashboard" replace />;
  }

  const slugs = Array.from(roleSlugs).map(s => s.toLowerCase());
  const requestedRole = (profile.requested_role || '').toLowerCase();

  const isAllowed =
    slugs.some(s => ALLOWED_ROLES.includes(s)) ||
    ALLOWED_ROLES.includes(requestedRole);

  if (!isAllowed) {
    // Non-authorised roles go back to their own dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
