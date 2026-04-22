import * as React from "react";

type Variant = "default" | "secondary" | "ghost" | "danger";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "default", className, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50";

  const variants: Record<Variant, string> = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "hover:bg-slate-100 text-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-500"
  };

  return <button {...props} className={`${base} ${variants[variant]} ${className ?? ""}`} />;
}
