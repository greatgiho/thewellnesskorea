import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { canAccessPartnerPortal } from '@/lib/partners/registration-status';

export type CommunityPostType = 'announcement' | 'general';

export type CommunityPostFormInput = {
  title: string;
  content: string;
  post_type: CommunityPostType;
  is_published: boolean;
};

async function getPartnerSessionAndCheckAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/p/signin');
  }

  const { data: partner, error } = await supabase
    .from('partners')
    .select('id, user_id, registration_status')
    .eq('user_id', user.id)
    .single();

  if (error || !partner || !canAccessPartnerPortal(partner.registration_status)) {
    redirect('/p/login-restricted');
  }

  return { user, partner };
}

export async function getCommunityPosts(
  page: number = 1,
  category?: CommunityPostType | null, // 카테고리 필터는 UI에서 제거되었으나, 함수 시그니처는 유지
  searchType?: string,
  searchQuery?: string,
) {
  await getPartnerSessionAndCheckAccess();

  const supabase = await createClient();
  const itemsPerPage = 10;
  const offset = (page - 1) * itemsPerPage;

  let query = supabase
    .from('community_posts')
    .select('*, partners(name_ko, name_en, photo_path, registration_status)', { count: 'exact' })
    .is('deleted_at', null);

  // 카테고리 필터 (UI에서 제거되었으므로, 현재는 사용되지 않음)
  if (category) {
    query = query.eq('post_type', category);
  }

  // 검색 조건 추가
  if (searchType && searchQuery) {
    const searchTerm = `%${searchQuery.toLowerCase()}%`;
    if (searchType === 'title') {
      query = query.ilike('title', searchTerm);
    } else if (searchType === 'content') {
      query = query.ilike('content', searchTerm);
    } else if (searchType === 'author') {
      // 작성자 검색은 새로 생성한 search_partners_by_name RPC 함수를 통해 처리
      const { data: partnerIds, error: rpcError } = await supabase.rpc('search_partners_by_name', { search_term: searchQuery });

      if (rpcError) {
        console.error('Error searching partners by name:', rpcError.message);
        // RPC 호출 실패 시 빈 결과 반환 또는 에러 처리
        query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // 존재하지 않는 ID로 강제 필터링
      } else if (partnerIds && partnerIds.length > 0) {
        query = query.in('author_id', partnerIds);
      } else {
        // 검색 결과 파트너가 없을 경우 빈 목록 반환
        query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // 존재하지 않는 ID로 강제 필터링
      }
    }
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + itemsPerPage - 1);

  if (error) {
    console.error('Error fetching community posts:', error.message);
    throw new Error('Failed to fetch community posts.');
  }

  const posts = data.map(post => ({
    ...post,
    authorName: post.partners?.name_ko || post.partners?.name_en || 'Unknown',
    authorBadge: post.partners?.registration_status,
  }));

  return {
    posts,
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / itemsPerPage),
  };
}

export async function getCommunityPostById(id: string) {
  await getPartnerSessionAndCheckAccess();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('community_posts')
    .select('*, partners(id, name_ko, name_en, registration_status, user_id)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    notFound();
  }

  return {
    ...data,
    authorName: data.partners?.name_ko || data.partners?.name_en || 'Unknown',
  };
}
