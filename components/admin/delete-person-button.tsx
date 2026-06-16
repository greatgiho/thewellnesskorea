"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deletePerson } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"

type DeletePersonButtonProps = {
  id: string
  name: string
}

export function DeletePersonButton({ id, name }: DeletePersonButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const onDelete = async () => {
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return
    setPending(true)
    try {
      await deletePerson(id)
      router.push("/admin/people")
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.")
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={onDelete}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  )
}
