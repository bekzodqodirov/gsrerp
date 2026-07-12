import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
  secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 hover:border-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
