'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { canAccessPartnerPortal } from '@/lib/partners/registration-status';
import type { PartnerRegistrationStatus } from '@/lib/partners/types';
import { CommunityPostFormInput, CommunityPostType } from './community-actions';

// RLS 정책을 위한 파트너 세션 유틸리티
async function getPartnerSessionAndCheckAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: partner, error } = await supabase
    .from('partners')
    .select('id, user_id, registration_status')
    .eq('user_id', user.id)
    .single();

  if (error || !partner || !canAccessPartnerPortal(partner.registration_status)) {
    throw new Error('Forbidden');
  }

  return { user, partner };
}

// 유효성 검증 함수
function validateCommunityPostInput(input: CommunityPostFormInput) {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Title cannot be empty.');
  }
  if (!input.content || input.content.trim().length === 0) {
    throw new Error('Content cannot be empty.');
  }
  if (!['announcement', 'general'].includes(input.post_type)) {
    throw new Error('Invalid post type.');
  }
}

/**
 * 새로운 커뮤니티 게시글을 생성합니다.
 */
export async function createCommunityPost(formData: FormData) {
  let partner;
  try {
    const session = await getPartnerSessionAndCheckAccess();
    partner = session.partner;
  } catch (e: any) {
    return { success: false, message: e.message };
  }

  const input: CommunityPostFormInput = {
    title: formData.get('title')?.toString() || '',
    content: formData.get('content')?.toString() || '',
    post_type: formData.get('post_type')?.toString() as CommunityPostType || 'general',
    is_published: true,
  };

  try {
    validateCommunityPostInput(input);
  } catch (error: any) {
    return { success: false, message: error.message };
  }

  const supabase = await createClient();

  // 인서트 후 생성된 행의 id를 리턴받도록 .select('id') 추가
  const { data: insertedPost, error: insertError } = await supabase
    .from('community_posts')
    .insert({
      title: input.title,
      content: input.content,
      post_type: input.post_type,
      is_published: true,
      author_id: partner.id,
    })
    .select('id')
    .single();

  if (insertError || !insertedPost) {
    console.error('Error creating community post:', insertError?.message);
    return { success: false, message: `게시글 저장에 실패했습니다: ${insertError?.message}` };
  }

  revalidatePath('/p/community');
  return { success: true, postId: insertedPost.id };
}

/**
 * 기존 커뮤니티 게시글을 수정합니다.
 */
export async function updateCommunityPost(id: string, formData: FormData) {
  let partner;
  try {
    const session = await getPartnerSessionAndCheckAccess();
    partner = session.partner;
  } catch (e: any) {
    return { success: false, message: e.message };
  }

  const input: CommunityPostFormInput = {
    title: formData.get('title')?.toString() || '',
    content: formData.get('content')?.toString() || '',
    post_type: formData.get('post_type')?.toString() as CommunityPostType || 'general',
    is_published: formData.get('is_published') === 'true',
  };

  try {
    validateCommunityPostInput(input);
  } catch (error: any) {
    return { success: false, message: error.message };
  }

  const supabase = await createClient();

  const { data: existingPost, error: fetchError } = await supabase
    .from('community_posts')
    .select('author_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingPost) {
    return { success: false, message: 'Post not found or unauthorized.' };
  }

  const isAuthor = existingPost.author_id === partner.id;
  const isAdmin = partner.registration_status === 'admin' as PartnerRegistrationStatus;

  if (!isAuthor && !isAdmin) {
    return { success: false, message: 'Unauthorized to update this post.' };
  }

  const { error } = await supabase
    .from('community_posts')
    .update({
      title: input.title,
      content: input.content,
      post_type: input.post_type,
      is_published: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating community post:', error.message);
    return { success: false, message: `게시글 수정에 실패했습니다: ${error.message}` };
  }

  revalidatePath('/p/community');
  revalidatePath(`/p/community/${id}`);
  return { success: true, postId: id };
}

/**
 * 커뮤니티 게시글을 논리 삭제(Soft Delete)합니다.
 */
export async function deleteCommunityPost(id: string) {
  let partner;
  try {
    const session = await getPartnerSessionAndCheckAccess();
    partner = session.partner;
  } catch (e: any) {
    return { success: false, message: e.message };
  }

  const supabase = await createClient();

  const { data: existingPost, error: fetchError } = await supabase
    .from('community_posts')
    .select('author_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingPost) {
    return { success: false, message: 'Post not found or unauthorized.' };
  }

  const isAuthor = existingPost.author_id === partner.id;
  const isAdmin = partner.registration_status === 'admin' as PartnerRegistrationStatus;

  if (!isAuthor && !isAdmin) {
    return { success: false, message: 'Unauthorized to delete this post.' };
  }

  const { error } = await supabase
    .from('community_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting community post:', error.message);
    return { success: false, message: 'Failed to delete post.' };
  }

  revalidatePath('/p/community');
  return { success: true };
}
