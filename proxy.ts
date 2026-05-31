import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Rutas protegidas que requieren sesión activa.
export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token

    if (token?.role === "ADMIN") return NextResponse.next()

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/editor/:path*",
    "/dashboard/:path*",
    "/api/editor/:path*",
    "/api/billing/:path((?!stripe-webhook$).*)",
  ],
}
