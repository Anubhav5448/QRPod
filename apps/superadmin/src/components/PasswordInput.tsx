'use client';

import { forwardRef, useState, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showStrength?: boolean;
  value?: string;
}

type Strength = 'weak' | 'medium' | 'strong' | null;

function getStrength(password: string): Strength {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

const strengthConfig: Record<
  NonNullable<Strength>,
  { label: string; barClass: string; textClass: string; width: string }
> = {
  weak: {
    label: 'Weak',
    barClass: 'bg-red-500',
    textClass: 'text-red-600',
    width: 'w-1/3',
  },
  medium: {
    label: 'Medium',
    barClass: 'bg-amber-500',
    textClass: 'text-amber-600',
    width: 'w-2/3',
  },
  strong: {
    label: 'Strong',
    barClass: 'bg-green-500',
    textClass: 'text-green-600',
    width: 'w-full',
  },
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { showStrength = false, className = '', value = '', ...props },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);
    const strength = useMemo(
      () => (showStrength ? getStrength(value) : null),
      [showStrength, value],
    );

    return (
      <div>
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            value={value}
            className={`${className} pr-11`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition"
          >
            {visible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {showStrength && strength && (
          <div className="mt-2">
            <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strengthConfig[strength].barClass} ${strengthConfig[strength].width}`}
              />
            </div>
            <p
              className={`text-xs mt-1 ${strengthConfig[strength].textClass}`}
            >
              {strengthConfig[strength].label}
            </p>
          </div>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';