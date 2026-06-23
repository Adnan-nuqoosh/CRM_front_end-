"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password === confirmPassword &&
      !submitting
    );
  }, [name, email, password, confirmPassword, submitting]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    // API for registration not provided yet; keep UI ready.
    // When you share the endpoint/payload, we’ll wire it the same way as login.
    await new Promise((r) => setTimeout(r, 500));
    setSubmitting(false);
    setError("Registration API is not connected yet.");
  }

  return (
    <main className="min-h-dvh bg-neutral-50 text-neutral-900">
      <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden lg:block">
          <Image
            src="/nuqoosh-crm-login-image.webp"
            alt="Nuqoosh CRM"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand/80 via-brand/60 to-brand/80" />

          <div className="absolute inset-0 flex flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <Image
                src="/logo/nuqoosh-white logo.png"
                alt="Nuqoosh"
                width={130}
                height={52}
                priority
                className="h-auto w-[130px]"
              />
            </div>

            <div className="max-w-lg">
              <p className="text-sm font-medium tracking-wide text-white">Welcome to</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Nuqoosh CRM</h1>
              <p className="mt-4 text-sm leading-6 text-white">
                Create an account to get started with your workspace.
              </p>
            </div>

            <div className="text-xs text-white">All rights reserved by Nuqoosh.io</div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <h2 className="text-5xl font-semibold tracking-tight text-brand-800">Register</h2>
              <p className="mt-3 text-base text-neutral-500">Please fill in your details to register.</p>
            </div>

            <form className="space-y-8" onSubmit={onSubmit}>
              {error ? (
                <div className="border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-brand-800">
                  {error}
                </div>
              ) : null}

              <div className="space-y-3">
                <input
                  id="name"
                  name="name"
                  placeholder="Full name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full border-b border-neutral-400 bg-transparent px-0 text-base text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-brand-500"
                />
              </div>

              <div className="space-y-3">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full border-b border-neutral-400 bg-transparent px-0 text-base text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-brand-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex h-10 items-center border-b border-neutral-400 focus-within:border-brand-500">
                  <input
                    id="password"
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-full w-full bg-transparent px-0 text-base text-neutral-800 outline-none placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    className="pl-4 text-sm text-neutral-500 hover:text-brand-800"
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  >
                    {isPasswordVisible ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex h-10 items-center border-b border-neutral-400 focus-within:border-brand-500">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-full w-full bg-transparent px-0 text-base text-neutral-800 outline-none placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible((v) => !v)}
                    className="pl-4 text-sm text-neutral-500 hover:text-brand-800"
                    aria-label={isConfirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
                  >
                    {isConfirmPasswordVisible ? "Hide" : "Show"}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword ? (
                  <p className="text-sm text-neutral-500">Passwords do not match.</p>
                ) : null}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-12 w-56 bg-[#0b1f3a] text-lg font-semibold text-white hover:bg-[#091a31] active:bg-[#071429] disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {submitting ? "Creating..." : "Register"}
                </button>
              </div>

              <p className="text-base text-neutral-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand-800 hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

