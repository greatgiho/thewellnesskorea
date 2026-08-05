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
  /** Layout classes from the caller; the destructive variant is set here. */
  className?: string;
}

export function CommunityDeleteButton({ postId, className }: CommunityDeleteButtonProps) {
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
        className={className}
        onClick={() => setIsOpen(true)}
        disabled={isDeleting}
      >
        <Trash className="mr-2 h-4 w-4" /> Delete
      </Button>

      <ConfirmDialog
        open={isOpen}
        title="Delete Post"
        description="Are you sure you want to delete this post? Deleted posts will be hidden from the list."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        destructive={true}
        onConfirm={handleDelete}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
