import { TypTransakcji } from "@prisma/client";
import { z } from "zod";

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
  data_transakcji: z.coerce.date(),
});

export const categorySchema = z.object({
  nazwa: z.string().min(2, "Nazwa kategorii jest za krotka"),
  opis: z.string().max(255, "Opis jest za dlugi").optional().or(z.literal("")),
  ikona: z.string().max(50, "Ikona jest za dluga").optional().or(z.literal("")),
  kolejnosc: z.coerce.number().int().min(0).default(0),
});
