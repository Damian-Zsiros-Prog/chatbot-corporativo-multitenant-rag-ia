import { APP_NAME } from "@/lib/constants";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  variant?: "default" | "light";
};

const sizes = {
  sm: { mark: "h-8 w-8 text-sm", text: "text-base" },
  md: { mark: "h-10 w-10 text-base", text: "text-lg" },
  lg: { mark: "h-14 w-14 text-xl", text: "text-2xl" },
};

export function LogoMark({ size = "md" }: Pick<LogoProps, "size">) {
  const s = sizes[size];
  return (
    <div
      className={`${s.mark} rounded-2xl bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-citation-text)] text-white font-bold flex items-center justify-center shadow-[0_8px_24px_rgba(64,89,170,0.35)]`}
      aria-hidden
    >
      R
    </div>
  );
}

export function Logo({
  size = "md",
  showText = true,
  className = "",
  variant = "default",
}: LogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      {showText ? (
        <span
          className={`${s.text} font-bold tracking-tight ${
            variant === "light"
              ? "text-[var(--color-inverse-on-surface)]"
              : "text-[var(--color-on-surface)]"
          }`}
        >
          {APP_NAME}
        </span>
      ) : null}
    </div>
  );
}
