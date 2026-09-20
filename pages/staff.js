// pages/staff.js
//
// Staff-only page. Shows the two daily-entry forms (Collection and Expense)
// plus each one's own recent-entries list so they can fix a mistake -
// edit or delete an entry they made themselves. Wrapped in ProtectedRoute
// so only logged-in staff (or admin) can view it.

import { useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import CollectionForm from '../components/CollectionForm';
import ExpenseForm from '../components/ExpenseForm';
import CollectionHistory from '../components/CollectionHistory';
import ExpenseHistory from '../components/ExpenseHistory';

export default function StaffPage() {
  // Bumping these keys tells the matching history list to refetch after a
  // new entry is saved, so the list stays in sync with the form.
  const [collectionRefreshKey, setCollectionRefreshKey] = useState(0);
  const [expenseRefreshKey, setExpenseRefreshKey] = useState(0);

  return (
    <ProtectedRoute allowedRoles={['staff', 'admin']}>
      <div className="min-h-screen bg-gray-100 pb-10">
        <Navbar />
        <main className="mx-auto max-w-md space-y-4 p-4">
          <CollectionForm onSaved={() => setCollectionRefreshKey((k) => k + 1)} />
          <CollectionHistory refreshKey={collectionRefreshKey} />

          <ExpenseForm onSaved={() => setExpenseRefreshKey((k) => k + 1)} />
          <ExpenseHistory refreshKey={expenseRefreshKey} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
