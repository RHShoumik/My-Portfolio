import { siteConfig } from "@/lib/constants";

/**
 * The original site logo: a hand-signed zigzag that draws itself, plus the
 * "ragib.dev" wordmark. The draw-on animation is CSS (see `.signature-*`
 * in globals.css) so it looks identical to the original but never gets stuck.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        className="text-primary"
        aria-hidden="true"
      >
        <path
          d="M4 20 L8 6 L14 18 L20 4 L24 20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="signature-path"
        />
        <circle
          cx="24"
          cy="20"
          r="2"
          fill="currentColor"
          className="signature-dot"
        />
      </svg>
      <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
        {siteConfig.name.split(" ")[0].toLowerCase()}
        <span className="text-primary">.dev</span>
      </span>
    </span>
  );
}
