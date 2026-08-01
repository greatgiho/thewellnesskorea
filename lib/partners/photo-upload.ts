import { extFromMime, photoStoragePath } from "./utils"
import {
  uploadImage,
  validateImageFile,
  type ImageValidationMessages,
} from "@/lib/ui/photo-upload"

export type PersonPhotoValidationMessages = ImageValidationMessages

export function validatePersonPhotoFile(
  file: File,
  messages: PersonPhotoValidationMessages,
): string | null {
  return validateImageFile(file, messages)
}

export async function uploadPersonPhoto(
  personId: string,
  photo: File,
): Promise<string> {
  // upsert: a partner has one photo, and replacing it reuses the same path.
  return uploadImage({
    bucket: "person-photos",
    path: photoStoragePath(personId, extFromMime(photo.type)),
    file: photo,
    upsert: true,
  })
}
