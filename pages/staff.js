// pages/staff.js
//
// Staff-only page. Shows the two daily-entry forms: Collection and Expense.
// Wrapped in ProtectedRoute so only logged-in staff (or admin) can view it.

import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import CollectionForm from '../components/CollectionForm';
import ExpenseForm from '../components/ExpenseForm';

export default function StaffPage() {
  return (
    <ProtectedRoute allowedRoles={['staff', 'admin']}>
      <div className="min-h-screen bg-gray-100 pb-10">
        <Navbar />
        <main className="mx-auto max-w-md space-y-4 p-4">
          <CollectionForm />
          <ExpenseForm />
        </main>
      </div>
    </ProtectedRoute>
  );
}
