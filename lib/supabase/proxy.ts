import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "./config";

const LOGIN_PATH = "/team/login";
const TEAM_HOME_PATH = "/team";
const CRM_LOGIN_PATH = "/crm/login";
const CRM_HOME_PATH = "/crm";

function isTeamPath(pathname: string) {
  return pathname === TEAM_HOME_PATH || pathname.startsWith(`${TEAM_HOME_PATH}/`);
}

function isPublicTeamPath(pathname: string) {
  return (
    pathname === LOGIN_PATH ||
    pathname === "/team/auth/callback" ||
    pathname === "/team/auth/signout"
  );
}

function isCrmPath(pathname: string) {
  return pathname === CRM_HOME_PATH || pathname.startsWith(`${CRM_HOME_PATH}/`);
}

function isPublicCrmPath(pathname: string) {
  return pathname === CRM_LOGIN_PATH || pathname === "/crm/auth/signout";
}

function loginRedirect(request: NextRequest, setupMissing = false) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = LOGIN_PATH;
  redirectUrl.search = "";

  if (setupMissing) {
    redirectUrl.searchParams.set("setup", "missing");
  } else {
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
  }

  return NextResponse.redirect(redirectUrl);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedTeamPath = isTeamPath(pathname) && !isPublicTeamPath(pathname);
  const isProtectedCrmPath = isCrmPath(pathname) && !isPublicCrmPath(pathname);
  const config = getSupabaseConfig();

  if (!config) {
    return isProtectedTeamPath || isProtectedCrmPath
      ? loginRedirectFor(request, isProtectedCrmPath ? CRM_LOGIN_PATH : LOGIN_PATH, true)
      : NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims);

  if (isProtectedTeamPath && !isAuthenticated) {
    return loginRedirect(request);
  }

  if (isProtectedCrmPath && !isAuthenticated) {
    return loginRedirectFor(request, CRM_LOGIN_PATH);
  }

  if (pathname === LOGIN_PATH && isAuthenticated) {
    return NextResponse.redirect(new URL(TEAM_HOME_PATH, request.url));
  }

  return response;
}

function loginRedirectFor(request: NextRequest, loginPath: string, setupMissing = false) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = loginPath;
  redirectUrl.search = "";
  if (setupMissing) redirectUrl.searchParams.set("setup", "missing");
  else redirectUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}
