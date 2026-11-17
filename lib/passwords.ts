import { randomInt } from "node:crypto";

// Tanpa huruf/angka yang mudah tertukar (0, O, 1, l, I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generatePassword(length = 10): string {
  let password: string;

  do {
    password = "";
    for (let i = 0; i < length; i++) {
      password += ALPHABET[randomInt(ALPHABET.length)];
    }
  } while (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  );

  return password;
}
