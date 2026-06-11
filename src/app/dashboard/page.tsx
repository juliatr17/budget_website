// Ten plik to "Server Component" (komponent serwerowy).
// Wykonuje sie w calosci na serwerze i ma bezposredni dostep do bazy danych przez Prismę.
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  // 1. Sprawdzamy sesje ciasteczka – pobieramy obecnie zalogowanego uzytkownika.
  const user = await getCurrentUser();

  // Jesli uzytkownik nie jest zalogowany, przekierowujemy go do strony logowania.
  if (!user) {
    redirect("/login");
  }

  // 2. Obsluga trybu goscia (bez rejestracji).
  if (user.role === "GOSC" || !user.id) {
    const guestCategories = await prisma.kategoria.findMany({
      where: { aktywna: true },
      orderBy: [{ kolejnosc: "asc" }, { nazwa: "asc" }],
      select: { id_kategoria: true, nazwa: true },
    });

    return (
      <DashboardClient
        user={user}
        initialCategories={guestCategories}
        initialTransactions={[]}
        initialSummary={{ przychody: 0, wydatki: 0, saldo: 0 }}
        initialFilteredCount={0}
      />
    );
  }

  // 3. Pobieranie danych startowych z bazy dla zalogowanego uzytkownika (Server Side Rendering).
  // Pobieramy dane równolegle (Promise.all), zeby baza wykonala te zapytania jednoczesnie (szybciej).
  const [initialCategories, initialTransactionsRaw, initialFilteredCount] = await Promise.all([
    // Pobieramy aktywne kategorie budzetowe (np. jedzenie, transport) posortowane po kolejnosci
    prisma.kategoria.findMany({
      where: { aktywna: true },
      orderBy: [{ kolejnosc: "asc" }, { nazwa: "asc" }],
      select: { id_kategoria: true, nazwa: true },
    }),
    // Pobieramy 3 najnowsze transakcje zalogowanego uzytkownika
    prisma.transakcja.findMany({
      where: { id_uzytkownik: user.id, aktywny: true },
      include: {
        kategoria: {
          select: { id_kategoria: true, nazwa: true },
        },
      },
      orderBy: [{ data_transakcji: "desc" }, { id_transakcja: "desc" }],
      take: 3, // Domyślnie ładujemy tylko pierwsze 3 rekordy (paginacja)
    }),
    // Liczymy, ile lacznie transakcji ma ten uzytkownik (potrzebne do stronicowania)
    prisma.transakcja.count({
      where: { id_uzytkownik: user.id, aktywny: true },
    }),
  ]);

  // 4. Mapujemy dane z bazy (kwote jako tekst i date jako string), aby dalo sie je przekazac jako "props" do komponentu klienckiego.
  const initialTransactions = initialTransactionsRaw.map((item) => ({
    ...item,
    kwota: item.kwota.toString(),
    data_transakcji: item.data_transakcji.toISOString(),
  }));

  // 5. Obliczamy wstepne saldo ogolne (przychody - wydatki) na serwerze na podstawie pobranych transakcji.
  const initialSummary = initialTransactionsRaw.reduce(
    (acc, item) => {
      const amount = Number(item.kwota);
      if (item.typ === "PRZYCHOD") {
        acc.przychody += amount;
      } else {
        acc.wydatki += amount;
      }
      acc.saldo = acc.przychody - acc.wydatki;
      return acc;
    },
    { przychody: 0, wydatki: 0, saldo: 0 },
  );

  // 6. Przekazujemy przygotowane na serwerze dane do komponentu klienckiego <DashboardClient />.
  // Interfejs wyswietli sie blyskawicznie, bo ma juz gotowe dane na start.
  return (
    <DashboardClient
      user={user}
      initialCategories={initialCategories}
      initialTransactions={initialTransactions}
      initialSummary={initialSummary}
      initialFilteredCount={initialFilteredCount}
    />
  );
}
