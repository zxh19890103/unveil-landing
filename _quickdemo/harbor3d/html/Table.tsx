// SimpleList.tsx
import React from "react";

type Column<T> = {
  key: string;
  title?: React.ReactNode;
  width?: string; // e.g. '12rem' or '120px' or '15%'
  render?: (item: T, idx: number) => React.ReactNode;
  className?: string;
};

interface SimpleListProps<T> {
  data: T[];
  columns: Column<T>[];
  /** render actions cell; if omitted, actions column won't show */
  actions?: (item: T, idx: number) => React.ReactNode;
  /** key of row data to use as react key; fallback is idx */
  rowKey?: keyof T;
  compact?: boolean;
  className?: string;
  showHeader?: boolean;
  selected: T;
}

export default function SimpleList<T extends Record<string, any>>({
  data,
  columns,
  actions,
  rowKey,
  compact = true,
  className = "",
  selected = null,
  showHeader = true,
}: SimpleListProps<T>) {
  return (
    <div
      className={`w-full border rounded-md overflow-hidden ${className}`}
      role="table"
    >
      {/* header */}
      {showHeader && (
        <div
          className={`flex items-center px-3 ${
            compact ? "py-2" : "py-3"
          } border-b`}
          role="row"
        >
          {columns.map((col) => (
            <div
              key={col.key}
              role="columnheader"
              style={{ width: col.width ?? "auto" }}
              className={`text-xs font-medium text-gray-500 truncate ${
                col.className ?? ""
              }`}
            >
              {col.title ?? col.key}
            </div>
          ))}
          {actions && (
            <div
              role="columnheader"
              className="text-xs font-medium text-gray-500 text-right"
              style={{ width: "8rem", minWidth: 80 }}
            >
              操作
            </div>
          )}
        </div>
      )}

      {/* rows */}
      <div className="divide-y">
        {data.map((row, idx) => {
          const key = (rowKey && (row[rowKey] as any)) ?? idx;
          return (
            <div
              key={String(key)}
              className={`flex items-center px-3 ${
                compact ? "py-1" : "py-2"
              } text-xs text-gray-800 hover:bg-blue-100 ${
                selected === row ? " bg-blue-200" : ""
              }`}
              role="row"
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  role="cell"
                  style={{ width: col.width ?? "auto" }}
                  className={`truncate ${col.className ?? ""}`}
                >
                  {col.render ? col.render(row, idx) : row[col.key] ?? ""}
                </div>
              ))}

              {actions && (
                <div
                  role="cell"
                  className="ml-auto flex-1 flex items-center gap-2 justify-end"
                  style={{ minWidth: 80 }}
                >
                  {actions(row, idx)}
                </div>
              )}
            </div>
          );
        })}
        {data.length === 0 && (
          <div
            className={`px-3 ${
              compact ? "py-2" : "py-3"
            } text-xs text-gray-500`}
          >
            無資料
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Compact Action Button component (Tailwind + React)
// - Simple, clean, tight spacing
// - Small font size
// - Variants for primary / danger / default
// ────────────────────────────────────────────────────────────

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
  children: React.ReactNode;
}

function ActionButton({
  variant = "default",
  children,
  className = "",
  ...props
}: ActionButtonProps) {
  const base =
    "px-2 py-1 text-xs rounded-md border transition-colors focus:outline-none focus:ring-1";

  const variants: Record<typeof variant, string> = {
    default:
      "border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
    primary:
      "border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    danger: "border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Actions({ children }) {
  return <div className="flex gap-0.5 flex-nowrap justify-end">{children}</div>;
}

Actions.Button = ActionButton;

export type SimpleListColDef<T> = Column<T>;
