import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Ja pobieram dane startowe na serwerze, zeby klient od razu dostal gotowy widok.
  const [initialCategories, initialTransactionsRaw] = await Promise.all([
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
    }),
  ]);

  const initialTransactions = initialTransactionsRaw.map((item) => ({
    ...item,
    kwota: item.kwota.toString(),
    data_transakcji: item.data_transakcji.toISOString(),
  }));

  return (
    <DashboardClient
      user={user}
      initialCategories={initialCategories}
      initialTransactions={initialTransactions}
    />
  );
}
