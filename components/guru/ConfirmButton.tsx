"use client";

export default function ConfirmButton({
  action,
  confirmText,
  children,
  tone = "default",
}: {
  action: () => Promise<void>;
  confirmText: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(confirmText)) event.preventDefault();
      }}
    >
      <button
        type="submit"
        className={`text-xs font-semibold hover:underline ${
          tone === "danger" ? "text-red-600" : "text-blue-700"
        }`}
      >
        {children}
      </button>
    </form>
  );
}
