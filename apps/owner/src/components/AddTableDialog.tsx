'use client';

import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { Table } from './TableCard';

interface Props {
  onCreated: (table: Table) => void;
  onClose: () => void;
}

export function AddTableDialog({ onCreated, onClose }: Props) {
  const [tableNumber, setTableNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [seats, setSeats] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError('Table number is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        tableNumber: tableNumber.trim(),
      };
      if (displayName.trim()) payload.displayName = displayName.trim();
      if (seats) {
        const n = Number(seats);
        if (Number.isInteger(n) && n > 0 && n <= 50) {
          payload.seats = n;
        }
      }

      const res = await api.post('/owner/tables', payload);
      onCreated(res.data?.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create table');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Add Table
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Table Number" required>
            <input
              type="text"
              autoFocus
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. 5 or A12"
              className={inputClass}
              disabled={submitting}
              maxLength={30}
            />
          </Field>

          <Field label="Display Name" hint="Optional — e.g. 'Window Table'">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Window Table"
              className={inputClass}
              disabled={submitting}
              maxLength={80}
            />
          </Field>

          <Field label="Seats" hint="Optional — number of seats">
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              placeholder="4"
              min={1}
              max={50}
              className={inputClass}
              disabled={submitting}
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create Table'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full h-11 px-3 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-60';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-400 mt-1.5">{hint}</p>}
    </div>
  );
}