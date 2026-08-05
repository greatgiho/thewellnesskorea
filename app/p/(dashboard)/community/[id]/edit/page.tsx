import { getCommunityPostById } from '@/lib/actions/community-actions';
import { updateCommunityPost } from '@/lib/actions/community-mutations';
import { createClient } from '@/lib/supabase/server';
import { canAccessPartnerPortal } from '@/lib/partners/registration-status';
import type { PartnerRegistrationStatus } from '@/lib/partners/types';
import { CommunityPostForm } from '../../_components/community-post-form';
import { notFound, redirect } from 'next/navigation';

interface CommunityPostEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: CommunityPostEditPageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }
  const post = await getCommunityPostById(id);

  if (!post) {
    return { title: '게시글을 찾을 수 없음' };
  }

  return {
    title: `수정: ${post.title}`,
    description: '커뮤니티 게시글을 수정합니다.',
  };
}

export default async function CommunityPostEditPage({
  params,
}: CommunityPostEditPageProps) {
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

  const isAuthor = post.author_id === currentPartner.id;
  const isAdmin = currentPartner.registration_status === 'admin' as PartnerRegistrationStatus;

  if (!isAuthor && !isAdmin) {
    redirect(`/p/community/${id}`);
  }

  const handleUpdate = async (formData: FormData) => {
    'use server';
    return await updateCommunityPost(id, formData);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      <CommunityPostForm
        postId={id}
        isAdmin={isAdmin}
        defaultValues={{
          title: post.title,
          content: post.content,
          post_type: post.post_type,
          is_published: post.is_published,
        }}
        action={handleUpdate}
      />
    </div>
  );
}
