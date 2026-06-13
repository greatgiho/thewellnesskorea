import Link from "next/link"
import { AdminLoginForm } from "@/components/admin/admin-login-form"

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="font-serif text-2xl text-foreground">The Wellness Korea</p>
          <h1 className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Admin
          </h1>
        </div>
        <AdminLoginForm />
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  )
}
