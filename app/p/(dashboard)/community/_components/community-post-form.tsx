'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { toast } from 'sonner';
import { CommunityEditor } from '@/components/community/community-editor'; // JournalEditor 대신 CommunityEditor 임포트
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CommunityPostType, CommunityPostFormInput } from '@/lib/actions/community-actions';

import { FIELD } from '@/lib/ui/field';

interface CommunityPostFormProps {
  postId?: string;
  defaultValues?: Partial<CommunityPostFormInput>;
  action: (formData: FormData) => Promise<{ success: boolean; message?: string; postId?: string }>;
  isAdmin?: boolean;
}

export function CommunityPostForm({
  postId,
  defaultValues = { title: '', content: '', post_type: 'general' },
  action,
  isAdmin = false,
}: CommunityPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(defaultValues.title || '');
  const [content, setContent] = useState(defaultValues.content || '');
  const [postType, setPostType] = useState<CommunityPostType>(defaultValues.post_type || 'general');
  const [error, setError] = useState<string | null>(null);

  // [핵심] 커뮤니티 전용 이미지 업로드 핸들러
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/community/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || '이미지 업로드에 실패했습니다.';
      toast.error('이미지 업로드에 실패했습니다.', { description: errorMessage });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);

    if (!title.trim()) {
      toast.error('제목을 입력해주세요.', { description: '게시글 저장을 위해 제목을 입력해야 합니다.' });
      return;
    }

    if (!content.trim() || content.trim() === '<p></p>') {
      toast.error('본문 내용을 입력해주세요.', { description: '게시글 저장을 위해 본문 내용을 입력해야 합니다.' });
      return;
    }

    startTransition(async () => {
      formData.set('title', title);
      formData.set('content', content);
      formData.set('post_type', postType);

      const result = await action(formData);

      if (result.success) {
        toast.success(postId ? '게시글이 성공적으로 수정되었습니다.' : '새 게시글이 성공적으로 작성되었습니다.');
        router.push(`/p/community/${result.postId || postId}`);
        router.refresh();
      } else {
        setError(result.message || '작업에 실패했습니다.');
        toast.error(result.message || '알 수 없는 오류가 발생했습니다.', { description: '게시글 저장에 실패했습니다.' });
      }
    });
  };

  const fieldClass = FIELD;

  return (
    <form action={handleSubmit} className="mx-auto max-w-3xl space-y-10">
      <section className="space-y-6">
        <h2 className="font-serif text-xl text-foreground">Basics</h2>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Title</span>
          <Input
            id="title"
            name="title"
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Category</span>
            <Select value={postType} onValueChange={(value) => value && setPostType(value as CommunityPostType)} disabled={isPending}>
              <SelectTrigger className={cn("w-full", fieldClass)}>
                <span>
                  {postType === 'general' ? '일반' : postType === 'announcement' ? '공지사항' : '카테고리 선택'}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">일반</SelectItem>
                <SelectItem value="announcement">공지사항</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div></div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-serif text-xl text-foreground">Body</h2>
        <p className="text-xs text-muted-foreground">
          Rich text editor — headings, quotes, lists, links, and inline images.
        </p>
        <CommunityEditor // JournalEditor 대신 CommunityEditor 사용
          content={content}
          onChange={setContent}
          disabled={isPending}
          postId={postId ?? 'new-post'}
          uploadImage={handleImageUpload}
        />
        <input type="hidden" name="content" value={content} />
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button
          type="submit"
          disabled={isPending}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : postId ? (
            <><CheckCircle className="mr-2 h-4 w-4" /> 게시글 수정</>
          ) : (
            <><CheckCircle className="mr-2 h-4 w-4" /> 게시글 작성</>
          )}
        </Button>
        <Link
          href={postId ? `/p/community/${postId}` : '/p/community'}
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
