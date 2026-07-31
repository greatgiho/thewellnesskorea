import { getCommunityPostById } from '@/lib/actions/community-actions';
import { createClient } from '@/lib/supabase/server';
import { canAccessPartnerPortal, PartnerRegistrationStatus } from '@/lib/partners/registration-status';
import { journalBodyToHtml } from '@/lib/journal/body';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CommunityCopyButton } from '../_components/community-copy-button';
import { CommunityDeleteButton } from '../_components/community-delete-button';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/p/community">
            <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로 돌아가기
          </Link>
        </Button>
        <div className="flex space-x-2">
          <CommunityCopyButton />
          {canModify && (
            <Button asChild>
              <Link href={`/p/community/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> 수정
              </Link>
            </Button>
          )}
          {canModify && <CommunityDeleteButton postId={id} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{post.title}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <CardDescription className="flex items-center gap-2">
            <span className="font-semibold">작성자: {post.authorName}</span>
            {post.post_type === 'announcement' && (
              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                공지사항
              </span>
            )}
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
