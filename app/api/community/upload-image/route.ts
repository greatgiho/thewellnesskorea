// app/api/community/upload-image/route.ts

import { uploadCommunityPhoto, getCommunityPhotoUrl } from '@/lib/community/images';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getViewAs } from '@/lib/view-as-server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized: 로그인 상태가 아닙니다.' }, { status: 401 });
    }

    const role = user.app_metadata?.role;
    let partnerId: string;

    if (role === 'admin') {
      const viewAs = await getViewAs();
      if (viewAs?.kind === 'partner') {
        partnerId = viewAs.id;
      } else {
        return NextResponse.json({ message: 'Forbidden: 관리자는 파트너 view-as 상태에서만 업로드 가능합니다.' }, { status: 403 });
      }
    } else if (role === 'partner') {
      const { data: partnerProfile, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (partnerError || !partnerProfile) {
        return NextResponse.json({ message: 'Forbidden: 유효한 파트너 프로필을 찾을 수 없습니다.' }, { status: 403 });
      }

      partnerId = partnerProfile.id;
    } else {
      return NextResponse.json({ message: 'Forbidden: 파트너 권한이 없습니다.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'Bad Request: 파일이 첨부되지 않았습니다.' }, { status: 400 });
    }

    // 🚨 백엔드 가드: 파일 용량 검증 (5MB 초과 차단)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Bad Request: 파일 크기는 5MB를 초과할 수 없습니다.' }, { status: 400 });
    }

    // 🚨 백엔드 가드: 파일 형식 검증 (이미지 외 차단)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Bad Request: JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.' }, { status: 400 });
    }

    const uploadResult = await uploadCommunityPhoto(partnerId, file);

    if ('error' in uploadResult) {
      return NextResponse.json({ message: uploadResult.error }, { status: 500 });
    }

    const imageUrl = await getCommunityPhotoUrl(uploadResult.path);
    return NextResponse.json({ url: imageUrl });

  } catch (error) {
    console.error('[upload-image API Error]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
