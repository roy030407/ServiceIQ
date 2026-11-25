"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useOrg } from "@/hooks/use-org";
import { createClient } from "@/lib/supabase/client";
import type { Holiday, OrgType, UserRole } from "@/types";

const INVITABLE_ROLES: { value: Exclude<UserRole, "owner">; label: string }[] = [
  { value: "dispatcher", label: "Dispatcher" },
  { value: "technician", label: "Technician" },
  { value: "accounts", label: "Accounts" },
];

const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: "service_centre", label: "Service centre" },
  { value: "retailer", label: "Retailer" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "brand", label: "Brand" },
  { value: "facility", label: "Facility" },
];

export function SettingsPanel() {
  const router = useRouter();
  const { org, person, isOwner } = useOrg();
  const [name, setName] = useState(org.name);
  const [orgType, setOrgType] = useState<OrgType>(org.org_type);
  const [dayStart, setDayStart] = useState(org.day_start?.slice(0, 5) ?? "09:00");
  const [dayEnd, setDayEnd] = useState(org.day_end?.slice(0, 5) ?? "18:00");
  const [workingDays, setWorkingDays] = useState(
    org.working_days ?? "Mon,Tue,Wed,Thu,Fri,Sat",
  );
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<UserRole, "owner">>("technician");
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadHolidays() {
    setLoadingHolidays(true);
    try {
      const { data, error: loadError } = await createClient()
        .from("holiday")
        .select("holiday_id, org_id, holiday_date, name")
        .eq("org_id", org.org_id)
        .order("holiday_date", { ascending: true });

      if (loadError) throw loadError;
      setHolidays((data ?? []) as Holiday[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Holidays could not be loaded.",
      );
    } finally {
      setLoadingHolidays(false);
    }
  }

  useEffect(() => {
    void loadHolidays();
    // The active organization is fixed for this page session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.org_id]);

  async function saveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { error: saveError } = await createClient()
        .from("organisation")
        .update({
          name: name.trim(),
          org_type: orgType,
          day_start: dayStart,
          day_end: dayEnd,
          working_days: workingDays.trim(),
        })
        .eq("org_id", org.org_id);

      if (saveError) throw saveError;
      setMessage("Organization settings saved.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Organization settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          fullName: inviteName.trim(),
          orgId: org.org_id,
          role: inviteRole,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The invite could not be sent.");

      setInviteEmail("");
      setInviteName("");
      setMessage(`An invitation was sent to ${inviteEmail.trim()}.`);
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "The invite could not be sent.",
      );
    } finally {
      setInviting(false);
    }
  }

  async function addHoliday(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const { error: insertError } = await createClient().from("holiday").insert({
        org_id: org.org_id,
        holiday_date: holidayDate,
        name: holidayName.trim() || null,
      });

      if (insertError) throw insertError;
      setHolidayDate("");
      setHolidayName("");
      setMessage("Holiday added.");
      await loadHolidays();
    } catch (insertError) {
      setError(
        insertError instanceof Error
          ? insertError.message
          : "The holiday could not be added.",
      );
    }
  }

  async function deleteHoliday(holidayId: string) {
    setError("");
    setMessage("");
    try {
      const { error: deleteError } = await createClient()
        .from("holiday")
        .delete()
        .eq("holiday_id", holidayId)
        .eq("org_id", org.org_id);

      if (deleteError) throw deleteError;
      setMessage("Holiday removed.");
      await loadHolidays();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The holiday could not be removed.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-blue-700">WORKSPACE</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Organization details, team access, and working calendar.
        </p>
      </header>

      {message && (
        <p aria-live="polite" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p aria-live="assertive" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Organization</h2>
        {isOwner ? (
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveOrganization}>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="settings-org-name">Organization name</label>
              <input className="form-input" id="settings-org-name" onChange={(event) => setName(event.target.value)} required value={name} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="settings-org-type">Organization type</label>
              <select className="form-input" id="settings-org-type" onChange={(event) => setOrgType(event.target.value as OrgType)} value={orgType}>
                {ORG_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="day-start">Working day starts</label>
              <input className="form-input" id="day-start" onChange={(event) => setDayStart(event.target.value)} required type="time" value={dayStart} />
            </div>
            <div>
              <label className="field-label" htmlFor="day-end">Working day ends</label>
              <input className="form-input" id="day-end" onChange={(event) => setDayEnd(event.target.value)} required type="time" value={dayEnd} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="working-days">Working days</label>
              <input className="form-input" id="working-days" onChange={(event) => setWorkingDays(event.target.value)} placeholder="Mon,Tue,Wed,Thu,Fri,Sat" required value={workingDays} />
              <p className="mt-1 text-xs text-slate-500">Comma-separated day abbreviations.</p>
            </div>
            <div className="sm:col-span-2">
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? "Saving…" : "Save organization"}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Only an organization owner can change these settings.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Team invitations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Invite a teammate to join {org.name}. They will receive a sign-in link by email.
        </p>
        {isOwner ? (
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={inviteMember}>
            <div>
              <label className="field-label" htmlFor="invite-name">Full name <span className="font-normal text-slate-500">(optional)</span></label>
              <input autoComplete="name" className="form-input" id="invite-name" onChange={(event) => setInviteName(event.target.value)} value={inviteName} />
            </div>
            <div>
              <label className="field-label" htmlFor="invite-email">Email address</label>
              <input autoComplete="email" className="form-input" id="invite-email" onChange={(event) => setInviteEmail(event.target.value)} required type="email" value={inviteEmail} />
            </div>
            <div>
              <label className="field-label" htmlFor="invite-role">Role</label>
              <select className="form-input" id="invite-role" onChange={(event) => setInviteRole(event.target.value as Exclude<UserRole, "owner">)} value={inviteRole}>
                {INVITABLE_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button className="primary-button w-full sm:w-auto" disabled={inviting} type="submit">
                {inviting ? "Sending invite…" : "Invite teammate"}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Only an organization owner can invite teammates.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Holidays</h2>
        <p className="mt-1 text-sm text-slate-600">Dates when your organization is closed.</p>
        {isOwner && (
          <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={addHoliday}>
            <div>
              <label className="field-label" htmlFor="holiday-date">Date</label>
              <input className="form-input" id="holiday-date" onChange={(event) => setHolidayDate(event.target.value)} required type="date" value={holidayDate} />
            </div>
            <div>
              <label className="field-label" htmlFor="holiday-name">Name</label>
              <input className="form-input" id="holiday-name" onChange={(event) => setHolidayName(event.target.value)} placeholder="Optional" value={holidayName} />
            </div>
            <div className="flex items-end">
              <button className="primary-button w-full sm:w-auto" type="submit">Add holiday</button>
            </div>
          </form>
        )}
        <div className="mt-5 divide-y divide-slate-100">
          {loadingHolidays ? (
            <p className="py-3 text-sm text-slate-500">Loading holidays…</p>
          ) : holidays.length === 0 ? (
            <p className="py-3 text-sm text-slate-500">No holidays have been added.</p>
          ) : holidays.map((holiday) => (
            <div className="flex items-center justify-between gap-4 py-3" key={holiday.holiday_id}>
              <div>
                <p className="text-sm font-medium text-slate-800">{holiday.name || "Holiday"}</p>
                <p className="text-xs text-slate-500">{holiday.holiday_date}</p>
              </div>
              {isOwner && (
                <button className="min-h-10 rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => void deleteHoliday(holiday.holiday_id)} type="button">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="sr-only">Signed in as {person.full_name}.</p>
      </section>
    </div>
  );
}
