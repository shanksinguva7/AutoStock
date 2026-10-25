import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange'> {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange(value: string): void;
}

/** A labelled input whose error message is announced with the field. */
export function TextField({ id, label, error, onChange, ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full border border-line bg-surface px-3 py-2 text-base text-ink focus:border-ink focus:outline-none aria-invalid:border-error"
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
