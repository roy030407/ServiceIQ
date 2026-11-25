import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold tracking-wide text-blue-700">SERVICEIQ SETUP</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Set up your organization
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tell us a little about you and your service business to get started.
        </p>
        <OnboardingForm />
      </section>
    </main>
  );
}
