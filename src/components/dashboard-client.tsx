"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  email: string;
  login: string;
  role: "GOSC" | "UZYTKOWNIK" | "ADMIN";
};

type Category = {
  id_kategoria: number;
  nazwa: string;
};

type Transaction = {
  id_transakcja: number;
  id_kategoria: number;
  typ: "PRZYCHOD" | "WYDATEK";
  kwota: string;
  opis: string | null;
  data_transakcji: string;
  kategoria: Category;
};

type Props = {
  user: User;
  initialCategories: Category[];
  initialTransactions: Transaction[];
};

type FormTyp = "PRZYCHOD" | "WYDATEK";

const initialForm = {
  id_kategoria: "",
  typ: "WYDATEK" as FormTyp,
  kwota: "",
  opis: "",
  data_transakcji: new Date().toISOString().slice(0, 10),
};

export function DashboardClient({
  user,
  initialCategories,
  initialTransactions,
}: Props) {
  const router = useRouter();
  const [categories] = useState<Category[]>(initialCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  async function loadTransactions() {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }

    const response = await fetch(`/api/transactions?${params.toString()}`);
    const data = await response.json();

    if (data.ok) {
      setTransactions(data.data.transactions);
    } else {
      setStatus(data.message ?? "Nie udalo sie pobrac transakcji");
    }
  }

  const saldo = useMemo(() => {
    return transactions.reduce((acc, item) => {
      const kwota = Number(item.kwota);
      if (item.typ === "PRZYCHOD") {
        return acc + kwota;
      }
      return acc - kwota;
    }, 0);
  }, [transactions]);

  async function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id_kategoria: Number(form.id_kategoria || categories[0]?.id_kategoria),
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.message ?? "Nie udalo sie dodac transakcji");
      return;
    }

    // Ja po zapisie czyszcze tylko czesc pol, zeby szybciej dodawac kolejne wpisy.
    setForm((prev) => ({ ...prev, kwota: "", opis: "" }));
    setStatus("Dodalem transakcje");
    await loadTransactions();
  }

  async function removeTransaction(id: number) {
    const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.message ?? "Nie udalo sie usunac transakcji");
      return;
    }
    await loadTransactions();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded bg-white p-4 shadow">
        <div>
          <p className="text-sm text-gray-500">Zalogowany: {user.login}</p>
          <h1 className="text-2xl font-bold">Panel budzetu osobistego</h1>
          <p className="text-sm text-gray-600">Rola: {user.role}</p>
        </div>
        <button onClick={logout} className="rounded border px-3 py-2 text-sm">
          Wyloguj
        </button>
      </header>

      <section className="rounded bg-white p-4 shadow">
        <p className="text-sm text-gray-500">Aktualne saldo</p>
        <p className={`text-3xl font-bold ${saldo >= 0 ? "text-green-700" : "text-red-700"}`}>
          {saldo.toFixed(2)} PLN
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <form onSubmit={addTransaction} className="space-y-3 rounded bg-white p-4 shadow">
          <h2 className="text-xl font-semibold">Dodaj transakcje</h2>

          <select
            className="w-full rounded border p-2"
            value={form.id_kategoria || String(categories[0]?.id_kategoria ?? "")}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, id_kategoria: event.target.value }))
            }
            required
          >
            {categories.map((category) => (
              <option key={category.id_kategoria} value={category.id_kategoria}>
                {category.nazwa}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded border p-2"
            value={form.typ}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, typ: event.target.value as FormTyp }))
            }
          >
            <option value="WYDATEK">Wydatek</option>
            <option value="PRZYCHOD">Przychod</option>
          </select>

          <input
            type="number"
            step="0.01"
            className="w-full rounded border p-2"
            placeholder="Kwota"
            value={form.kwota}
            onChange={(event) => setForm((prev) => ({ ...prev, kwota: event.target.value }))}
            required
          />

          <input
            type="date"
            className="w-full rounded border p-2"
            value={form.data_transakcji}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, data_transakcji: event.target.value }))
            }
            required
          />

          <input
            className="w-full rounded border p-2"
            placeholder="Opis (opcjonalnie)"
            value={form.opis}
            onChange={(event) => setForm((prev) => ({ ...prev, opis: event.target.value }))}
          />

          <button className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white">
            Zapisz transakcje
          </button>
        </form>

        <div className="space-y-3 rounded bg-white p-4 shadow">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Lista transakcji</h2>
            <button onClick={() => void loadTransactions()} className="rounded border px-3 py-1 text-sm">
              Odswiez
            </button>
          </div>

          <input
            className="w-full rounded border p-2"
            placeholder="Szukaj po opisie"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => void loadTransactions()}
          />

          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {transactions.map((item) => (
              <article key={item.id_transakcja} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.kategoria.nazwa}</p>
                  <p
                    className={
                      item.typ === "PRZYCHOD"
                        ? "font-semibold text-green-700"
                        : "font-semibold text-red-700"
                    }
                  >
                    {item.typ === "PRZYCHOD" ? "+" : "-"}
                    {Number(item.kwota).toFixed(2)} PLN
                  </p>
                </div>
                <p className="text-sm text-gray-600">{item.opis || "Brak opisu"}</p>
                <p className="text-xs text-gray-500">
                  Data: {new Date(item.data_transakcji).toLocaleDateString("pl-PL")}
                </p>
                <button
                  onClick={() => void removeTransaction(item.id_transakcja)}
                  className="mt-2 text-sm text-red-600 underline"
                >
                  Usun
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {status ? <p className="text-sm text-blue-700">{status}</p> : null}
    </main>
  );
}
