'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PasswordInput } from '@/components/PasswordInput';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  slug: z
    .string()
    .min(2)
    .max(180)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Lowercase letters, numbers, and hyphens only',
    ),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  ownerName: z.string().min(2, 'Owner name is required').max(120),
  ownerEmail: z.string().email('Enter a valid email'),
  ownerPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function NewRestaurantPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const ownerPasswordValue = watch('ownerPassword') ?? '';

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setValue('slug', slug);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        phone: values.phone || undefined,
        address: values.address || undefined,
        ownerName: values.ownerName,
        ownerEmail: values.ownerEmail,
        ownerPassword: values.ownerPassword,
      };
      const res = await api.post('/superadmin/restaurants', payload);
      const id = res.data?.data?.restaurant?.id;
      router.push(id ? `/restaurants/${id}` : '/restaurants');
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 409) {
        setServerError(message ?? 'Slug or email already in use.');
      } else if (status === 400) {
        setServerError('Please check the form fields.');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/restaurants"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Restaurants
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          New Restaurant
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Create a restaurant and its owner account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Restaurant details */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-medium text-neutral-900 mb-4 uppercase tracking-wider">
            Restaurant Details
          </h2>

          <div className="space-y-4">
            <Field label="Restaurant Name" error={errors.name?.message}>
              <input
                type="text"
                {...register('name')}
                onChange={handleNameChange}
                placeholder="The Garden Kitchen"
                className={inputClass}
                disabled={submitting}
              />
            </Field>

            <Field
              label="Slug"
              error={errors.slug?.message}
              hint="URL-friendly identifier — lowercase, hyphens only"
            >
              <input
                type="text"
                {...register('slug')}
                placeholder="the-garden-kitchen"
                className={inputClass}
                disabled={submitting}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" error={errors.phone?.message}>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="+919000000001"
                  className={inputClass}
                  disabled={submitting}
                />
              </Field>
            </div>

            <Field label="Address" error={errors.address?.message}>
              <textarea
                {...register('address')}
                placeholder="12 MG Road, Dehradun"
                rows={2}
                className={inputClass}
                disabled={submitting}
              />
            </Field>
          </div>
        </section>

        {/* Owner details */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-medium text-neutral-900 mb-4 uppercase tracking-wider">
            Owner Account
          </h2>

          <div className="space-y-4">
            <Field
              label="Owner Name"
              error={errors.ownerName?.message}
            >
              <input
                type="text"
                {...register('ownerName')}
                placeholder="John Doe"
                className={inputClass}
                disabled={submitting}
              />
            </Field>

            <Field
              label="Owner Email"
              error={errors.ownerEmail?.message}
            >
              <input
                type="email"
                {...register('ownerEmail')}
                placeholder="owner@example.com"
                className={inputClass}
                disabled={submitting}
              />
            </Field>

            <Field
              label="Owner Password"
              error={errors.ownerPassword?.message}
              hint="Minimum 12 characters — share with the owner securely"
            >
              <PasswordInput
                {...register('ownerPassword')}
                value={ownerPasswordValue}
                showStrength
                placeholder="••••••••••••"
                className={inputClass}
                disabled={submitting}
                autoComplete="new-password"
              />
            </Field>
          </div>
        </section>

        {serverError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/restaurants"
            className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition"
          >
            Cancel
          </Link>
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
              'Create Restaurant'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full h-11 px-3 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition disabled:opacity-60';

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-neutral-400 mt-1.5">{hint}</p>
      )}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}