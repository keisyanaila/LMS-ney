"use client";

export default function DeleteButton({
  action,
  label,
  warning,
  variant = "link",
}: {
  action: () => Promise<void>;
  label: string;
  /** Peringatan tambahan di kotak konfirmasi. */
  warning?: string;
  variant?: "link" | "button";
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const question = `Hapus ${label}?${warning ? `\n\n${warning}` : ""}`;

        if (!confirm(question)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={
          variant === "button"
            ? "rounded-md border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
            : "text-xs font-semibold text-red-600 hover:underline"
        }
      >
        Hapus
      </button>
    </form>
  );
}
