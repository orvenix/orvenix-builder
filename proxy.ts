import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveAuthSecretV1 } from "@/lib/auth-secret";
import { isSitePubliclyServable } from "@/lib/moderation/site-moderation";

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

const PUBLISHED_SITES_PREFIX = "/published-sites/";

/**
 * ADMIN MODERATION: static artifacts under public/published-sites are plain
 * files, so without this guard Next would serve them for sites that are
 * suspended, terminated, unpublished or already deleted. A file is served
 * only while its site exists, is published and is not moderated. Any doubt
 * (bad id, lookup error) fails closed.
 */
async function guardPublishedSiteArtifact(pathname: string) {
  let servable = false;
  try {
    const siteId = decodeURIComponent(pathname.slice(PUBLISHED_SITES_PREFIX.length).split("/")[0] ?? "");
    servable = await isSitePubliclyServable(siteId);
  } catch {
    servable = false;
  }
  if (servable) return NextResponse.next();
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith(PUBLISHED_SITES_PREFIX)) {
    return guardPublishedSiteArtifact(request.nextUrl.pathname);
  }

  const token = await getToken({
    req: request,
    // SEC-1 (SEC0-09): same fail-closed resolver as NextAuth.
    secret: resolveAuthSecretV1(),
  });

  if (token) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  // Las APIs deben devolver JSON, no redirigir al login.
  if (isApiRoute(pathname)) {
    return NextResponse.json(
      {
        error: "Autenticación requerida",
        code: "UNAUTHENTICATED",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  // Las páginas normales sí deben redirigir al login.
  const loginUrl = new URL("/login", request.url);

  loginUrl.searchParams.set(
    "callbackUrl",
    `${pathname}${search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/editor/:path*",
    "/dashboard/:path*",
    "/api/editor/:path*",
    "/api/billing/:path((?!stripe-webhook$).*)",
    "/published-sites/:path*",
  ],
};
