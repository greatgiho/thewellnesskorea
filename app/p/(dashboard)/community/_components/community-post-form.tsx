'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { JournalEditor } from '@/components/admin/journal-editor';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CommunityPostType, CommunityPostFormInput } from '@/lib/actions/community-actions';

interface CommunityPostFormProps {
  postId?: string;
  defaultValues?: Partial<CommunityPostFormInput>;
  action: (formData: FormData) => Promise<{ success: boolean; message?: string; postId?: string }>;
}

export function CommunityPostForm({
  postId,
  defaultValues = { title: '', content: '', post_type: 'general' },
  action,
}: CommunityPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(defaultValues.title || '');
  const [content, setContent] = useState(defaultValues.content || '');
  const [postType, setPostType] = useState<CommunityPostType>(defaultValues.post_type || 'general');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);

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

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{postId ? '게시글 수정' : '새 게시글 작성'}</h2>
        <Button variant="outline" asChild>
          <Link href={postId ? `/p/community/${postId}` : '/p/community'}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {postId ? '취소' : '목록으로'}
          </Link>
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid gap-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="post_type">카테고리</Label>
        <Select value={postType} onValueChange={(value: CommunityPostType) => setPostType(value)} disabled={isPending}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">일반글</SelectItem>
            <SelectItem value="announcement">공지사항</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="content">본문</Label>
        <JournalEditor
          content={content}
          onChange={setContent}
          disabled={isPending}
          postId={postId ?? 'new-post'}
        />
        <input type="hidden" name="content" value={content} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 저장 중...</>
        ) : postId ? (
          <><CheckCircle className="mr-2 h-4 w-4" /> 게시글 수정</>
        ) : (
          <><CheckCircle className="mr-2 h-4 w-4" /> 게시글 작성</>
        )}
      </Button>
    </form>
  );
}
