
import type { ReactNode } from "react";
import type { AdminNavItem } from "@/lib/admin-nav";

export type AdminTableRow = {
  id: number | string;
  [key: string]: unknown;
};

export function PageHeader({
  item,
  actions,
}: {
  item: AdminNavItem;
  actions?: ReactNode;
}) {
  return (
    <section className="admin-hero relative mb-7 flex min-h-[190px] items-center justify-between overflow-hidden rounded-[26px] px-6 py-7 sm:px-9">
      <div className="relative z-10 max-w-2xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-violet-600">RoboLearn Admin <span className="mx-1 text-violet-300">/</span> Panel</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">{item.label}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-900/75 sm:text-base">{item.description}</p>
        {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
      </div>
      <img src="/robolearn-mascot.png" alt="Maskot robot RoboLearn" className="pointer-events-none absolute -right-2 -bottom-16 hidden h-[250px] w-[250px] object-contain drop-shadow-xl sm:block lg:right-8 lg:h-[270px] lg:w-[270px]" />
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border-[34px] border-white/25" />
    </section>
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
      className={`admin-panel rounded-2xl p-6 ${className}`}
    >
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

const buttonStyles = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border border-black/10 bg-white hover:bg-blue-50",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${buttonStyles[variant]}`}
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
        className="w-full rounded-lg border border-black/15 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
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

export type Column = {
  key: string;
  label: string;
  /** Tampilan sel kustom (mis. link). Jika kosong, nilai ditampilkan apa adanya. */
  render?: (row: AdminTableRow) => ReactNode;
};

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
  rows: AdminTableRow[];
  emptyText?: string;
  rowActions?: (row: AdminTableRow) => ReactNode;
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
          <tr className="border-b border-black/10 text-xs text-black/55">
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-3 font-semibold">
                {col.label}
              </th>
            ))}
            {rowActions && <th className="px-3 py-3" />}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={String(row.id)}
              className="border-b border-black/5 hover:bg-blue-50/40"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-3">
                  {col.render ? col.render(row) : formatValue(row[col.key])}
                </td>
              ))}

              {rowActions && (
                <td className="px-3 py-3 text-right">
                  {rowActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
