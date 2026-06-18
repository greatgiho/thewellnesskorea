"use client"

import { useMemo } from "react"
import type { RegionsForForms } from "@/lib/regions/types"

type ActivityRegionFieldsProps = {
  regions: RegionsForForms
  primaryCode: string
  secondaryCode: string
  onPrimaryChange: (code: string) => void
  onSecondaryChange: (code: string) => void
  labels?: {
    sectionTitle: string
    sectionDescription: string
    primary: string
    secondary: string
    sido: string
    sigungu: string
    secondaryOptional: string
  }
}

const defaultLabels = {
  sectionTitle: "Activity regions",
  sectionDescription:
    "Select your main teaching areas. Priority 1 is required; priority 2 is optional.",
  primary: "Priority 1",
  secondary: "Priority 2",
  sido: "Province / Metro",
  sigungu: "City / District",
  secondaryOptional: "Optional",
}

type RegionPairProps = {
  label: string
  optional?: boolean
  sido: RegionRowLite[]
  sigungu: RegionRowLite[]
  regionCode: string
  onChange: (code: string) => void
  labels: typeof defaultLabels
}

type RegionRowLite = RegionsForForms["sigungu"][number]

function RegionPair({
  label,
  optional = false,
  sido,
  sigungu,
  regionCode,
  onChange,
  labels,
}: RegionPairProps) {
  const selectedSigungu = sigungu.find((row) => row.code === regionCode)
  const selectedSidoCode = selectedSigungu?.parent_code ?? ""
  const filteredSigungu = useMemo(
    () =>
      selectedSidoCode
        ? sigungu.filter((row) => row.parent_code === selectedSidoCode)
        : [],
    [selectedSidoCode, sigungu],
  )

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {optional && (
          <span className="text-xs text-muted-foreground">{labels.secondaryOptional}</span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-xs font-medium text-muted-foreground">{labels.sido}</span>
          <select
            className={fieldClass}
            value={selectedSidoCode}
            onChange={(event) => {
              const nextSido = event.target.value
              if (!nextSido) {
                onChange("")
                return
              }
              const first = sigungu.find((row) => row.parent_code === nextSido)
              onChange(first?.code ?? "")
            }}
          >
            <option value="">Select…</option>
            {sido.map((row) => (
              <option key={row.code} value={row.code}>
                {row.name_ko}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-medium text-muted-foreground">{labels.sigungu}</span>
          <select
            className={fieldClass}
            value={regionCode}
            disabled={!selectedSidoCode}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">Select…</option>
            {filteredSigungu.map((row) => (
              <option key={row.code} value={row.code}>
                {row.name_ko}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

export function ActivityRegionFields({
  regions,
  primaryCode,
  secondaryCode,
  onPrimaryChange,
  onSecondaryChange,
  labels: labelOverrides,
}: ActivityRegionFieldsProps) {
  const labels = { ...defaultLabels, ...labelOverrides }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-xl text-foreground">{labels.sectionTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{labels.sectionDescription}</p>
      </div>
      <RegionPair
        label={labels.primary}
        sido={regions.sido}
        sigungu={regions.sigungu}
        regionCode={primaryCode}
        onChange={onPrimaryChange}
        labels={labels}
      />
      <RegionPair
        label={labels.secondary}
        optional
        sido={regions.sido}
        sigungu={regions.sigungu}
        regionCode={secondaryCode}
        onChange={onSecondaryChange}
        labels={labels}
      />
    </section>
  )
}

export const teacherActivityRegionLabels = {
  sectionTitle: "주요 활동 지역",
  sectionDescription:
    "수업·프로그램을 주로 진행하는 지역을 선택해 주세요. 1순위는 필수, 2순위는 선택입니다.",
  primary: "1순위",
  secondary: "2순위",
  sido: "시·도",
  sigungu: "시·군·구",
  secondaryOptional: "선택",
}
