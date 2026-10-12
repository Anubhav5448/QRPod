'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  RefreshCw,
  Trash2,
  Loader2,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';

export interface Table {
  id: string;
  tableNumber: string;
  displayName: string | null;
  seats: number | null;
  qrToken: string;
  qrUrl: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

interface Props {
  table: Table;
  onDeleted: (id: string) => void;
  onUpdated: (table: Table) => void;
}

export function TableCard({ table, onDeleted, onUpdated }: Props) {
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const handleDownloadQr = () => {
    const svg = qrWrapperRef.current?.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    // Wrap SVG with white background for better scanning
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `table-${table.tableNumber}-qr.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = url;
  };

  const handleRegenerate = async () => {
    if (
      !confirm(
        'Regenerating will invalidate the old QR code. Any printed copies will stop working. Continue?',
      )
    ) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await api.post(`/owner/tables/${table.id}/regenerate-qr`);
      onUpdated(res.data?.data);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to regenerate QR');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/owner/tables/${table.id}`);
      onDeleted(table.id);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to delete table');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-neutral-900 text-base">
              Table {table.tableNumber}
            </h3>
            {table.displayName && (
              <p className="text-xs text-neutral-500 mt-0.5 truncate">
                {table.displayName}
              </p>
            )}
          </div>
          {table.seats && (
            <div className="flex items-center gap-1 text-xs text-neutral-500 shrink-0">
              <Users className="w-3 h-3" />
              {table.seats}
            </div>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="p-6 flex items-center justify-center bg-neutral-50">
        <div
          ref={qrWrapperRef}
          className="bg-white p-3 rounded-lg border border-neutral-200"
        >
          <QRCodeSVG value={table.qrUrl} size={140} level="M" />
        </div>
      </div>

      {/* URL hint */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-neutral-400 text-center truncate font-mono">
          {table.qrUrl}
        </p>
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-neutral-100 mt-auto">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition flex items-center justify-center gap-1.5"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDownloadQr}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center justify-center px-2 py-2 rounded-lg text-xs text-neutral-500 hover:bg-neutral-100 transition disabled:opacity-60"
              title="Regenerate QR"
            >
              {regenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center px-2 py-2 rounded-lg text-xs text-neutral-500 hover:bg-red-50 hover:text-red-600 transition"
              title="Delete table"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}