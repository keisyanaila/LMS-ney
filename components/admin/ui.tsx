import type { ReactNode } from "react";
import type { Document } from "mongodb";
import type { AdminNavItem } from "@/lib/admin-nav";

export function PageHeader({
  item,
  actions,
}: {
  item: AdminNavItem;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{item.label}</h1>
        <p className="mt-1 text-sm text-black/50">{item.description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-black/10 bg-white p-6 ${className}`}
    >
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

const buttonStyles = {
  primary: "bg-blue-600 text-white hover:bg-blue-500",
  secondary: "border border-black/10 bg-white hover:bg-black/5",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

export function Button({
  children,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`rounded-md px-4 py-2.5 text-sm font-bold transition ${buttonStyles[variant]}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-black/10 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "red" | "gray";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-black/5 text-black/60",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <b>Gagal memuat data dari database.</b> {message}
    </div>
  );
}

export type Column = { key: string; label: string };

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (value instanceof Date) return value.toLocaleString("id-ID");
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "object") return String(value);
  return String(value);
}

export function DataTable({
  columns,
  rows,
  emptyText = "Belum ada data.",
  rowActions,
}: {
  columns: Column[];
  rows: Document[];
  emptyText?: string;
  rowActions?: (row: Document) => ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-black/10 p-10 text-center text-sm text-black/50">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-120 text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-3 font-bold">
                {col.label}
              </th>
            ))}
            {rowActions && <th className="px-3 py-3" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={String(row._id)}
              className="border-b border-black/5 hover:bg-blue-50/40"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-3">
                  {formatValue(row[col.key])}
                </td>
              ))}
              {rowActions && (
                <td className="px-3 py-3 text-right">{rowActions(row)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
