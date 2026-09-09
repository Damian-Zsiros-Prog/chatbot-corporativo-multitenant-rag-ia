import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] hover:bg-[#2d4159]",
        variant === "secondary" &&
          "bg-[var(--color-secondary)] text-[var(--color-on-secondary)] hover:bg-[#3550a0]",
        variant === "ghost" &&
          "bg-transparent text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-base",
        className,
      )}
      {...props}
    />
  );
}
