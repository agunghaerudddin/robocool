import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  hasPermission,
  getDefaultPageForRole,
  PUBLIC_ROUTES,
  USER_ROLES,
} from "@/lib/permissions";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // 1. Skip static assets, favicon, build files, and image files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in middleware");
    return supabaseResponse;
  }

  // 2. Initialize Supabase SSR client for middleware with cookie handler
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // 3. Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // 4. If unauthenticated and accessing a protected route -> redirect to /login
  if (!user) {
    if (!isPublicRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // 5. Determine user role (int4: 1, 2, 3, 4)
  let userRole: number | null = null;

  if (typeof user.user_metadata?.role === "number") {
    userRole = user.user_metadata.role;
  } else if (typeof user.user_metadata?.role === "string") {
    userRole = parseInt(user.user_metadata.role, 10);
  }

  // If not found in metadata, query public.users table by id
  if (userRole === null || isNaN(userRole)) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (dbUser?.role !== undefined && dbUser?.role !== null) {
      userRole = Number(dbUser.role);
    }
  }

  // Fallback to Mitra (4) if role is not recognized
  const effectiveRole =
    userRole && !isNaN(userRole) ? userRole : USER_ROLES.MITRA;

  const defaultLandingPage = getDefaultPageForRole(effectiveRole);

  // 6. If user visits /login or root /, redirect to their role's default page
  if (pathname === "/login" || pathname === "/") {
    return NextResponse.redirect(new URL(defaultLandingPage, request.url));
  }

  // 7. Verify permission for protected pages
  if (!isPublicRoute) {
    const permitted = hasPermission(pathname, effectiveRole);

    if (!permitted) {
      // Redirect to their allowed default page with unauthorized flag
      const redirectUrl = new URL(defaultLandingPage, request.url);
      redirectUrl.searchParams.set("unauthorized", "1");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
