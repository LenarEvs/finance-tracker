import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "primary", children, ...rest }: Props) {
  return <button data-variant={variant} {...rest}>{children}</button>;
}
