'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { TableCard, type Table } from '@/components/TableCard';
import { AddTableDialog } from '@/components/AddTableDialog';

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/owner/tables');
      setTables(res.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleCreated = (table: Table) => {
    setTables((prev) => [...prev, table]);
    setShowAddDialog(false);
  };

  const handleDeleted = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdated = (table: Table) => {
    setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Tables &amp; QR Codes
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Create tables and print QR codes for each one
            </p>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 mb-6">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : tables.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <h3 className="text-sm font-medium text-neutral-900 mb-1">
              No tables yet
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              Add your first table to generate a QR code customers can scan.
            </p>
            <button
              onClick={() => setShowAddDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition"
            >
              <Plus className="w-4 h-4" />
              Add Your First Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onDeleted={handleDeleted}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}

        {showAddDialog && (
          <AddTableDialog
            onCreated={handleCreated}
            onClose={() => setShowAddDialog(false)}
          />
        )}
      </div>
    </div>
  );
}