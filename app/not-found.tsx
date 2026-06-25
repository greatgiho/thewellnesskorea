import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-5xl text-foreground">404</p>
      <p className="mt-4 text-base text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-foreground underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </div>
  )
}
