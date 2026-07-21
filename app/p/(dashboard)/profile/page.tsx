import Image from "next/image"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { getPartnerPhotoUrl } from "@/lib/partners/utils"

export default async function PartnerProfilePage() {
  const { partner, user } = await requirePartnerSession()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">내 프로필</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          프로필 수정이 필요하면 관리자에게 문의해 주세요.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative size-32 shrink-0 overflow-hidden rounded-2xl bg-secondary">
          <Image
            src={getPartnerPhotoUrl(partner.photo_path)}
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-light">{partner.name_en}</h2>
          <p className="text-lg text-muted-foreground">{partner.name_ko}</p>
          <p className="text-sm text-foreground">{partner.role_en} · {partner.role_ko}</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card/40 p-6 sm:grid-cols-2">
        <Field label="이메일" value={user.email ?? "—"} />
        <Field label="전화번호" value={partner.phone ?? "—"} />
        <Field label="인스타그램" value={partner.instagram ?? "—"} />
        <Field label="계정 유형" value="파트너 (선생님)" />
      </div>

      {partner.quote && (
        <div className="rounded-2xl border border-border bg-card/40 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            소개글
          </p>
          <blockquote className="border-l-2 border-primary/30 pl-4 text-sm italic leading-relaxed text-foreground/80">
            {partner.quote}
          </blockquote>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  )
}
