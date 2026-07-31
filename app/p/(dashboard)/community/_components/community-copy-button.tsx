'use client';

import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation'; // usePathname 임포트

export function CommunityCopyButton() {
  const pathname = usePathname(); // 클라이언트 측에서 현재 경로 가져오기
  
  const copyToClipboard = () => {
    const fullUrl = `${window.location.origin}${pathname}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('URL이 클립보드에 복사되었습니다.');
  };

  return (
    <Button variant="outline" onClick={copyToClipboard} type="button">
      <Copy className="mr-2 h-4 w-4" /> URL 복사
    </Button>
  );
}
