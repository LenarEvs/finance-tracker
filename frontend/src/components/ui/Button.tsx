import type { ButtonHTMLAttributes, CSSProperties } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
}

const variantStyles: Record<string, CSSProperties> = {
  primary: { background: "#4f46e5", color: "#fff", border: "none" },
  secondary: { background: "#fff", color: "#374151", border: "1px solid #e5e7eb" },
  danger: { background: "#dc2626", color: "#fff", border: "none" },
};

const sizeStyles: Record<string, CSSProperties> = {
  md: { padding: "8px 16px", fontSize: 14 },
  sm: { padding: "4px 10px", fontSize: 12 },
};

export function Button({ variant = "primary", size = "md", children, style, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
