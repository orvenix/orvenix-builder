import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export default async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
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
  ],
};
