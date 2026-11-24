import { redirect } from "next/navigation";

// Login hanya ada di halaman utama. Alamat lama ini dulu berupa form kosong
// yang tidak terhubung ke apa pun, jadi dialihkan.
export default function LoginRedirect() {
  redirect("/");
}
