"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { OrgType } from "@/types";
import { createClient } from "@/lib/supabase/client";

const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: "service_centre", label: "Service centre" },
  { value: "retailer", label: "Retailer" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "brand", label: "Brand" },
  { value: "facility", label: "Facility management" },
];

export function OnboardingForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("service_centre");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const phoneValue = phone.trim();
      if (!/^\+?[\d\s().-]{7,20}$/.test(phoneValue)) {
        throw new Error("Enter a valid phone number, including its country code if needed.");
      }

      const supabase = createClient();
      // The SECURITY DEFINER RPC creates the first org and owner membership atomically;
      // a new user has no RLS membership that would permit direct inserts.
      const { data: orgId, error: createError } = await supabase.rpc(
        "fn_create_org",
        {
          p_full_name: fullName.trim(),
          p_phone: phoneValue,
          p_org_name: orgName.trim(),
          p_org_type: orgType,
        },
      );

      if (createError) throw createError;
      if (!orgId) throw new Error("The organization could not be created.");

      router.replace("/dispatch");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not finish setting up your organization.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={submit}>
      <div>
        <label className="field-label" htmlFor="full-name">Your full name</label>
        <input
          autoComplete="name"
          className="form-input"
          id="full-name"
          onChange={(event) => setFullName(event.target.value)}
          required
          value={fullName}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="phone">Phone number</label>
        <input
          autoComplete="tel"
          className="form-input"
          id="phone"
          onChange={(event) => setPhone(event.target.value)}
          required
          type="tel"
          value={phone}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="org-name">Organization name</label>
        <input
          className="form-input"
          id="org-name"
          onChange={(event) => setOrgName(event.target.value)}
          required
          value={orgName}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="org-type">Organization type</label>
        <select
          className="form-input"
          id="org-type"
          onChange={(event) => setOrgType(event.target.value as OrgType)}
          value={orgType}
        >
          {ORG_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p aria-live="assertive" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button className="primary-button w-full" disabled={saving} type="submit">
        {saving ? "Setting up…" : "Create organization"}
      </button>
      <p className="text-xs leading-5 text-slate-500">
        Your profile, owner membership, organization, and default job workflows are created together.
      </p>
    </form>
  );
}
