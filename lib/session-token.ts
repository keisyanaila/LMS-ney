import { SignJWT, jwtVerify } from "jose";

// Dipakai di server dan di proxy.ts (tanpa next/headers).

export const SESSION_COOKIE = "lms_session";
export const SESSION_DAYS = 7;

export type SessionPayload = {
  userId: number;
  role: string;
};

function getKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET belum diatur di .env.local (minimal 32 karakter)."
    );
  }

  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getKey());
}

export async function verifySession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.userId !== "number" || typeof payload.role !== "string") {
      return null;
    }

    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
