import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "primary";
};

export default function Button({ variant = "default", className = "", children, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: Record<string, string> = {
    default: "bg-white border border-gray-200 text-gray-900 px-4 py-2",
    ghost: "bg-transparent text-gray-800 px-3 py-2 hover:bg-gray-100",
    primary: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 shadow-sm",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
