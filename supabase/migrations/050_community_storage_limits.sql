-- supabase/migrations/050_community_storage_limits.sql

-- community-photos 버킷의 파일 사이즈 제한(5MB = 5242880 바이트) 및 허용 MIME 타입 설정
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'community-photos';
