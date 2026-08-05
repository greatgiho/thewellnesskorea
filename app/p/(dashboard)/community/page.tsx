import { createClient } from '@/lib/supabase/server';
import { canAccessPartnerPortal } from '@/lib/partners/registration-status';
import { getCommunityPosts, CommunityPostType } from '@/lib/actions/community-actions';
import { CommunityPostList } from './_components/community-post-list';
import { CommunityPagination } from './_components/community-pagination';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CommunitySearchBar } from './_components/community-search-bar';

export const metadata = {
  title: '파트너 커뮤니티',
  description: '파트너들을 위한 소통 및 공지사항 공간입니다.',
};

interface CommunityPageProps {
  searchParams: {
    page?: string;
    category?: CommunityPostType;
    searchType?: string;
    searchQuery?: string;
  };
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  // const category = resolvedSearchParams.category || null; // 카테고리 필터 제거
  const searchType = resolvedSearchParams.searchType || undefined;
  const searchQuery = resolvedSearchParams.searchQuery || undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/p/signin');
  }

  const { data: currentPartner } = await supabase
    .from('partners')
    .select('id, registration_status')
    .eq('user_id', user.id)
    .single();

  if (!currentPartner || !canAccessPartnerPortal(currentPartner.registration_status)) {
    redirect('/p/login-restricted');
  }

  // 서버 액션을 통한 페이지네이션 데이터 조회
  const { posts, totalPages, totalCount } = await getCommunityPosts(page, undefined, searchType, searchQuery);

  return (
    <div className="flex flex-col space-y-6 pt-6 pb-12">
      {/* 헤더 영역 - /a/journal 페이지 참고 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mt-2 font-serif text-3xl text-foreground">파트너 커뮤니티</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            소식과 공지사항을 확인하고 동료 파트너들과 소통하세요.
          </p>
        </div>
        <Link href="/p/community/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> <span>새 게시글</span>
          </Button>
        </Link>
      </div>


      {/* 검색 바 영역 */}
      <CommunitySearchBar />

      {/* 게시글 목록 */}
      <CommunityPostList posts={posts} currentPage={page} itemsPerPage={10} totalCount={totalCount} />

      {/* 페이지네이션 컴포넌트 */}
      <div className="pt-4">
        <CommunityPagination currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
