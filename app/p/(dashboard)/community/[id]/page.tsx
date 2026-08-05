import { getCommunityPostById } from '@/lib/actions/community-actions';
import { createClient } from '@/lib/supabase/server';
import { canAccessPartnerPortal } from '@/lib/partners/registration-status';
import type { PartnerRegistrationStatus } from '@/lib/partners/types';
import { journalBodyToHtml } from '@/lib/journal/body';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CommunityCopyButton } from '../_components/community-copy-button';
import { CommunityDeleteButton } from '../_components/community-delete-button';
import { cn } from '@/lib/utils'; // cn 임포트

interface CommunityPostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: CommunityPostDetailPageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }
  const post = await getCommunityPostById(id);

  if (!post) {
    return { title: '게시글을 찾을 수 없음' };
  }

  return {
    title: post.title,
    description: post.content.substring(0, 100).replace(/<[^>]*>?/gm, ''),
  };
}

export default async function CommunityPostDetailPage({
  params,
}: CommunityPostDetailPageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

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

  const post = await getCommunityPostById(id);

  if (!post) {
    notFound();
  }

  const isAuthor = post.author_id === currentPartner.id;
  const isAdmin = currentPartner.registration_status === 'admin' as PartnerRegistrationStatus;
  const canModify = isAuthor || isAdmin;

  return (
    <div className="space-y-6"> {/* 롤백된 상태의 최상위 div */}
      <div className="flex items-center justify-between">
        <Link
          href="/p/community"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back to List
        </Link>
        <div className="flex space-x-2">
          <CommunityCopyButton />
          {canModify && (
            <Link
              href={`/p/community/${id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "flex items-center gap-2 whitespace-nowrap")}
            >
              <Edit className="mr-1 h-4 w-4" /> Edit
            </Link>
          )}
          {canModify && <CommunityDeleteButton postId={id} className="flex items-center gap-2 whitespace-nowrap" />}
        </div>
      </div>
    
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"> {/* 제목과 공지 뱃지를 위한 flex 컨테이너 */}
            <CardTitle className="font-serif text-3xl font-light text-foreground">{post.title}</CardTitle>
            {post.post_type === 'announcement' && (
              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                공지 {/* Announcement 텍스트를 '공지'로 변경 */}
              </span>
            )}
          </div>
          <CardDescription className="flex items-center justify-end gap-4 text-muted-foreground text-sm mt-2"> {/* 작성자와 작성일을 오른쪽 끝으로 정렬 */}
            <span className="font-semibold">By {post.authorName}</span>
            <span>&bull;</span>
            <span className="text-sm">
              {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="my-4" />
          <div className="journal-body prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: journalBodyToHtml(post.content) }} />
        </CardContent>
      </Card>
    </div>
  );
}
