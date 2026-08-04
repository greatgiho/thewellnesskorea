import { canAccessPartnerPortal } from '@/lib/partners/registration-status';
import Link from 'next/link';
import { CommunityPostForm } from '../_components/community-post-form';
import { createCommunityPost } from '@/lib/actions/community-mutations';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'New Community Post',
  description: 'Create a new community post.',
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
    <div className="space-y-8 py-6">
      <div className="max-w-3xl px-6 lg:px-0"> {/* New Post 페이지의 최대 너비와 왼쪽 정렬을 위한 div 추가 (JournalForm과 유사하게) */}
        <div className="flex flex-col items-start">
          <Link
            href="/p/community"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Community
          </Link>
          <h1 className="font-serif text-3xl font-light text-foreground">
            New Post
          </h1>
        </div>
      </div>
      <CommunityPostForm
        action={createCommunityPost}
        isAdmin={isAdmin}
      />
    </div>
  );
}
