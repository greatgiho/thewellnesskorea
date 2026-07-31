'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CommunityPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function CommunityPagination({ currentPage, totalPages }: CommunityPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  const handlePageChange = (newPage: number) => {
    router.push(createPageURL(newPage));
  };

  // 기존에 있던 if (totalPages <= 1) return null; 로직 삭제 완료
  // 데이터가 없거나 1페이지뿐일 때도 항상 렌더링되도록 보장 (0페이지일 경우 최소 1페이지로 표시되도록 UI 보정 가능하나 현재는 받은 totalPages를 그대로 신뢰함)

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm font-medium">
        페이지 {currentPage} / {Math.max(1, totalPages)}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || totalPages === 0}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
