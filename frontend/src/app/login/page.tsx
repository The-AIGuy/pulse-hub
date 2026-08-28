"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBackendUrl } from "@/lib/backend";

type Mode = "login" | "register" | "verify";

type AuthResponse = {
  error?: string;
  message?: string;
  token?: string;
  user?: { id: string; username: string; email: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const endpoint = mode === "login" ? "/api/auth/login" : mode === "register" ? "/api/auth/register" : "/api/auth/verify";
    const body = mode === "login" ? { email, password } : mode === "register" ? { username, email, password } : { email, code };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? getBackendUrl();
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as AuthResponse;
      if (!response.ok) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      if (mode === "register") {
        setNotice("Check your email for a six-digit verification code.");
        setMode("verify");
      } else if (mode === "verify") {
        setNotice("Email verified. You can sign in now.");
        setMode("login");
      } else if (result.token && result.user) {
        window.localStorage.setItem("pulse-token", result.token);
        window.localStorage.setItem("pulse-user", JSON.stringify(result.user));
        router.push("/dashboard");
      }
    } catch {
      setError("The Pulse Hub API is unavailable. Start the backend and try again.");
    }
  };

  const title = mode === "login" ? "Welcome back" : mode === "register" ? "Make your space" : "Check your inbox";
  const submitLabel = mode === "login" ? "Enter Pulse Hub" : mode === "register" ? "Create account" : "Verify email";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e9ebe5] px-5 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-[24px] border border-[#dfe3db] bg-white/90 p-7 shadow-[0_18px_50px_rgba(34,44,35,0.1)] sm:p-9">
        <div className="mb-9 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-black tracking-tight"><span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-lime-300 text-slate-900">p</span> Pulse Hub</Link>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Private beta</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-700">Your everyday space</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{mode === "verify" ? "Enter the code we sent to finish setting up your account." : "One calm place for conversations, communities, and Moments."}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "register" && <label className="block text-xs font-bold text-slate-600">Username<input required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-lime-300 focus:ring-2" placeholder="yourname" /></label>}
          <label className="block text-xs font-bold text-slate-600">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-lime-300 focus:ring-2" placeholder="you@example.com" /></label>
          {mode === "verify" ? <label className="block text-xs font-bold text-slate-600">Verification code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-50 px-4 py-3 text-center text-lg font-bold tracking-[0.5em] text-slate-900 outline-none ring-lime-300 focus:ring-2" placeholder="000000" /></label> : <label className="block text-xs font-bold text-slate-600">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-lime-300 focus:ring-2" placeholder="At least 8 characters" /></label>}
          {notice && <p className="rounded-xl bg-lime-50 px-3 py-2 text-xs font-semibold text-lime-800">{notice}</p>}
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-lime-600">{submitLabel}</button>
        </form>
        <div className="mt-6 flex justify-center gap-3 text-xs font-semibold text-slate-400">
          {mode !== "login" && <button onClick={() => { setMode("login"); setError(""); }} className="hover:text-slate-900">Sign in</button>}
          {mode === "login" && <button onClick={() => { setMode("register"); setError(""); }} className="hover:text-slate-900">Create an account</button>}
          {mode === "login" && <span>·</span>}
          {mode !== "verify" && <button onClick={() => { setMode("verify"); setError(""); }} className="hover:text-slate-900">Enter a code</button>}
        </div>
      </section>
    </main>
  );
}
