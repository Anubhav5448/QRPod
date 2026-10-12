'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  restaurantId: string | null;
  ipAddress: string | null;
  createdAt: string;
  metadata: Record<string, any> | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We'll add this endpoint on the backend next — placeholder for now
    api
      .get('/superadmin/audit-logs')
      .then((res) => setLogs(res.data?.data?.items ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Audit Logs
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          All SuperAdmin actions across the platform
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-neutral-500">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-neutral-500">
              Audit log endpoint not yet implemented on backend.
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Add GET /superadmin/audit-logs next.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {logs.map((log) => (
              <li key={log.id} className="px-6 py-4">
                <div className="font-medium text-sm text-neutral-900">
                  {log.action}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {log.targetType}
                  {log.targetId && ` · ${log.targetId.slice(0, 8)}…`}
                  {log.ipAddress && ` · ${log.ipAddress}`}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}