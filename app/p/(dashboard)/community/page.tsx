import { createClient } from '@/lib/supabase/server';
import { canAccessPartnerPortal } from '@/lib/partners/registration-status';
import { getCommunityPosts, CommunityPostType } from '@/lib/actions/community-actions';
import { CommunityPostList } from './_components/community-post-list';
import { CommunityPagination } from './_components/community-pagination';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = {
  title: '파트너 커뮤니티',
  description: '파트너들을 위한 소통 및 공지사항 공간입니다.',
};

interface CommunityPageProps {
  searchParams: Promise<{
    page?: string;
    category?: CommunityPostType;
  }>;
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const category = resolvedSearchParams.category || null;

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
  const { posts, totalPages } = await getCommunityPosts(page, category);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">파트너 커뮤니티</h1>
          <p className="text-sm text-muted-foreground mt-1">
            소식과 공지사항을 확인하고 동료 파트너들과 소통하세요.
          </p>
        </div>
        <Button asChild>
          <Link href="/p/community/new">
            <Plus className="mr-2 h-4 w-4" /> 글쓰기
          </Link>
        </Button>
      </div>

      <CommunityPostList posts={posts} />

      {/* 페이지네이션 컴포넌트 노출 */}
      <div className="pt-4">
        <CommunityPagination currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
