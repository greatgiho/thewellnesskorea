'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { deleteCommunityPost } from '@/lib/actions/community-mutations';
import { toast } from 'sonner';

interface CommunityDeleteButtonProps {
  postId: string;
}

export function CommunityDeleteButton({ postId }: CommunityDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteCommunityPost(postId);
    setIsDeleting(false);

    if (result.success) {
      toast.success('게시글이 삭제되었습니다.');
      setIsOpen(false);
      router.push('/p/community');
      router.refresh();
    } else {
      toast.error('삭제 실패', { description: result.message });
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsOpen(true)}
        disabled={isDeleting}
      >
        <Trash className="mr-2 h-4 w-4" /> 삭제
      </Button>

      <ConfirmDialog
        open={isOpen}
        title="게시글 삭제"
        description="이 게시글을 삭제하시겠습니까? 삭제된 게시글은 목록에서 숨겨집니다."
        confirmLabel={isDeleting ? "삭제 중..." : "삭제"}
        destructive={true}
        onConfirm={handleDelete}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
