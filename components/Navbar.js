// components/Navbar.js
//
// Minimal top bar shown on staff/admin pages. Shows the user's email + role
// and a logout button. Kept mobile-friendly (single row, no overflow).

import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between bg-brand-600 px-4 py-3 text-white shadow">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">🚌 Bus Service</p>
        <p className="truncate text-xs text-brand-50">
          {user?.email} · {role}
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="shrink-0 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
      >
        Logout
      </button>
    </nav>
  );
}
