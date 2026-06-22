"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deletePartner } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"

type DeletePartnerButtonProps = {
  id: string
  name: string
}

export function DeletePartnerButton({ id, name }: DeletePartnerButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const onDelete = async () => {
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return
    setPending(true)
    try {
      await deletePartner(id)
      router.push("/admin/partners")
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
