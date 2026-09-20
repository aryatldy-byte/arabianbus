// components/LoginForm.js
//
// Simple email/password login form. On success, the parent page (pages/login.js)
// is responsible for redirecting based on role - this component only handles
// the credential submission itself.

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginForm({ onSuccess }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: signInError } = await signIn(email, password);

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Bus Service Login</h1>
        <p className="text-sm text-gray-500">Sign in with your staff or admin account.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
