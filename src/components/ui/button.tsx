import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "subtle";
type ButtonSize = "default" | "compact";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-action-primary text-action-primary-foreground hover:bg-action-primary-hover",
  secondary: "border border-action-secondary-border bg-action-secondary text-action-secondary-foreground hover:bg-action-secondary-hover",
  subtle: "bg-transparent text-text hover:bg-surface-muted",
};

const sizes: Record<ButtonSize, string> = {
  default: "min-h-11 px-4 py-2.5",
  compact: "min-h-10 px-3 py-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "primary", size = "default", className = "", type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-70 ${variants[variant]} ${sizes[size]} ${className}`.trim()} {...props} />;
});
