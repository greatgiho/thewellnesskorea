"use client"

import { X } from "lucide-react"
import { type PathKey } from "@/lib/paths/paths-data"
import type { PartnerWithPrograms } from "@/lib/partners/types"
import type { FloorRow, SessionFormInput, SessionWithRelations } from "@/lib/schedule/types"
import { PhilosophyPathPicker } from "@/components/admin/philosophy-path-picker"
import { InstructorSearchPicker } from "@/components/admin/instructor-search-picker"
import { SessionDescriptionFields } from "@/components/admin/session-description-fields"
import { SessionDuplicateForm } from "@/components/admin/session-duplicate-form"
import { SessionImageUpload } from "@/components/admin/session-image-upload"
import { SessionStatusPanel } from "@/components/admin/session-status-panel"
import { SessionBookingsPanel } from "@/components/admin/session-bookings-panel"
import { defaultEndTime, formatTimeInKst } from "@/lib/schedule/utils"
import { FIELD } from "@/lib/ui/field"
import { useSessionForm } from "@/components/admin/use-session-form"
import { PriceTag } from "@/components/booking/price-tag"
import { SessionTiersField } from "@/components/admin/session-tiers-field"

type SessionFormDialogProps = {
  open: boolean
  dateKey: string
  floors: FloorRow[]
  partners: PartnerWithPrograms[]
  session?: SessionWithRelations | null
  presetFloorId?: string
  presetStartTime?: string
  onClose: () => void
  onSaved: () => void
}


export function SessionFormDialog({
  open,
  dateKey,
  floors,
  partners,
  session,
  presetFloorId,
  presetStartTime,
  onClose,
  onSaved,
}: SessionFormDialogProps) {
  const {
    input,
    setInput,
    imageSlots,
    setImageSlots,
    error,
    pending,
    isEditing,
    setIsEditing,
    instructors,
    selectedInstructor,
    programs,
    startOptions,
    endOptions,
    discountPreview,
    childPreview,
    effectiveCapacity,
    readOnly,
    onProgramChange,
    onSubmit,
    onStatusClick,
    onDelete,
    onRequestClose,
  } = useSessionForm({
    open,
    dateKey,
    floors,
    partners,
    session,
    presetFloorId,
    presetStartTime,
    onClose,
    onSaved,
  })

  if (!open) return null

  const fieldClass = FIELD

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        onClick={onRequestClose}
        aria-label="Close dialog"
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="relative shrink-0 border-b border-border px-6 py-5 pr-14">
          <button
            type="button"
            onClick={onRequestClose}
            className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <h2 className="font-serif text-xl text-foreground">
            {session ? "Edit session" : "New session"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule · {input.date}
          </p>
          {session?.created_by_email && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Entered by {session.created_by_email}
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {/* Outside the fieldset below: it disables every control it wraps
                while viewing, and confirming a session is not an edit. */}
            <SessionStatusPanel
              status={session?.status ?? null}
              isPublished={input.is_published}
              onPublishedChange={(is_published) =>
                setInput((v) => ({ ...v, is_published }))
              }
              onStatusAction={onStatusClick}
              readOnly={readOnly}
              pending={pending}
            />

            <fieldset
              disabled={readOnly || pending}
              className="mt-6 min-w-0 space-y-6 border-0 p-0 disabled:opacity-100"
            >
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Date</span>
                <input
                  type="date"
                  required
                  className={fieldClass}
                  value={input.date}
                  onChange={(e) =>
                    setInput((v) => ({ ...v, date: e.target.value }))
                  }
                />
              </label>
              <div className="block space-y-1.5">
                <span className="text-sm font-medium">Floor</span>
                <select
                  className={fieldClass}
                  value={input.floor_id}
                  disabled={input.is_all_floors}
                  onChange={(e) =>
                    setInput((v) => ({ ...v, floor_id: e.target.value }))
                  }
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name_en} · {f.name_ko}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    checked={input.is_all_floors}
                    onChange={(e) =>
                      setInput((v) => ({
                        ...v,
                        is_all_floors: e.target.checked,
                      }))
                    }
                    className="size-4 rounded border-border"
                  />
                  <span className="text-xs font-medium text-foreground">
                    전층 사용 · All floors
                  </span>
                </label>
                {input.is_all_floors && (
                  <p className="text-xs text-muted-foreground">
                    이 시간대에 건물 전체(모든 층)를 점유합니다. 위 층은
                    대표(홈) 층으로 저장돼요.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Start</span>
                <select
                  className={fieldClass}
                  value={input.start_time}
                  onChange={(e) => {
                    const start_time = e.target.value
                    setInput((v) => ({
                      ...v,
                      start_time,
                      end_time: defaultEndTime(start_time, 60),
                    }))
                  }}
                >
                  {startOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">End</span>
                <select
                  className={fieldClass}
                  value={input.end_time}
                  onChange={(e) =>
                    setInput((v) => ({ ...v, end_time: e.target.value }))
                  }
                >
                  {endOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>

            <InstructorSearchPicker
              key={session?.id ?? "new-session"}
              instructors={instructors}
              allPartners={partners}
              value={input.instructor_id}
              disabled={readOnly || pending}
              onChange={(instructorId) =>
                setInput((v) => ({
                  ...v,
                  instructor_id: instructorId,
                  partner_program_id: null,
                  title: "",
                  path_keys: [],
                }))
              }
            />

            {selectedInstructor && programs.length > 0 && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Program</span>
                <select
                  className={fieldClass}
                  value={input.partner_program_id ?? ""}
                  onChange={(e) => onProgramChange(e.target.value)}
                >
                  <option value="">Custom title</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Program fills title and paths as a starting point. Session content stays a snapshot.
                </p>
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Title</span>
              <input
                required
                className={fieldClass}
                value={input.title}
                onChange={(e) =>
                  setInput((v) => ({ ...v, title: e.target.value }))
                }
              />
            </label>

            {/* The column has existed since 049 and the list card has always
                read it, but there was nowhere to type it — so every card fell
                back to the full intro and became a wall of text. */}
            <div className="space-y-1.5">
              <span className="text-sm font-medium">
                한 줄 소개{" "}
                <span className="font-normal text-muted-foreground">
                  (목록 카드)
                </span>
              </span>
              <input
                className={fieldClass}
                placeholder="EN — 비우면 목록 카드에 소개가 안 나옵니다"
                value={input.blurb_en}
                onChange={(e) =>
                  setInput((v) => ({ ...v, blurb_en: e.target.value }))
                }
              />
              <input
                className={fieldClass}
                placeholder="KO"
                value={input.blurb_ko}
                onChange={(e) =>
                  setInput((v) => ({ ...v, blurb_ko: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Philosophy paths</span>
              <PhilosophyPathPicker
                namePrefix="session"
                value={input.path_keys}
                onChange={(path_keys: PathKey[]) =>
                  setInput((v) => ({ ...v, path_keys }))
                }
              />
            </div>

            <SessionImageUpload
              slots={imageSlots}
              onChange={setImageSlots}
              disabled={readOnly || pending}
            />

            <SessionDescriptionFields
              value={input.description_blocks}
              onChange={(description_blocks) =>
                setInput((v) => ({ ...v, description_blocks }))
              }
            />

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Capacity</span>
              <input
                type="number"
                min={1}
                className={fieldClass}
                // Derived once the class has grades: entering it twice is one
                // more thing that can disagree with itself.
                readOnly={input.tiers.length > 0}
                value={effectiveCapacity}
                onChange={(e) =>
                  setInput((v) => ({ ...v, capacity: Number(e.target.value) }))
                }
              />
              {input.tiers.length > 0 ? (
                <p className="text-xs text-muted-foreground">등급 정원의 합</p>
              ) : null}
              {session ? (
                <p className="text-xs text-muted-foreground">
                  {session.booked_count} / {session.capacity} spots currently
                  booked
                </p>
              ) : null}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Price</span>
              <div className="flex gap-2">
                <select
                  className={fieldClass}
                  style={{ width: "6rem" }}
                  value={input.price_currency}
                  onChange={(e) =>
                    setInput((v) => ({
                      ...v,
                      price_currency: e.target.value as "USD" | "KRW",
                    }))
                  }
                >
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step={input.price_currency === "KRW" ? 1000 : 1}
                  className={fieldClass}
                  value={input.price_amount}
                  onChange={(e) =>
                    setInput((v) => ({
                      ...v,
                      price_amount: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                0 = 무료. 그 이상이면 아래 결제 방식을 따릅니다.
              </p>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">결제 방식</span>
              <select
                className={fieldClass}
                value={input.payment_method}
                onChange={(e) =>
                  setInput((v) => ({
                    ...v,
                    payment_method: e.target.value as "online" | "onsite",
                  }))
                }
              >
                <option value="online">온라인 결제 (예약 시 선결제)</option>
                <option value="onsite">현장 결제 (예약만 하고 와서 결제)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {input.payment_method === "onsite"
                  ? "결제창을 띄우지 않습니다. 해외 카드 손님이 오는 수업에 쓰세요 — 국내일반결제로는 해외 발급 카드가 승인되지 않습니다."
                  : input.price_currency === "USD"
                    ? "PayPal 로 결제합니다."
                    : "토스로 결제합니다. 해외 발급 카드는 승인되지 않습니다."}
              </p>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={!input.is_listed}
                onChange={(e) =>
                  setInput((v) => ({ ...v, is_listed: !e.target.checked }))
                }
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium">
                  목록에 숨기기 (스텔스)
                </span>
                <span className="block text-xs text-muted-foreground">
                  홈·강사 페이지·일정에 나오지 않고, 링크를 아는 사람만 예약할 수
                  있습니다. 비공개 수업이나 결제 테스트에 쓰세요.
                </span>
              </span>
            </label>


            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Child price</span>
              <input
                type="number"
                min={0}
                step={input.price_currency === "KRW" ? 1000 : 1}
                className={fieldClass}
                placeholder="없음 — 아동 요금 미적용"
                value={input.child_price_amount ?? ""}
                onChange={(e) =>
                  setInput((v) => ({
                    ...v,
                    // Empty is not zero: blank means the class has no child
                    // rate and the booking form shows no child option, while 0
                    // means children attend free.
                    child_price_amount:
                      e.target.value === ""
                        ? null
                        : Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Discount</span>
              <div className="flex gap-2">
                <select
                  className={fieldClass}
                  value={input.discount_type ?? ""}
                  onChange={(e) => {
                    const type = e.target.value as "" | "fixed" | "percent"
                    setInput((v) => ({
                      ...v,
                      // Both columns travel together — the DB rejects one
                      // without the other.
                      discount_type: type === "" ? null : type,
                      discount_value: type === "" ? null : (v.discount_value ?? 0),
                    }))
                  }}
                >
                  <option value="">없음</option>
                  <option value="percent">정률 (%)</option>
                  <option value="fixed">정액 ({input.price_currency})</option>
                </select>
                <input
                  type="number"
                  min={0}
                  max={input.discount_type === "percent" ? 100 : input.price_amount}
                  step={
                    input.discount_type === "percent"
                      ? 1
                      : input.price_currency === "KRW"
                        ? 1000
                        : 1
                  }
                  disabled={input.discount_type === null}
                  className={fieldClass}
                  value={input.discount_value ?? ""}
                  onChange={(e) =>
                    setInput((v) => ({
                      ...v,
                      discount_value: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                />
              </div>
              {discountPreview ? (
                <p className="text-xs text-muted-foreground">
                  고객 화면: <PriceTag priced={discountPreview} />
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  정률은 1–100%, 정액은 정가 이하. 100% 할인은 무료 수업이 됩니다.
                </p>
              )}
              {childPreview ? (
                <p className="text-xs text-muted-foreground">
                  아동: <PriceTag priced={childPreview} />
                </p>
              ) : null}
            </label>

            <SessionTiersField
              tiers={input.tiers}
              currency={input.price_currency}
              discountType={input.discount_type}
              discountValue={input.discount_value}
              fieldClass={fieldClass}
              onChange={(tiers) => setInput((v) => ({ ...v, tiers }))}
            />

            {session ? (
              <SessionBookingsPanel
                sessionId={session.id}
                capacity={session.capacity}
                bookedCount={session.booked_count}
                onBookingChange={onSaved}
              />
            ) : null}

            {session && (
              <SessionDuplicateForm
                sessionId={session.id}
                initialDate={dateKey}
                initialFloorId={session.floor_id}
                initialStart={formatTimeInKst(session.starts_at)}
                initialEnd={formatTimeInKst(session.ends_at)}
                floors={floors}
                fieldClass={fieldClass}
                disabled={pending}
                onDone={() => {
                  onSaved()
                  onClose()
                }}
              />
            )}
            </fieldset>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 border-t border-border bg-background px-6 py-4">
            {session && readOnly && (
              <button
                type="button"
                disabled={pending}
                onClick={() => setIsEditing(true)}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Edit
              </button>
            )}
            <button
              type="submit"
              disabled={pending || readOnly}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Saving…" : session ? "Save" : "Create"}
            </button>
            {session && (
              <button
                type="button"
                onClick={onDelete}
                disabled={pending}
                className="inline-flex h-9 items-center rounded-lg border border-destructive/40 px-4 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
