import Link from "next/link";
import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/Icon";

export function StatCard({
  href,
  icon,
  label,
  value,
  hint,
}: {
  href: string;
  icon: IconName;
  label: string;
  value: ReactNode;
  hint: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_6px_20px_rgba(74,65,160,0.05)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_12px_28px_-12px_rgba(101,80,232,0.25)]"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon name={icon} />
        </span>
        <Icon
          name="arrow"
          className="h-4 w-4 text-black/25 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
        />
      </div>
      <p className="mt-4 text-sm text-black/55">{label}</p>
      <p className="mt-0.5 line-clamp-1 text-xl font-bold">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs text-black/50">{hint}</p>
    </Link>
  );
}

export function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  const value = Math.max(0, Math.min(100, percent));

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-blue-100"
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  percent,
  size = 120,
}: {
  percent: number;
  size?: number;
}) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Progress belajar ${percent} persen`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-3xl font-bold leading-none">{percent}%</span>
        <span className="mt-1 text-[11px] text-blue-100">selesai</span>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center text-sm text-black/55">
      {children}
    </div>
  );
}

export function PageTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-1.5 text-sm text-black/55">{description}</p>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_6px_20px_rgba(74,65,160,0.05)] ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
