import { canAccessPartnerPortal } from '@/lib/partners/registration-status';
import { CommunityPostForm } from '../_components/community-post-form';
import { createCommunityPost } from '@/lib/actions/community-mutations';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: '새 게시글 작성',
  description: '새로운 커뮤니티 게시글을 작성합니다.',
};

export default async function NewCommunityPostPage() {
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

  const isAdmin = currentPartner.registration_status === 'admin';

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      <CommunityPostForm
        action={createCommunityPost}
        isAdmin={isAdmin}
      />
    </div>
  );
}
