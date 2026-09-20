// components/AdminDashboard.js
//
// Admin-only view. Lets the owner filter by date range + bus, then shows:
//   - Summary cards: total collection, total expense, net profit (per bus + overall)
//   - A collections table and an expenses table for the filtered range
//
// Data is fetched directly from Supabase. RLS policies (see supabase/schema.sql)
// only allow rows to be read here if the logged-in user has role = 'admin'.

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import BusFilterBar from './BusFilterBar';
import { BUS_NUMBERS } from '../lib/constants';

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n || 0
  );

export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    startDate: daysAgoISO(30),
    endDate: todayISO(),
    busNumber: 'all',
  });
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      setLoading(true);
      setError('');

      // Build the two queries, applying the same date range + optional bus filter.
      let collectionsQuery = supabase
        .from('collections')
        .select('id, bus_number, date, amount')
        .gte('date', filters.startDate)
        .lte('date', filters.endDate)
        .order('date', { ascending: false });

      let expensesQuery = supabase
        .from('expenses')
        .select('id, bus_number, date, expense_type, amount')
        .gte('date', filters.startDate)
        .lte('date', filters.endDate)
        .order('date', { ascending: false });

      if (filters.busNumber !== 'all') {
        collectionsQuery = collectionsQuery.eq('bus_number', filters.busNumber);
        expensesQuery = expensesQuery.eq('bus_number', filters.busNumber);
      }

      const [{ data: collectionsData, error: collectionsError }, { data: expensesData, error: expensesError }] =
        await Promise.all([collectionsQuery, expensesQuery]);

      if (isCancelled) return;

      if (collectionsError || expensesError) {
        setError(collectionsError?.message || expensesError?.message);
      } else {
        setCollections(collectionsData || []);
        setExpenses(expensesData || []);
      }
      setLoading(false);
    }

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [filters]);

  // Compute per-bus and overall totals from the currently loaded rows.
  const totals = useMemo(() => {
    const perBus = {};
    BUS_NUMBERS.forEach((bus) => {
      perBus[bus] = { collection: 0, expense: 0 };
    });

    collections.forEach((row) => {
      perBus[row.bus_number] = perBus[row.bus_number] || { collection: 0, expense: 0 };
      perBus[row.bus_number].collection += Number(row.amount);
    });
    expenses.forEach((row) => {
      perBus[row.bus_number] = perBus[row.bus_number] || { collection: 0, expense: 0 };
      perBus[row.bus_number].expense += Number(row.amount);
    });

    const overall = Object.values(perBus).reduce(
      (acc, b) => ({
        collection: acc.collection + b.collection,
        expense: acc.expense + b.expense,
      }),
      { collection: 0, expense: 0 }
    );

    return { perBus, overall };
  }, [collections, expenses]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>

      <BusFilterBar filters={filters} onChange={setFilters} />

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* Overall summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Collection" value={formatCurrency(totals.overall.collection)} tone="green" />
        <SummaryCard label="Total Expense" value={formatCurrency(totals.overall.expense)} tone="red" />
        <SummaryCard
          label="Net Profit"
          value={formatCurrency(totals.overall.collection - totals.overall.expense)}
          tone={totals.overall.collection - totals.overall.expense >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Per-bus summary */}
      <div className="card">
        <h2 className="mb-3 text-base font-semibold text-gray-800">Per-Bus Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2">Bus</th>
                <th className="py-2">Collection</th>
                <th className="py-2">Expense</th>
                <th className="py-2">Net</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totals.perBus).map(([bus, t]) => (
                <tr key={bus} className="border-b last:border-0">
                  <td className="py-2 font-medium">{bus}</td>
                  <td className="py-2 text-green-700">{formatCurrency(t.collection)}</td>
                  <td className="py-2 text-red-700">{formatCurrency(t.expense)}</td>
                  <td className="py-2 font-medium">{formatCurrency(t.collection - t.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading data...</p>
      ) : (
        <>
          <DataTable
            title="Daily Collections"
            rows={collections}
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'bus_number', label: 'Bus' },
              { key: 'amount', label: 'Amount', format: formatCurrency },
            ]}
          />
          <DataTable
            title="Daily Expenses"
            rows={expenses}
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'bus_number', label: 'Bus' },
              { key: 'expense_type', label: 'Type' },
              { key: 'amount', label: 'Amount', format: formatCurrency },
            ]}
          />
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneClasses = tone === 'green' ? 'text-green-700' : 'text-red-700';
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${toneClasses}`}>{value}</p>
    </div>
  );
}

function DataTable({ title, rows, columns }) {
  return (
    <div className="card">
      <h2 className="mb-3 text-base font-semibold text-gray-800">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No records for the selected filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                {columns.map((col) => (
                  <th key={col.key} className="py-2 pr-4">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="py-2 pr-4">
                      {col.format ? col.format(row[col.key]) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
