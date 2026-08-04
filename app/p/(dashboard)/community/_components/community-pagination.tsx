'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface CommunityPaginationProps {
  currentPage: number;
  totalPages: number;
}

// 페이지 번호 배열을 생성하는 헬퍼 함수
const generatePageNumbers = (currentPage: number, totalPages: number) => {
  const pagesToShow = 5; // 현재 페이지를 중심으로 보여줄 페이지 번호 개수
  const pageNumbers: (number | 'ellipsis')[] = [];

  if (totalPages <= pagesToShow + 2) { // 총 페이지가 적을 경우 모두 표시
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    const startPage = Math.max(2, currentPage - Math.floor(pagesToShow / 2));
    const endPage = Math.min(totalPages - 1, currentPage + Math.floor(pagesToShow / 2));

    pageNumbers.push(1); // 항상 첫 페이지
    if (startPage > 2) {
      pageNumbers.push('ellipsis'); // ...
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    if (endPage < totalPages - 1) {
      pageNumbers.push('ellipsis'); // ...
    }
    pageNumbers.push(totalPages); // 항상 마지막 페이지
  }
  return pageNumbers;
};

export function CommunityPagination({ currentPage, totalPages }: CommunityPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null; // 총 페이지가 1개 이하면 페이지네이션 표시 안 함
  }

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={createPageURL(currentPage - 1)}
            aria-disabled={currentPage <= 1}
            onClick={(e) => {
              if (currentPage <= 1) e.preventDefault();
            }}
          />
        </PaginationItem>

        {pageNumbers.map((pageNumber, index) => (
          <PaginationItem key={index}>
            {pageNumber === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href={createPageURL(pageNumber as number)}
                active={pageNumber === currentPage ? "true" : "false"}
              >
                {pageNumber}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href={createPageURL(currentPage + 1)}
            aria-disabled={currentPage >= totalPages}
            onClick={(e) => {
              if (currentPage >= totalPages) e.preventDefault();
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
