"use client"

import type { SessionFieldsProps } from "@/components/admin/session-form/fields"

/**
 * Who can find the class.
 *
 * Directly under the publish toggle, because the two answer one question
 * together: published decides whether the class exists to the public at all,
 * listed decides whether it is advertised or only reachable by link (060).
 * It used to sit between the payment method and the child price, where it read
 * as a pricing option and was easy to miss.
 *
 * Still inside the disabled fieldset rather than up in the status panel. That
 * panel stays live while viewing so a session can be confirmed without
 * entering edit mode, and hiding a class from the schedule is an edit.
 */
export function VisibilityFields({ input, setInput }: SessionFieldsProps) {
  return (
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
        <span className="block text-sm font-medium">목록에 숨기기 (스텔스)</span>
        <span className="block text-xs text-muted-foreground">
          홈·강사 페이지·일정에 나오지 않고, 링크를 아는 사람만 예약할 수
          있습니다. 비공개 수업이나 결제 테스트에 쓰세요.
        </span>
      </span>
    </label>
  )
}
