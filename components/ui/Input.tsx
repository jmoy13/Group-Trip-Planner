import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-sage-700">
        {label}
      </label>
      <input
        id={id}
        className={`rounded-md border bg-white px-3 py-2 text-sm text-sage-900 outline-none focus:ring-2 focus:ring-sage-400 ${
          error ? "border-red-500" : "border-sage-300"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
