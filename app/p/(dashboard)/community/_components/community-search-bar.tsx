'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

type SearchType = 'title' | 'content' | 'author';

export function CommunitySearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearchType = (searchParams.get('searchType') as SearchType) || 'title';
  const initialSearchQuery = searchParams.get('searchQuery') || '';

  const [searchType, setSearchType] = useState<SearchType>(initialSearchType);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);

  const searchTypeLabels: Record<SearchType, string> = {
    title: '제목',
    content: '내용',
    author: '작성자',
  };

  // URL 변경 시 상태 동기화
  useEffect(() => {
    setSearchType((searchParams.get('searchType') as SearchType) || 'title');
    setSearchQuery(searchParams.get('searchQuery') || '');
  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // 검색 시 1페이지로 리셋
    if (searchQuery.trim()) {
      params.set('searchType', searchType);
      params.set('searchQuery', searchQuery.trim());
    } else {
      params.delete('searchType');
      params.delete('searchQuery');
    }
    router.push(`?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex ml-auto w-full sm:w-fit space-x-2">
      <Select value={searchType} onValueChange={(value: SearchType) => setSearchType(value)}>
        <SelectTrigger className="w-[100px]">
          <SelectValue>{searchTypeLabels[searchType]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title">제목</SelectItem>
          <SelectItem value="content">내용</SelectItem>
          <SelectItem value="author">작성자</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="text"
        placeholder="검색어를 입력하세요..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="w-[200px]"
      />
      <Button onClick={handleSearch} className="w-full sm:w-auto">
        <Search className="mr-2 h-4 w-4" /> 검색
      </Button>
    </div>
  );
}
