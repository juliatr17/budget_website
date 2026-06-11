"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number | null;
  email: string;
  login: string;
  imie: string | null;
  nazwisko: string | null;
  role: "GOSC" | "UZYTKOWNIK" | "ADMIN";
  data_rejestracji: string | null;
};

type Category = {
  id_kategoria: number;
  nazwa: string;
  opis?: string | null;
  aktywna?: boolean;
  kolejnosc?: number;
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
  initialSummary: { przychody: number; wydatki: number; saldo: number };
  initialFilteredCount: number;
};

type FormTyp = "PRZYCHOD" | "WYDATEK";
type TabName = "transakcje" | "konto" | "admin";
type UserRole = "GOSC" | "UZYTKOWNIK" | "ADMIN";

const initialForm = {
  id_kategoria: "",
  typ: "WYDATEK" as FormTyp,
  kwota: "",
  opis: "",
  data_transakcji: new Date().toISOString().slice(0, 10),
};

const initialFilters = {
  q: "",
  from: "",
  to: "",
  minKwota: "",
  maxKwota: "",
  idKategoria: "",
  typ: "ALL" as "ALL" | FormTyp,
};

export function DashboardClient({
  user,
  initialCategories,
  initialTransactions,
  initialSummary,
  initialFilteredCount,
}: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<TabName>("transakcje");
  const [summaryOverall, setSummaryOverall] = useState(initialSummary);
  const [summaryFiltered, setSummaryFiltered] = useState(initialSummary);
  const [filteredCount, setFilteredCount] = useState(initialFilteredCount);
  const [displayLogin, setDisplayLogin] = useState(user.login);

  const [profile, setProfile] = useState({
    login: user.login,
    email: user.email,
    imie: user.imie ?? "",
    nazwisko: user.nazwisko ?? "",
    data_rejestracji: user.data_rejestracji,
  });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [users, setUsers] = useState<
    Array<{
      id_uzytkownik: number;
      login: string;
      email: string;
      aktywny: boolean;
      data_rejestracji: string;
      role_uzytkownika: Array<{ rola: { nazwa: string } }>;
    }>
  >([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    nazwa: "",
    opis: "",
    kolejnosc: "0",
  });

  const isGuest = user.role === "GOSC";
  const isAdmin = user.role === "ADMIN";

  async function loadTransactions(nextFilters = filters) {
    if (isGuest) {
      return;
    }

    const params = new URLSearchParams();
    if (nextFilters.q) params.set("q", nextFilters.q);
    if (nextFilters.from) params.set("from", nextFilters.from);
    if (nextFilters.to) params.set("to", nextFilters.to);
    if (nextFilters.minKwota) params.set("min_kwota", nextFilters.minKwota);
    if (nextFilters.maxKwota) params.set("max_kwota", nextFilters.maxKwota);
    if (nextFilters.idKategoria) params.set("id_kategoria", nextFilters.idKategoria);
    if (nextFilters.typ !== "ALL") params.set("typ", nextFilters.typ);

    const response = await fetch(`/api/transactions?${params.toString()}`);
    const data = await response.json();

    if (data.ok) {
      setTransactions(data.data.transactions);
      setSummaryOverall(data.data.podsumowanieCalkowite);
      setSummaryFiltered(data.data.podsumowanieFiltrowane);
      setFilteredCount(data.data.licznikFiltrowanych);
    } else {
      setStatus(data.message ?? "Nie udalo sie pobrac transakcji");
    }
  }

  async function loadMyProfile() {
    if (isGuest) {
      return;
    }

    const response = await fetch("/api/users/me");
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.message ?? "Nie udalo sie pobrac profilu");
      return;
    }

    setProfile({
      login: data.data.login,
      email: data.data.email,
      imie: data.data.imie,
      nazwisko: data.data.nazwisko,
      data_rejestracji: data.data.data_rejestracji,
    });
  }

  async function loadAdminData() {
    if (!isAdmin) {
      return;
    }

    const [usersResponse, categoriesResponse] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/categories?include_inactive=1"),
    ]);

    const usersData = await usersResponse.json();
    const categoriesData = await categoriesResponse.json();

    if (usersData.ok) {
      setUsers(usersData.data);
    }
    if (categoriesData.ok) {
      setAdminCategories(categoriesData.data);
    }
  }

  const aktywneKategorie = useMemo(
    () => categories.filter((category) => category.aktywna !== false),
    [categories],
  );

  async function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isGuest) {
      setStatus("Gosc nie moze dodawac transakcji. Zarejestruj konto.");
      return;
    }

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
    if (isGuest) {
      return;
    }
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

  async function onUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.message ?? "Nie udalo sie zapisac konta");
      return;
    }
    setDisplayLogin(data.data.login);
    setStatus("Zapisalem dane konta");
  }

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/users/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordForm),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.message ?? "Nie udalo sie zmienic hasla");
      return;
    }
    setPasswordForm({ oldPassword: "", newPassword: "" });
    setStatus("Haslo zostalo zmienione");
  }

  async function updateUserRole(userId: number, role: UserRole) {
    const response = await fetch(`/api/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rola: role }),
    });
    const data = await response.json();
    setStatus(data.ok ? "Rola zostala zaktualizowana" : data.message ?? "Blad zmiany roli");
    if (data.ok) {
      await loadAdminData();
    }
  }

  async function onSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      nazwa: categoryForm.nazwa,
      opis: categoryForm.opis,
      kolejnosc: Number(categoryForm.kolejnosc),
    };
    const isEdit = Boolean(categoryForm.id);
    const endpoint = isEdit ? `/api/categories/${categoryForm.id}` : "/api/categories";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setStatus(data.message ?? "Nie udalo sie zapisac kategorii");
      return;
    }

    setCategoryForm({ id: "", nazwa: "", opis: "", kolejnosc: "0" });
    setStatus("Kategorie zapisane");
    await loadAdminData();
    const publicCategories = await fetch("/api/categories");
    const publicData = await publicCategories.json();
    if (publicData.ok) {
      setCategories(publicData.data);
    }
  }

  async function deactivateCategory(id: number) {
    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await response.json();
    setStatus(data.ok ? "Kategoria dezaktywowana" : data.message ?? "Nie udalo sie usunac");
    if (data.ok) {
      await loadAdminData();
      const publicCategories = await fetch("/api/categories");
      const publicData = await publicCategories.json();
      if (publicData.ok) {
        setCategories(publicData.data);
      }
    }
  }

  function onTabChange(tab: TabName) {
    setActiveTab(tab);
    if (tab === "konto") {
      void loadMyProfile();
    }
    if (tab === "admin") {
      void loadAdminData();
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8">
        <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel budzetu osobistego</h1>
              <p className="text-sm text-gray-600">
                {displayLogin} ({user.role})
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Wyloguj
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">Aktualne saldo konta (bez filtrow)</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                summaryOverall.saldo >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {summaryOverall.saldo.toFixed(2)} PLN
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Przychody: {summaryOverall.przychody.toFixed(2)} PLN, wydatki:{" "}
              {summaryOverall.wydatki.toFixed(2)} PLN
            </p>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">Wynik aktualnego filtrowania</p>
            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {summaryFiltered.saldo.toFixed(2)} PLN
            </p>
            <p className="mt-2 text-xs text-gray-500">Liczba znalezionych transakcji: {filteredCount}</p>
          </article>
        </section>

        <section className="flex flex-wrap gap-2">
          <button
            onClick={() => onTabChange("transakcje")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTab === "transakcje" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"
            }`}
          >
            Transakcje
          </button>
          {!isGuest ? (
            <button
              onClick={() => onTabChange("konto")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === "konto" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"
              }`}
            >
              Konto
            </button>
          ) : null}
          {isAdmin ? (
            <button
              onClick={() => onTabChange("admin")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === "admin" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"
              }`}
            >
              Administrator
            </button>
          ) : null}
        </section>

        {activeTab === "transakcje" ? (
          isGuest ? (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-xl font-semibold">Tryb goscia</h2>
              <p className="mt-2 text-sm text-gray-600">
                Jako gosc moge tylko przegladac katalog kategorii. Zeby dodawac i analizowac
                transakcje, musze sie zarejestrowac albo zalogowac.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {aktywneKategorie.map((category) => (
                  <div
                    key={category.id_kategoria}
                    className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm"
                  >
                    {category.nazwa}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="grid gap-5 xl:grid-cols-[360px,1fr]">
              <form onSubmit={addTransaction} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <h2 className="text-lg font-semibold">Dodaj transakcje</h2>

                <select
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={form.id_kategoria || String(aktywneKategorie[0]?.id_kategoria ?? "")}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, id_kategoria: event.target.value }))
                  }
                  required
                >
                  {aktywneKategorie.map((category) => (
                    <option key={category.id_kategoria} value={category.id_kategoria}>
                      {category.nazwa}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full rounded-lg border border-gray-300 p-2"
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
                  className="w-full rounded-lg border border-gray-300 p-2"
                  placeholder="Kwota"
                  value={form.kwota}
                  onChange={(event) => setForm((prev) => ({ ...prev, kwota: event.target.value }))}
                  required
                />

                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={form.data_transakcji}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, data_transakcji: event.target.value }))
                  }
                  required
                />

                <input
                  className="w-full rounded-lg border border-gray-300 p-2"
                  placeholder="Opis (opcjonalnie)"
                  value={form.opis}
                  onChange={(event) => setForm((prev) => ({ ...prev, opis: event.target.value }))}
                />

                <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">
                  Zapisz transakcje
                </button>
              </form>

              <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Filtry i lista transakcji</h2>
                  <button
                    onClick={() => void loadTransactions()}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Odswiez
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  <input
                    className="rounded-lg border border-gray-300 p-2"
                    placeholder="Szukaj po opisie"
                    value={filters.q}
                    onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                  />
                  <input
                    type="date"
                    className="rounded-lg border border-gray-300 p-2"
                    value={filters.from}
                    onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                  />
                  <input
                    type="date"
                    className="rounded-lg border border-gray-300 p-2"
                    value={filters.to}
                    onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-lg border border-gray-300 p-2"
                    placeholder="Kwota od"
                    value={filters.minKwota}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, minKwota: event.target.value }))
                    }
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-lg border border-gray-300 p-2"
                    placeholder="Kwota do"
                    value={filters.maxKwota}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, maxKwota: event.target.value }))
                    }
                  />
                  <select
                    className="rounded-lg border border-gray-300 p-2"
                    value={filters.idKategoria}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, idKategoria: event.target.value }))
                    }
                  >
                    <option value="">Wszystkie kategorie</option>
                    {aktywneKategorie.map((category) => (
                      <option key={category.id_kategoria} value={category.id_kategoria}>
                        {category.nazwa}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-gray-300 p-2"
                    value={filters.typ}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, typ: event.target.value as "ALL" | FormTyp }))
                    }
                  >
                    <option value="ALL">Wszystkie typy</option>
                    <option value="WYDATEK">Wydatek</option>
                    <option value="PRZYCHOD">Przychod</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void loadTransactions()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                  >
                    Zastosuj filtry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const resetFilters = { ...initialFilters };
                      setFilters(resetFilters);
                      void loadTransactions(resetFilters);
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50"
                  >
                    Wyczyść filtry
                  </button>
                </div>

                <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                  {transactions.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                      Brak transakcji dla wybranego filtra.
                    </p>
                  ) : (
                    transactions.map((item) => (
                      <article key={item.id_transakcja} className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{item.kategoria.nazwa}</p>
                          <p
                            className={
                              item.typ === "PRZYCHOD"
                                ? "font-semibold text-emerald-700"
                                : "font-semibold text-rose-700"
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
                          className="mt-2 text-sm text-rose-700 underline"
                        >
                          Usun
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>
          )
        ) : null}

        {activeTab === "konto" && !isGuest ? (
          <section className="grid gap-5 lg:grid-cols-2">
            <form onSubmit={onUpdateProfile} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold">Dane konta</h2>
              <p className="text-xs text-gray-500">
                Data utworzenia konta:{" "}
                {profile.data_rejestracji
                  ? new Date(profile.data_rejestracji).toLocaleString("pl-PL")
                  : "brak"}
              </p>
              <input
                className="w-full rounded-lg border border-gray-300 p-2"
                placeholder="Login"
                value={profile.login}
                onChange={(event) => setProfile((prev) => ({ ...prev, login: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-gray-300 p-2"
                placeholder="Imie"
                value={profile.imie}
                onChange={(event) => setProfile((prev) => ({ ...prev, imie: event.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-gray-300 p-2"
                placeholder="Nazwisko"
                value={profile.nazwisko}
                onChange={(event) => setProfile((prev) => ({ ...prev, nazwisko: event.target.value }))}
              />
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 p-2"
                placeholder="Email"
                value={profile.email}
                onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
              />
              <button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">
                Zapisz dane
              </button>
            </form>

            <form onSubmit={onChangePassword} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold">Zmiana hasla</h2>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 p-2"
                placeholder="Stare haslo"
                value={passwordForm.oldPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))
                }
              />
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 p-2"
                placeholder="Nowe haslo"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                }
              />
              <button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">
                Zmien haslo
              </button>
            </form>
          </section>
        ) : null}

        {activeTab === "admin" && isAdmin ? (
          <section className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold">Zarzadzanie uzytkownikami</h2>
              <p className="text-xs text-gray-500">
                Jako admin moge nadawac role, przegladac konta i pilnowac poprawnosci danych.
              </p>
              <div className="space-y-2">
                {users.map((item) => {
                  const currentRole = (item.role_uzytkownika[0]?.rola.nazwa ?? "GOSC") as UserRole;
                  return (
                    <div key={item.id_uzytkownik} className="rounded-lg border border-gray-200 p-3">
                      <p className="font-semibold">{item.login}</p>
                      <p className="text-xs text-gray-500">{item.email}</p>
                      <p className="text-xs text-gray-500">
                        Rejestracja: {new Date(item.data_rejestracji).toLocaleDateString("pl-PL")}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <select
                          className="rounded border border-gray-300 p-1 text-sm"
                          defaultValue={currentRole}
                          onChange={(event) =>
                            void updateUserRole(item.id_uzytkownik, event.target.value as UserRole)
                          }
                        >
                          <option value="GOSC">GOSC</option>
                          <option value="UZYTKOWNIK">UZYTKOWNIK</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                          {item.aktywny ? "aktywne" : "nieaktywne"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold">Zarzadzanie kategoriami</h2>
              <form onSubmit={onSaveCategory} className="grid gap-2">
                <input
                  className="rounded border border-gray-300 p-2"
                  placeholder="Nazwa kategorii"
                  value={categoryForm.nazwa}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, nazwa: event.target.value }))
                  }
                  required
                />
                <input
                  className="rounded border border-gray-300 p-2"
                  placeholder="Opis"
                  value={categoryForm.opis}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, opis: event.target.value }))
                  }
                />
                <input
                  type="number"
                  className="rounded border border-gray-300 p-2"
                  placeholder="Kolejnosc"
                  value={categoryForm.kolejnosc}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, kolejnosc: event.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
                    {categoryForm.id ? "Zapisz edycje" : "Dodaj kategorie"}
                  </button>
                  {categoryForm.id ? (
                    <button
                      type="button"
                      onClick={() => setCategoryForm({ id: "", nazwa: "", opis: "", kolejnosc: "0" })}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      Anuluj edycje
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="space-y-2">
                {adminCategories.map((category) => (
                  <div key={category.id_kategoria} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        {category.nazwa}{" "}
                        {category.aktywna === false ? (
                          <span className="text-xs text-rose-700">(nieaktywna)</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-gray-500">kolejnosc: {category.kolejnosc ?? 0}</p>
                    </div>
                    <p className="text-sm text-gray-600">{category.opis || "Brak opisu"}</p>
                    <div className="mt-2 flex gap-3 text-sm">
                      <button
                        onClick={() =>
                          setCategoryForm({
                            id: String(category.id_kategoria),
                            nazwa: category.nazwa,
                            opis: category.opis ?? "",
                            kolejnosc: String(category.kolejnosc ?? 0),
                          })
                        }
                        className="text-indigo-700 underline"
                      >
                        Edytuj
                      </button>
                      {category.aktywna !== false ? (
                        <button
                          onClick={() => void deactivateCategory(category.id_kategoria)}
                          className="text-rose-700 underline"
                        >
                          Dezaktywuj
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {status ? <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">{status}</p> : null}
      </div>
      <div className="h-8" />
    </main>
  );
}
