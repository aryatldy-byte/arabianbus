// components/CollectionForm.js
//
// Staff use this to log a day's ticket collection for a given bus.
// Inserts a row into the `collections` table, tagged with the logged-in
// staff member's id (staff_id) so admins can trace who entered what.

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { BUS_NUMBERS } from '../lib/constants';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function CollectionForm({ onSaved }) {
  const { user } = useAuth();
  const [busNumber, setBusNumber] = useState(BUS_NUMBERS[0]);
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!amount || Number(amount) <= 0) {
      setStatus({ type: 'error', message: 'Enter a valid collection amount.' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('collections').insert({
      bus_number: busNumber,
      date,
      amount: Number(amount),
      staff_id: user.id,
    });
    setSubmitting(false);

    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'success', message: 'Collection saved successfully.' });
      setAmount('');
      onSaved?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Daily Collection</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Bus Number</label>
        <select
          value={busNumber}
          onChange={(e) => setBusNumber(e.target.value)}
          className="input-field"
        >
          {BUS_NUMBERS.map((bus) => (
            <option key={bus} value={bus}>
              {bus}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Amount Collected (₹)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-field"
          placeholder="e.g. 4500"
          required
        />
      </div>

      {status.message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            status.type === 'error'
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {status.message}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Saving...' : 'Save Collection'}
      </button>
    </form>
  );
}
