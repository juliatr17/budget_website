import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

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

  // Ja pobieram dane startowe na serwerze, zeby klient od razu dostal gotowy widok.
  const [initialCategories, initialTransactionsRaw, initialFilteredCount] = await Promise.all([
    prisma.kategoria.findMany({
      where: { aktywna: true },
      orderBy: [{ kolejnosc: "asc" }, { nazwa: "asc" }],
      select: { id_kategoria: true, nazwa: true },
    }),
    prisma.transakcja.findMany({
      where: { id_uzytkownik: user.id, aktywny: true },
      include: {
        kategoria: {
          select: { id_kategoria: true, nazwa: true },
        },
      },
      orderBy: [{ data_transakcji: "desc" }, { id_transakcja: "desc" }],
      // laduje pierwsza strone: 3 rekordy.
      take: 3,
    }),
    prisma.transakcja.count({
      where: { id_uzytkownik: user.id, aktywny: true },
    }),
  ]);

  const initialTransactions = initialTransactionsRaw.map((item) => ({
    ...item,
    kwota: item.kwota.toString(),
    data_transakcji: item.data_transakcji.toISOString(),
  }));

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
