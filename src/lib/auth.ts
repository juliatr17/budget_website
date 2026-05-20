import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const TOKEN_COOKIE_NAME = "budget_token";
const TOKEN_EXPIRES_IN = "7d";

type TokenPayload = {
  userId: number;
  email: string;
  role: "GOSC" | "UZYTKOWNIK" | "ADMIN";
};

export async function hashPassword(password: string) {
  // Ja hashuje haslo, zeby nie trzymac go jawnie w bazie.
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  // Ja porownuje haslo wpisane przez uzytkownika z hashem.
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Brakuje JWT_SECRET");
  }

  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

export async function saveSessionToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionToken() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.uzytkownik.findUnique({
    where: { id_uzytkownik: payload.userId },
    include: {
      role_uzytkownika: {
        where: { data_odebrania: null },
        include: { rola: true },
      },
    },
  });

  if (!user || !user.aktywny) {
    return null;
  }

  const roleName = user.role_uzytkownika[0]?.rola.nazwa ?? "GOSC";

  return {
    id: user.id_uzytkownik,
    email: user.email,
    login: user.login,
    role: roleName,
  };
}
