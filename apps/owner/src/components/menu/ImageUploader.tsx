'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  itemId: string;
  imageUrl: string | null;
  onUploaded: (newImageUrl: string) => void;
  disabled?: boolean;
}

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB (compressed server-side)
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImageUploader({
  itemId,
  imageUrl,
  onUploaded,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError('Only JPG, PNG, WebP, or GIF files are allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be under 20 MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(
        `/owner/menu/items/${itemId}/image`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      const newUrl = res.data?.data?.imageUrl;
      if (newUrl) onUploaded(newUrl);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleRemove = async () => {
    if (!confirm('Remove this image?')) return;
    // For now we don't have a DELETE endpoint — the backend deletes old image on next upload.
    // To remove without uploading, we'd need a DELETE endpoint. Skip for now.
  };

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        Item Image
      </label>

      {imageUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
          <img
            src={imageUrl}
            alt="Item"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || disabled}
            className="absolute top-2 right-2 px-3 py-1.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-neutral-800 hover:bg-white transition disabled:opacity-60 flex items-center gap-1.5"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Replace
              </>
            )}
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-lg border-2 border-dashed transition cursor-pointer ${
            dragging
              ? 'border-neutral-900 bg-neutral-50'
              : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50'
          } ${uploading ? 'pointer-events-none' : ''}`}
        >
          <div className="h-48 flex flex-col items-center justify-center text-center p-6">
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400 mb-2" />
                <p className="text-sm text-neutral-500">Uploading…</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center mb-3">
                  <ImageIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-700 mb-1">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-neutral-400">
                  JPG, PNG, WebP, or GIF · Max 20 MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}

      {!imageUrl && (
        <p className="text-xs text-neutral-400 mt-1.5">
          Save the item first before uploading an image.
        </p>
      )}
    </div>
  );
}