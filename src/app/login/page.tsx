import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4">
      <div className="w-full max-w-md space-y-4">
        <AuthForm mode="login" />
        <p className="text-center text-sm text-gray-600">
          Nie masz konta?{" "}
          <Link href="/register" className="font-semibold text-blue-600">
            Zarejestruj sie
          </Link>
        </p>
      </div>
    </main>
  );
}
