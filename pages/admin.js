// pages/admin.js
//
// Admin-only page. Wrapped in ProtectedRoute with allowedRoles=['admin'] so
// staff accounts get redirected away if they try to visit it directly.

import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-100 pb-10">
        <Navbar />
        <main className="mx-auto max-w-4xl">
          <AdminDashboard />
        </main>
      </div>
    </ProtectedRoute>
  );
}
