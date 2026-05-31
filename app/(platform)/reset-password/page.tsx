import { Suspense } from "react"
import ResetPasswordImpl from "@/app/reset-password/page.impl"

// Suspense requerido por useSearchParams en Next.js App Router
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordImpl />
    </Suspense>
  )
}
