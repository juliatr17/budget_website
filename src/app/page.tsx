import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">System zarzadzania budzetem</h1>
      <p className="max-w-2xl text-gray-700">
        To jest aplikacja do prowadzenia domowych finansow. Moge tutaj dodawac
        przychody i wydatki, filtrowac transakcje i analizowac swoje dane.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
        >
          Logowanie
        </Link>
        <Link
          href="/register"
          className="rounded border border-blue-600 px-4 py-2 font-semibold text-blue-600"
        >
          Rejestracja
        </Link>
      </div>
      <Link href="/dashboard" className="text-sm text-gray-600 underline">
        Przejdz do panelu (test)
      </Link>
    </main>
  );
}
