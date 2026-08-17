import type { Dispatch, SetStateAction } from "react"
import type { SessionFormInput } from "@/lib/schedule/types"

/**
 * What every field group in the session dialog needs.
 *
 * The whole form edits one object, so each group takes the object and the
 * setter rather than a prop per field. Threading twenty individual values and
 * twenty callbacks through would be the same coupling written out longhand.
 */
export type SessionFieldsProps = {
  input: SessionFormInput
  setInput: Dispatch<SetStateAction<SessionFormInput>>
  /** Shared input styling, passed down so the dialog owns the look. */
  fieldClass: string
}
