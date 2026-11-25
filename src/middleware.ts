import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ORG_ROUTES = [
  "/dispatch",
  "/tickets",
  "/jobs",
  "/equipment",
  "/contracts",
  "/renewals",
  "/technicians",
  "/parts",
  "/dashboard",
  "/settings",
];

function isWithin(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  response: NextResponse,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";
  const redirectResponse = NextResponse.redirect(redirectUrl);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 },
    );
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }

  const pathname = request.nextUrl.pathname;
  const isOnboarding = pathname === "/onboard";
  const isTechRoute = isWithin(pathname, "/tech");
  const isOrgRoute = ORG_ROUTES.some((route) => isWithin(pathname, route));

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (!isOnboarding && !isTechRoute && !isOrgRoute) {
    return response;
  }

  // The middleware resolves one active membership to keep route access consistent
  // with the organization selected by OrgContext.
  const { data: person, error: personError } = await supabase
    .from("person")
    .select("person_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (personError) {
    return NextResponse.json({ error: personError.message }, { status: 500 });
  }

  if (!person) {
    if (isOnboarding) return response;
    return redirectWithCookies(request, "/onboard", response);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_membership")
    .select("role")
    .eq("person_id", person.person_id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  if (!membership) {
    if (isOnboarding) return response;
    return redirectWithCookies(request, "/onboard", response);
  }

  const destination = membership.role === "technician" ? "/tech" : "/dispatch";
  if (isOnboarding) {
    return redirectWithCookies(request, destination, response);
  }

  if (isTechRoute && membership.role !== "technician") {
    return redirectWithCookies(request, "/dispatch", response);
  }

  if (!isTechRoute && membership.role === "technician") {
    return redirectWithCookies(request, "/tech", response);
  }

  if (
    membership.role === "accounts" &&
    (isWithin(pathname, "/dispatch") || isWithin(pathname, "/technicians"))
  ) {
    return redirectWithCookies(request, "/tickets", response);
  }

  return response;
}

export const config = {
  matcher: [
    "/onboard",
    "/dispatch/:path*",
    "/tickets/:path*",
    "/jobs/:path*",
    "/equipment/:path*",
    "/contracts/:path*",
    "/renewals/:path*",
    "/technicians/:path*",
    "/parts/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/tech/:path*",
  ],
};


