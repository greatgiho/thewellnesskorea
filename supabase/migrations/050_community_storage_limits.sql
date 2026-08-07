-- supabase/migrations/050_community_storage_limits.sql

-- 1. community-photos 버킷 설정: 5MB 제한, 허용된 MIME 타입, public 서빙 활성화
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
  public = true
WHERE id = 'community-photos';

-- 2. 기존 인증된 사용자 전용 읽기 정책 제거 후 퍼블릭 읽기 정책 적용
DROP POLICY IF EXISTS "Authenticated users can read community photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read community photos" ON storage.objects;

CREATE POLICY "Public read community photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-photos');

-- 3. 업로드(INSERT) 및 삭제(DELETE) 정책은 기존과 동일하게 인증된 승인 파트너만 가능하도록 유지
-- (이미 생성된 INSERT/DELETE 정책이 있다면 유지되며, 필요 시 아래와 같이 명시)
