import type { ReactNode } from "react";

/** One header pattern for every section, so the page reads as a single system. */
export function SectionHeader({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`max-w-2xl ${className}`}>
      <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60">
        <span className="size-1.5 rounded-full bg-[var(--palette-swatch)]" />
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-4xl font-bold leading-[1.04] tracking-[-0.04em] md:text-[3.25rem]">
        {title}
      </h2>
      {children && (
        <p className="mt-5 text-lg leading-relaxed text-foreground/65">
          {children}
        </p>
      )}
    </header>
  );
}
