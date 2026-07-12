import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes } from "react";
import clsx from "clsx";

const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-slate-100 disabled:text-slate-400";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(fieldClass, className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx("mb-1 block text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
