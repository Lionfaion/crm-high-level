import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ variant = "primary", children, className, ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} ${className ?? ""}`} {...props}>
      {children}
    </button>
  );
}
