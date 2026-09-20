// pages/login.js
//
// Public login page. After a successful sign-in, waits for the AuthContext
// to resolve the user's role (via its onAuthStateChange listener) and then
// routes them to the matching dashboard.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Once the role has loaded after a successful login, redirect.
  useEffect(() => {
    if (!justLoggedIn || loading || !user || !role) return;

    router.replace(role === 'admin' ? '/admin' : '/staff');
  }, [justLoggedIn, loading, user, role, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <LoginForm onSuccess={() => setJustLoggedIn(true)} />
    </div>
  );
}
