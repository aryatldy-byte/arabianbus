// components/CollectionHistory.js
//
// Shows the logged-in staff member's own recent collection entries and lets
// them fix mistakes: edit inline, or delete. This is a UI convenience only -
// the real protection is the database's RLS policies (see
// supabase/migration_edit_delete.sql), which only allow a user to
// update/delete rows where they are the original staff_id. So even if
// someone bypassed this UI and called the API directly, they still could
// not touch another staff member's entries.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { BUS_NUMBERS } from '../lib/constants';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n || 0
  );

export default function CollectionHistory({ refreshKey }) {
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
    // RLS already restricts this to the caller's own rows, but filtering
    // explicitly here too keeps the query intent clear and avoids relying
    // solely on the database to enforce it.
    const { data, error: fetchError } = await supabase
      .from('collections')
      .select('id, bus_number, date, amount, updated_at')
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
    setEditDraft({ bus_number: row.bus_number, date: row.date, amount: String(row.amount) });
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
      .from('collections')
      .update({
        bus_number: editDraft.bus_number,
        date: editDraft.date,
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
    const confirmed = window.confirm('Delete this collection entry? This cannot be undone.');
    if (!confirmed) return;

    setError('');
    const { error: deleteError } = await supabase.from('collections').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else fetchRows();
  };

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">My Recent Collections</h2>

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
                  <p className="truncate font-medium text-gray-800">{row.bus_number}</p>
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
