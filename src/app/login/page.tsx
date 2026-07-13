"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email yoki parol noto'g'ri");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/40">
            <Container className="h-7 w-7" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              GS <span className="text-indigo-300">RERP</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">Yuk kuzatuvi va logistika tizimi</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="siz@kompaniya.uz"
              />
            </Field>
            <Field label="Parol">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full py-2.5" disabled={loading}>
              {loading ? "Kirilmoqda..." : "Kirish"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          GSR Logistics · Yiwu / Guangzhou → Qashqar → Toshkent
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
