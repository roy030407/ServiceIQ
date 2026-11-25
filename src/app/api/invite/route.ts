import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { UserRole } from "@/types";

const INVITABLE_ROLES: UserRole[] = ["dispatcher", "technician", "accounts"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invite details are required." }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
  const orgId = typeof values.orgId === "string" ? values.orgId : "";
  const fullName = typeof values.fullName === "string" ? values.fullName.trim() : "";
  const role = values.role;

  if (!EMAIL_PATTERN.test(email) || !UUID_PATTERN.test(orgId) || typeof role !== "string" || !INVITABLE_ROLES.includes(role as UserRole)) {
    return NextResponse.json({ error: "Provide a valid email, organization, and invite role." }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Supabase server configuration is incomplete." },
      { status: 503 },
    );
  }

  const supabase = createSessionClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to invite a teammate." }, { status: 401 });
  }

  // Check the caller with their session before using the service-role client,
  // which bypasses RLS for provisioning the invited member.
  const { data: callerRole, error: roleError } = await supabase.rpc("fn_my_role", {
    p_org_id: orgId,
  });
  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }
  if (callerRole !== "owner") {
    return NextResponse.json({ error: "Only an organization owner can invite members." }, { status: 403 });
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!projectUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server invitation setup is incomplete. Configure the Supabase service role key." },
      { status: 503 },
    );
  }

  const admin = createAdminClient<Database>(projectUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const redirectTo = new URL("/auth/callback", request.nextUrl.origin).toString();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { full_name: fullName || email },
  });

  if (inviteError || !invited.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Supabase did not return the invited user." },
      { status: 400 },
    );
  }

  const { data: person, error: personError } = await admin
    .from("person")
    .upsert(
      { auth_user_id: invited.user.id, full_name: fullName || email, email },
      { onConflict: "email" },
    )
    .select("person_id")
    .single();

  if (personError || !person) {
    return NextResponse.json(
      {
        error: `The invitation was sent, but profile setup failed: ${personError?.message ?? "person row was not returned"}`,
      },
      { status: 500 },
    );
  }

  const { error: membershipError } = await admin
    .from("org_membership")
    .upsert(
      {
        person_id: person.person_id,
        org_id: orgId,
        role,
        is_active: true,
      },
      { onConflict: "person_id,org_id" },
    );

  if (membershipError) {
    return NextResponse.json(
      { error: `The invitation was sent, but organization access could not be created: ${membershipError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
