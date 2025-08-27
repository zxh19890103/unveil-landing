import React from "react";

// ────────────────────────────────────────────────────────────
// Simple, line-by-line descriptions (AntD-like) for Tailwind
// - No background
// - Tight spacing
// - Equal-width label column (configurable)
// - Labels align right; values fill the rest
// ────────────────────────────────────────────────────────────

type DescriptionItem = {
  label: React.ReactNode;
  value: React.ReactNode;
};

interface SimpleDescriptionsProps {
  items: DescriptionItem[];
  /** CSS length for the label column width, e.g. '10rem', '160px', '30%' */
  labelWidth?: string;
  /** Show a colon after labels */
  showColon?: boolean;
  /** Extra class names for the wrapper */
  className?: string;
  /** Compact density (tighter vertical spacing) */
  compact?: boolean;
}

export function Descriptions({
  items,
  labelWidth = "8rem",
  showColon = true,
  className = "",
  compact = true,
}: SimpleDescriptionsProps) {
  return (
    <dl
      className={`w-full ${className}`}
      style={
        {
          // Custom property used in the CSS grid template below
          // @ts-ignore - CSS custom properties are allowed
          "--label": labelWidth,
        } as React.CSSProperties
      }
    >
      <div className="divide-y divide-gray-200">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-[var(--label)_1fr] items-baseline gap-x-3 ${
              compact ? "py-1.5" : "py-3"
            }`}
          >
            <dt
              className={`text-xs text-gray-500 justify-self-end whitespace-nowrap ${
                showColon ? "after:content-[':']" : ""
              }`}
            >
              {item.label}
            </dt>
            <dd className="text-xs text-gray-900 break-words">{item.value}</dd>
          </div>
        ))}
      </div>
    </dl>
  );
}

export default Descriptions;
