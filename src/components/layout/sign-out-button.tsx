"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function signOut() {
    setError("");
    const { error: signOutError } = await createClient().auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <div>
      <button
        aria-label={compact ? "Sign out" : undefined}
        className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        onClick={signOut}
        type="button"
      >
        <LogOut aria-hidden="true" size={17} />
        {!compact && "Sign out"}
      </button>
      {error && <p className="mt-1 px-3 text-xs text-red-700">{error}</p>}
    </div>
  );
}
