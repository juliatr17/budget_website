import { TypTransakcji } from "@prisma/client";
import { z } from "zod";

function getEndOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

export const registerSchema = z.object({
  login: z.string().min(3, "Login musi miec minimum 3 znaki"),
  email: z.email("Podaj poprawny email"),
  imie: z.string().min(2, "Imie musi miec minimum 2 znaki"),
  nazwisko: z.string().min(2, "Nazwisko musi miec minimum 2 znaki"),
  password: z
    .string()
    .min(8, "Haslo musi miec minimum 8 znakow")
    .regex(/[A-Z]/, "Haslo musi miec duza litere")
    .regex(/[0-9]/, "Haslo musi miec cyfre"),
  confirmPassword: z.string().min(1, "Powtorz haslo"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasla musza byc takie same",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.email("Podaj poprawny email"),
  password: z.string().min(1, "Haslo jest wymagane"),
});

export const transactionSchema = z.object({
  id_kategoria: z.coerce.number().int().positive("Kategoria jest wymagana"),
  typ: z.enum([TypTransakcji.PRZYCHOD, TypTransakcji.WYDATEK]),
  kwota: z.coerce.number().positive("Kwota musi byc dodatnia"),
  opis: z.string().max(255, "Opis jest za dlugi").optional().or(z.literal("")),
  data_transakcji: z
    .coerce
    .date()
    .refine((date) => date <= getEndOfToday(), "Data transakcji nie moze byc z przyszlosci"),
});

export const categorySchema = z.object({
  nazwa: z.string().min(2, "Nazwa kategorii jest za krotka"),
  opis: z.string().max(255, "Opis jest za dlugi").optional().or(z.literal("")),
  ikona: z.string().max(50, "Ikona jest za dluga").optional().or(z.literal("")),
  kolejnosc: z.coerce.number().int().min(0).default(0),
  aktywna: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  login: z.string().min(3, "Login musi miec minimum 3 znaki"),
  email: z.email("Podaj poprawny email"),
  imie: z.string().min(2, "Imie musi miec minimum 2 znaki"),
  nazwisko: z.string().min(2, "Nazwisko musi miec minimum 2 znaki"),
});

export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, "Podaj stare haslo"),
  newPassword: z
    .string()
    .min(8, "Nowe haslo musi miec minimum 8 znakow")
    .regex(/[A-Z]/, "Nowe haslo musi miec duza litere")
    .regex(/[0-9]/, "Nowe haslo musi miec cyfre"),
});
