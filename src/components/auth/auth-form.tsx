"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
  callbackError?: boolean;
}

export function AuthForm({ mode, callbackError = false }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(
    callbackError
      ? "That sign-in link could not be verified. Request a new link and try again."
      : "",
  );
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSending(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) throw signInError;
      setMessage("Check your email for a secure sign-in link.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not send the sign-in link. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-bold tracking-wide text-blue-700">
          SERVICEIQ
        </Link>
        <h1 className="mt-8 text-2xl font-semibold text-slate-900">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter your work email and we&apos;ll send you a secure magic link.
        </p>

        <form className="mt-7 space-y-4" onSubmit={submit}>
          <div>
            <label className="field-label" htmlFor={`${mode}-email`}>
              Email address
            </label>
            <input
              autoComplete="email"
              className="form-input"
              id={`${mode}-email`}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              type="email"
              value={email}
            />
          </div>
          <button className="primary-button w-full" disabled={sending} type="submit">
            {sending ? "Sending link…" : "Send magic link"}
          </button>
        </form>

        {message && (
          <p aria-live="polite" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p aria-live="assertive" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          {mode === "login" ? "New to ServiceIQ?" : "Already have an account?"}{" "}
          <Link
            className="font-semibold text-blue-700 hover:text-blue-900"
            href={mode === "login" ? "/signup" : "/login"}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </section>
    </main>
  );
}
