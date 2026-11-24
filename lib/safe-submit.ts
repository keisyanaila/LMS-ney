import { startTransition, type FormEvent } from "react";

/**
 * React 19 mengosongkan semua kolom form setelah action selesai, termasuk saat
 * action hanya mengembalikan pesan error. Itu menghapus teks yang sudah susah
 * payah diketik. Dengan helper ini form dikirim lewat onSubmit sehingga isian
 * tetap ada saat terjadi error. (useActionState tetap bisa dipakai seperti biasa.)
 */
export function safeSubmit(dispatch: (payload: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    startTransition(() => {
      dispatch(data);
    });
  };
}
