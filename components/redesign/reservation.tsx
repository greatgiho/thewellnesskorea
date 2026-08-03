"use client"

import type React from "react"
import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { useLang } from "@/components/redesign/language-provider"

const PROGRAMS = [
  { en: "Meditation Journey", ko: "명상 여정" },
  { en: "Grounding & Walking", ko: "머무르기 & 걷기" },
  { en: "Sound Bath & Tea", ko: "사운드 배스 & 차명상" },
]
const GUEST_OPTIONS = ["1", "2", "3", "4", "5+"]

type FormState = {
  name: string
  email: string
  program: number
  date: string
  time: string
  guests: string
  notes: string
}

const EMPTY: FormState = {
  name: "",
  email: "",
  program: 0,
  date: "",
  time: "",
  guests: "1",
  notes: "",
}

const T = {
  en: {
    eyebrow: "Reserve",
    heading: "Reserve your quiet hour",
    intro:
      "Booking is simple. Choose a program and a time that suits you, and we'll hold your place. You'll receive a warm confirmation at your email.",
    whereLabel: "Where",
    whereValue: "Brickwell, Tongui-dong, Seochon, Seoul",
    hoursLabel: "Hours",
    hoursValue: "Wed – Sun · 8:00 AM – 8:00 PM",
    contactLabel: "Contact",
    contactValue: "hello@thewellnesskorea.com",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@email.com",
    program: "Program",
    date: "Date",
    time: "Time",
    guests: "Guests",
    notes: "Anything we should know?",
    optional: "(optional)",
    notesPlaceholder: "Accessibility needs, first visit, questions…",
    submit: "Confirm reservation",
    submitting: "Holding your place…",
    errName: "Please tell us your name.",
    errEmail: "Enter a valid email.",
    errDate: "Choose a date.",
    errTime: "Choose a time.",
    bookedTitle: (name: string) => `You're booked, ${name}`,
    confirmBody: (program: string, guests: string, date: string, time: string, email: string) => (
      <>
        We&apos;ve reserved <span className="text-foreground">{program}</span> for {guests} on{" "}
        <span className="text-foreground">{date}</span> at <span className="text-foreground">{time}</span>. A
        confirmation is on its way to {email}.
      </>
    ),
    again: "Make another reservation",
  },
  ko: {
    eyebrow: "예약",
    heading: "당신의 고요한 한 시간을 예약하세요",
    intro:
      "예약은 간단합니다. 원하는 프로그램과 시간을 고르면 자리를 잡아 둡니다. 따뜻한 확인 안내를 이메일로 보내 드립니다.",
    whereLabel: "장소",
    whereValue: "브릭웰, 통의동, 서촌, 서울",
    hoursLabel: "운영 시간",
    hoursValue: "수 – 일 · 오전 8:00 – 오후 8:00",
    contactLabel: "연락처",
    contactValue: "hello@thewellnesskorea.com",
    name: "이름",
    namePlaceholder: "성함을 알려 주세요",
    email: "이메일",
    emailPlaceholder: "you@email.com",
    program: "프로그램",
    date: "날짜",
    time: "시간",
    guests: "인원",
    notes: "미리 알려 주실 것이 있나요?",
    optional: "(선택)",
    notesPlaceholder: "편의 사항, 첫 방문 여부, 궁금한 점…",
    submit: "예약 확정하기",
    submitting: "자리를 잡아 두는 중…",
    errName: "성함을 알려 주세요.",
    errEmail: "올바른 이메일을 입력해 주세요.",
    errDate: "날짜를 선택해 주세요.",
    errTime: "시간을 선택해 주세요.",
    bookedTitle: (name: string) => `${name}님, 예약되었습니다`,
    confirmBody: (program: string, guests: string, date: string, time: string, email: string) => (
      <>
        <span className="text-foreground">{program}</span> · {guests}명 · <span className="text-foreground">{date}</span>{" "}
        <span className="text-foreground">{time}</span>로 예약해 두었습니다. 확인 안내가 {email}(으)로 곧
        도착합니다.
      </>
    ),
    again: "다시 예약하기",
  },
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

export function Reservation() {
  const { lang } = useLang()
  const t = T[lang]
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [status, setStatus] = useState<"idle" | "submitting" | "confirmed">("idle")

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = key === "program" ? Number(e.target.value) : e.target.value
      setForm((f) => ({ ...f, [key]: value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = t.errName
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t.errEmail
    if (!form.date) next.date = t.errDate
    if (!form.time) next.time = t.errTime
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setStatus("submitting")
    // Simulate a gentle confirmation.
    setTimeout(() => setStatus("confirmed"), 900)
  }

  const reset = () => {
    setForm(EMPTY)
    setErrors({})
    setStatus("idle")
  }

  return (
    <section id="reserve" className="scroll-mt-20 bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">{t.eyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl">
              {t.heading}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{t.intro}</p>
            <dl className="mt-8 space-y-4 text-sm">
              <div>
                <dt className="text-[var(--sage)]">{t.whereLabel}</dt>
                <dd className="mt-1 text-foreground">{t.whereValue}</dd>
              </div>
              <div>
                <dt className="text-[var(--sage)]">{t.hoursLabel}</dt>
                <dd className="mt-1 text-foreground">{t.hoursValue}</dd>
              </div>
              <div>
                <dt className="text-[var(--sage)]">{t.contactLabel}</dt>
                <dd className="mt-1 text-foreground">{t.contactValue}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            {status === "confirmed" ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sage)]/15">
                  <Check className="h-7 w-7 text-[var(--sage)]" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-serif text-2xl text-foreground">
                  {t.bookedTitle(form.name.split(" ")[0])}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t.confirmBody(
                    PROGRAMS[form.program][lang],
                    form.guests,
                    form.date,
                    form.time,
                    form.email,
                  )}
                </p>
                <button
                  onClick={reset}
                  className="mt-7 rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  {t.again}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm text-foreground">
                    {t.name}
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={update("name")}
                    placeholder={t.namePlaceholder}
                    className={inputClass}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm text-foreground">
                    {t.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder={t.emailPlaceholder}
                    className={inputClass}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="program" className="mb-1.5 block text-sm text-foreground">
                    {t.program}
                  </label>
                  <select id="program" value={form.program} onChange={update("program")} className={inputClass}>
                    {PROGRAMS.map((p, i) => (
                      <option key={p.en} value={i}>
                        {p[lang]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="mb-1.5 block text-sm text-foreground">
                      {t.date}
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={update("date")}
                      className={inputClass}
                      aria-invalid={!!errors.date}
                    />
                    {errors.date && <p className="mt-1.5 text-xs text-destructive">{errors.date}</p>}
                  </div>
                  <div>
                    <label htmlFor="time" className="mb-1.5 block text-sm text-foreground">
                      {t.time}
                    </label>
                    <input
                      id="time"
                      type="time"
                      value={form.time}
                      onChange={update("time")}
                      className={inputClass}
                      aria-invalid={!!errors.time}
                    />
                    {errors.time && <p className="mt-1.5 text-xs text-destructive">{errors.time}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="guests" className="mb-1.5 block text-sm text-foreground">
                    {t.guests}
                  </label>
                  <select id="guests" value={form.guests} onChange={update("guests")} className={inputClass}>
                    {GUEST_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="mb-1.5 block text-sm text-foreground">
                    {t.notes} <span className="text-muted-foreground">{t.optional}</span>
                  </label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={update("notes")}
                    rows={3}
                    placeholder={t.notesPlaceholder}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {t.submitting}
                    </>
                  ) : (
                    t.submit
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
