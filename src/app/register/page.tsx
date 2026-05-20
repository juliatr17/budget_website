import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <AuthForm mode="register" />
        <p className="text-center text-sm text-gray-600">
          Masz juz konto?{" "}
          <Link href="/login" className="font-semibold text-blue-600">
            Zaloguj sie
          </Link>
        </p>
      </div>
    </main>
  );
}
