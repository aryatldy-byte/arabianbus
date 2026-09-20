// components/ProtectedRoute.js
//
// Wraps a page and enforces:
//   1. The user must be logged in (else -> /login)
//   2. If `allowedRoles` is given, the user's role must be in that list
//      (else -> redirected to their correct home page)
//
// Usage:
//   <ProtectedRoute allowedRoles={['admin']}>
//     <AdminDashboard />
//   </ProtectedRoute>

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // wait until we know the auth state

    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      // Logged in, but wrong role - send them to their own home page.
      router.replace(role === 'admin' ? '/admin' : '/staff');
    }
  }, [user, role, loading, allowedRoles, router]);

  if (loading || !user || (allowedRoles && role && !allowedRoles.includes(role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return children;
}
