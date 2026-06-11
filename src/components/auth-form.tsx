"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

type FormState = {
  login: string;
  email: string;
  imie: string;
  nazwisko: string;
  password: string;
};

const initialState: FormState = {
  login: "",
  email: "",
  imie: "",
  nazwisko: "",
  password: "",
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister
      ? form
      : {
          email: form.email,
          password: form.password,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok || !data.ok) {
      setError(data.message ?? "Wystapil blad");
      return;
    }

    // Ja po poprawnym logowaniu od razu przenosze sie do panelu.
    router.push("/dashboard");
    router.refresh();
  }

  async function loginAsGuest() {
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/guest", { method: "POST" });
    const data = await response.json();
    setLoading(false);

    if (!response.ok || !data.ok) {
      setError(data.message ?? "Nie udalo sie zalogowac jako gosc");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <form onSubmit={onSubmit} className="space-y-3">
        <h1 className="text-2xl font-bold">
          {isRegister ? "Rejestracja" : "Logowanie"}
        </h1>

        {isRegister && (
          <>
            <input
              className="w-full rounded-lg border border-gray-300 p-2"
              placeholder="Login"
              value={form.login}
              onChange={(event) => setForm((prev) => ({ ...prev, login: event.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-gray-300 p-2"
              placeholder="Imie"
              value={form.imie}
              onChange={(event) => setForm((prev) => ({ ...prev, imie: event.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-gray-300 p-2"
              placeholder="Nazwisko"
              value={form.nazwisko}
              onChange={(event) => setForm((prev) => ({ ...prev, nazwisko: event.target.value }))}
            />
          </>
        )}

        <input
          type="email"
          className="w-full rounded-lg border border-gray-300 p-2"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          type="password"
          className="w-full rounded-lg border border-gray-300 p-2"
          placeholder="Haslo"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Przetwarzam..." : isRegister ? "Utworz konto" : "Zaloguj"}
        </button>
      </form>

      {!isRegister ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void loginAsGuest()}
          className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Wejdz jako gosc
        </button>
      ) : null}
    </div>
  );
}
