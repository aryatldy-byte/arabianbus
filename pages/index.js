// pages/index.js
//
// Entry point. Just redirects to the right place depending on auth state:
//   - not logged in -> /login
//   - logged in as admin -> /admin
//   - logged in as staff -> /staff

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (role === 'admin') {
      router.replace('/admin');
    } else if (role === 'staff') {
      router.replace('/staff');
    }
  }, [user, role, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );
}
