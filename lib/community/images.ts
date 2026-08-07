// lib/community/images.ts

import { createClient } from '@/lib/supabase/server';

export const COMMUNITY_PHOTOS_BUCKET = 'community-photos';

export async function getCommunityPhotoUrl(path: string): Promise<string> {
  if (!path) return '';
  const supabase = await createClient();
  const { data } = supabase.storage.from(COMMUNITY_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function communityStoragePath(partnerId: string, file: File): string {
  const ext = extFromMime(file.type);
  // 외부 패키지(uuid) 대신 네이티브 Web Crypto API 사용
  return `${partnerId}/${crypto.randomUUID()}.${ext}`;
}

export async function uploadCommunityPhoto(
  partnerId: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  // 버그 픽스: createClient는 비동기 함수이므로 반드시 await 처리해야 함
  const supabase = await createClient();
  const path = communityStoragePath(partnerId, file);

  const { error } = await supabase.storage.from(COMMUNITY_PHOTOS_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    console.error('Error uploading community photo:', error);
    return { error: error.message };
  }
  return { path };
}

function extFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}
