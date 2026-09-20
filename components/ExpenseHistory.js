// components/ExpenseHistory.js
//
// Same pattern as CollectionHistory.js, for the `expenses` table. Lets staff
// fix a wrong bus/date/type/amount, or delete an entry made by mistake.
// Protected at the database level by RLS (supabase/migration_edit_delete.sql).

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { BUS_NUMBERS, EXPENSE_TYPES } from '../lib/constants';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n || 0
  );

export default function ExpenseHistory({ refreshKey }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [savingId, setSavingId] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('expenses')
      .select('id, bus_number, date, expense_type, amount, updated_at')
      .eq('staff_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (fetchError) setError(fetchError.message);
    else setRows(data || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows, refreshKey]);

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditDraft({
      bus_number: row.bus_number,
      date: row.date,
      expense_type: row.expense_type,
      amount: String(row.amount),
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const saveEdit = async (id) => {
    if (!editDraft.amount || Number(editDraft.amount) <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setSavingId(id);
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        bus_number: editDraft.bus_number,
        date: editDraft.date,
        expense_type: editDraft.expense_type,
        amount: Number(editDraft.amount),
      })
      .eq('id', id);
    setSavingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditingId(null);
    fetchRows();
  };

  const deleteRow = async (id) => {
    const confirmed = window.confirm('Delete this expense entry? This cannot be undone.');
    if (!confirmed) return;

    setError('');
    const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else fetchRows();
  };

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">My Recent Expenses</h2>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No entries yet.</p>
      ) : (
        <div className="divide-y">
          {rows.map((row) =>
            editingId === row.id ? (
              <div key={row.id} className="space-y-2 py-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editDraft.bus_number}
                    onChange={(e) => setEditDraft({ ...editDraft, bus_number: e.target.value })}
                    className="input-field"
                  >
                    {BUS_NUMBERS.map((bus) => (
                      <option key={bus} value={bus}>
                        {bus}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editDraft.date}
                    onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <select
                  value={editDraft.expense_type}
                  onChange={(e) => setEditDraft({ ...editDraft, expense_type: e.target.value })}
                  className="input-field"
                >
                  {EXPENSE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editDraft.amount}
                  onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
                  className="input-field"
                  placeholder="Amount"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(row.id)}
                    disabled={savingId === row.id}
                    className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {savingId === row.id ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div key={row.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800">
                    {row.bus_number} · {row.expense_type}
                  </p>
                  <p className="text-gray-500">
                    {row.date} · {formatCurrency(row.amount)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button onClick={() => startEdit(row)} className="font-medium text-brand-600">
                    Edit
                  </button>
                  <button onClick={() => deleteRow(row.id)} className="font-medium text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
