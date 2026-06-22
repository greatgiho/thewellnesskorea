"use client"

import Image from "next/image"

type PartnerPhotoFieldProps = {
  label: string
  preview: string | null
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function PartnerPhotoField({
  label,
  preview,
  onFileChange,
}: PartnerPhotoFieldProps) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {preview && (
          <div className="relative size-32 shrink-0 overflow-hidden rounded-2xl border border-border">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
      </div>
    </div>
  )
}
