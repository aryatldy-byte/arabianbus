// components/BusFilterBar.js
//
// Controlled filter bar used by the admin dashboard: date range + bus number.
// Purely presentational - the parent (AdminDashboard) owns the state and
// re-queries Supabase whenever these values change.

import { BUS_NUMBERS } from '../lib/constants';

export default function BusFilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="card grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="col-span-1">
        <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => update('startDate', e.target.value)}
          className="input-field"
        />
      </div>
      <div className="col-span-1">
        <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => update('endDate', e.target.value)}
          className="input-field"
        />
      </div>
      <div className="col-span-2 sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-gray-600">Bus</label>
        <select
          value={filters.busNumber}
          onChange={(e) => update('busNumber', e.target.value)}
          className="input-field"
        >
          <option value="all">All Buses</option>
          {BUS_NUMBERS.map((bus) => (
            <option key={bus} value={bus}>
              {bus}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
