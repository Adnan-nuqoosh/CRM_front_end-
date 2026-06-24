"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { postJson } from "@/lib/api";
import type { LoginResponse } from "@/lib/auth";
import { saveAuth, setActiveCompanyId } from "@/lib/auth";

const underlineInputClassName =
  "w-full border-0 border-b border-neutral-300 bg-transparent py-3 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-800";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !submitting;
  }, [email, password, submitting]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await postJson<LoginResponse, { email: string; password: string }>("/api/login", {
        email: email.trim(),
        password,
      });

      saveAuth({ token: res.token, user: res.user, remember });

      // Always start a fresh session with no company selected — the user
      // picks an active company explicitly on the Companies page.
      setActiveCompanyId(null);

      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
        setError(err.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-white text-neutral-900">
      <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">

        {/* ══════════════════════════════════════════
            LEFT — Branded panel (hidden on small screens)
        ══════════════════════════════════════════ */}
        <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#1e40af] via-[#1d4ed8] to-[#172554]"
            aria-hidden
          />
          {/* Subtle noise texture overlay for depth. */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          {/* Decorative rings. */}
          <div
            className="pointer-events-none absolute -left-20 top-[18%] h-[380px] w-[380px] rounded-full border border-white/15"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 bottom-[-8%] h-[480px] w-[480px] rounded-full border border-white/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-[28%] top-[-6%] h-[240px] w-[240px] rounded-full border border-white/8"
            aria-hidden
          />

          <div className="relative z-10 flex flex-1 flex-col justify-between p-12 xl:p-14">
            <Image
              src="/logo/nuqoosh-white logo.png"
              alt="Nuqoosh"
              width={150}
              height={60}
              priority
              className="h-auto w-[150px]"
            />

            <div className="max-w-md">
              <p className="text-sm font-medium text-white/90">Welcome to</p>
              <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-white xl:text-[2.75rem]">
                Nuqoosh CRM
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/75">
                Sign in to access your workspace, manage customers, and keep your team aligned.
              </p>
            </div>

            <div className="flex items-center text-xs text-white/55">
              <p>All rights reserved by Nuqoosh.io</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            RIGHT — Login form
        ══════════════════════════════════════════ */}
        <section className="flex min-h-dvh flex-col justify-center bg-white px-8 py-12 sm:px-12 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[420px]">
            <h2 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">Log in</h2>
            <p className="mt-3 text-base text-neutral-500">
              Please fill in your credentials to login.
            </p>

            <form className="mt-10 space-y-8" onSubmit={onSubmit}>
              {error ? (
                <div
                  role="alert"
                  className="border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-brand-800"
                >
                  {error}
                </div>
              ) : null}

              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="test@example.com"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={underlineInputClassName}
                />
              </div>

              <div>
                <div className="flex items-center border-b border-neutral-300 focus-within:border-neutral-800">
                  <input
                    id="password"
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-0 bg-transparent py-3 text-base text-neutral-900 outline-none placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    className="shrink-0 pl-3 text-sm text-neutral-500 hover:text-neutral-800"
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  >
                    {isPasswordVisible ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-3 text-base text-neutral-500">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 accent-neutral-700"
                />
                Remember Me
              </label>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-lg bg-neutral-300 py-3.5 text-base font-semibold text-neutral-600 transition-colors enabled:bg-[#0b1f3a] enabled:text-white enabled:hover:bg-[#091a31] enabled:active:bg-[#071429] disabled:cursor-not-allowed"
              >
                {submitting ? "Logging in..." : "Log in"}
              </button>

              <p className="text-sm italic text-neutral-400">
                *Do not share your login credentials with anyone.
              </p>
            </form>
          </div>
        </section>

      </div>
    </main>
  );
}