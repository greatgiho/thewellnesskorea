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
  category?: CommunityPostType | null,
) {
  await getPartnerSessionAndCheckAccess();

  const supabase = await createClient();
  const itemsPerPage = 10;
  const offset = (page - 1) * itemsPerPage;

  let query = supabase
    .from('community_posts')
    .select('*, partners(name_ko, name_en, photo_path, registration_status)', { count: 'exact' })
    .is('deleted_at', null); // is_published 조건 제거, 소프트 딜리트 조건만 적용

  if (category) {
    query = query.eq('post_type', category);
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
    .is('deleted_at', null) // is_published 조건 제거, 소프트 딜리트 조건만 적용
    .single();

  if (error || !data) {
    notFound();
  }

  return {
    ...data,
    authorName: data.partners?.name_ko || data.partners?.name_en || 'Unknown',
  };
}
