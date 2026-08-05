'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { JournalEditor } from '@/components/admin/journal-editor';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CommunityPostType, CommunityPostFormInput } from '@/lib/actions/community-actions';

import { FIELD } from '@/lib/ui/field';

interface CommunityPostFormProps {
  postId?: string;
  defaultValues?: Partial<CommunityPostFormInput>;
  action: (formData: FormData) => Promise<{ success: boolean; message?: string; postId?: string }>;
  isAdmin: boolean;
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

  const handleSubmit = async (formData: FormData) => {
    setError(null);

    // 제목 유효성 검사
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.', { description: '게시글 저장을 위해 제목을 입력해야 합니다.' });
      return;
    }

    // 본문 유효성 검사 추가
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
            {/* Select reports null when a selection is cleared; keep the last one. */}
            <Select value={postType} onValueChange={(value) => value && setPostType(value)} disabled={isPending}>
              <SelectTrigger className={cn("w-full", fieldClass)}> {/* SelectTrigger의 children으로 선택된 텍스트 표시 */}
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
          <div>{/* Dummy for second column if needed to match JournalForm's layout, otherwise omit */}</div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-serif text-xl text-foreground">Body</h2>
        <p className="text-xs text-muted-foreground">
          Rich text editor — headings, quotes, lists, links, and inline images.
        </p>
        <JournalEditor
          content={content}
          onChange={setContent}
          disabled={isPending}
          postId={postId ?? 'new-post'}
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
