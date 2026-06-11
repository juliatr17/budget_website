import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Nazwa ciasteczka, w ktorym bedzie przechowywany token sesji (JWT)
const TOKEN_COOKIE_NAME = "budget_token";
const TOKEN_EXPIRES_IN = "7d";

export type AppRole = "GOSC" | "UZYTKOWNIK" | "ADMIN";

type TokenPayload = {
  userId?: number;
  email: string;
  role: AppRole;
};

export type CurrentUser = {
  id: number | null;
  email: string;
  login: string;
  imie: string | null;
  nazwisko: string | null;
  role: AppRole;
  data_rejestracji: string | null;
};

// Funkcja hashujaca haslo. Uzywana podczas rejestracji.
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// Funkcja weryfikujaca wpisane haslo z hashem zapisanym w bazie danych.
// Uzywana podczas logowania.
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Tworzenie (podpisywanie) tokenu JWT na podstawie danych uzytkownika i tajnego klucza (JWT_SECRET)
export function signToken(payload: TokenPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Brakuje JWT_SECRET");
  }

  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRES_IN });
}

// Weryfikacja poprawnosci tokenu JWT (czy nie zostal sfałszowany i czy nie wygasl)
export function verifyToken(token: string): TokenPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null; // Jesli token jest niepoprawny lub wygasl, zwracamy null
  }
}

function normalizeRole(value: string | null | undefined): AppRole {
  if (value === "ADMIN" || value === "UZYTKOWNIK" || value === "GOSC") {
    return value;
  }
  return "GOSC";
}

// Zapisuje token JWT w ciasteczku przegladarki.
// Uzywamy flag:
// - httpOnly: chroni ciasteczko przed odczytem przez skrypty JS w przegladarce (ochrona przed XSS)
// - sameSite: "lax": chroni przed atakami CSRF
// - secure: wysyla ciasteczko tylko po szyfrowanym HTTPS na produkcji
export async function saveSessionToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // Ciasteczko wygasnie po 7 dniach
  });
}

// Usuwa ciasteczko sesji (wylogowanie).
// Ustawiamy maxAge na 0, by przyglądarka skasowala to ciasteczko
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

// Pobiera i weryfikuje aktualnego uzytkownika na podstawie ciasteczka sesyjnego.
// Uzywane w Server Components i API do sprawdzania, kto jest zalogowany.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  // Jesli nie ma ciasteczka z tokenem, użytkownik nie jest zalogowany
  if (!token) {
    return null;
  }

  // Weryfikujemy i dekodujemy token JWT
  const payload = verifyToken(token);
  if (!payload) {
    return null; // Token uszkodzony lub sfalszowany
  }

  // Obsluga trybu goscia bez konta w bazie
  if (payload.role === "GOSC" || !payload.userId) {
    return {
      id: null,
      email: payload.email || "gosc@lokalnie",
      login: "Gosc",
      imie: null,
      nazwisko: null,
      role: "GOSC",
      data_rejestracji: null,
    };
  }

  // Pobieramy dane uzytkownika z bazy, dolaczajac jego aktualna role (relacja wiele-do-wielu)
  const user = await prisma.uzytkownik.findUnique({
    where: { id_uzytkownik: payload.userId },
    include: {
      role_uzytkownika: {
        where: { data_odebrania: null }, // Pobieramy tylko role, ktore nie zostaly odebrane (data_odebrania jest null)
        include: { rola: true },
      },
    },
  });

  // Jesli uzytkownik nie istnieje lub konto jest zablokowane (aktywny = false)
  if (!user || !user.aktywny) {
    return null;
  }

  const roleName = normalizeRole(user.role_uzytkownika[0]?.rola.nazwa);

  // Zwracamy obiekt reprezentujacy zalogowanego uzytkownika
  return {
    id: user.id_uzytkownik,
    email: user.email,
    login: user.login,
    imie: user.imie,
    nazwisko: user.nazwisko,
    role: roleName,
    data_rejestracji: user.data_rejestracji.toISOString(),
  };
}

