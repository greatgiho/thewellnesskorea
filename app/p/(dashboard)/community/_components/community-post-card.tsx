import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CommunityPostType } from '@/lib/actions/community-actions';
import { Badge } from '@/components/ui/badge';

interface CommunityPostCardProps {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorBadge?: string; // registration_status를 받아서 배지로 표시
  post_type: CommunityPostType;
  created_at: string;
}

export function CommunityPostCard({
  id,
  title,
  content,
  authorName,
  authorBadge,
  post_type,
  created_at,
}: CommunityPostCardProps) {
  const displayDate = new Date(created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const excerpt = content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'; // HTML 태그 제거 및 요약

  return (
    <Card className="hover:border-primary transition-colors">
      <Link href={`/p/community/${id}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <span className="text-sm text-muted-foreground">{displayDate}</span>
          </div>
          <CardDescription className="flex items-center gap-2">
            <span className="font-semibold">작성자: {authorName}</span>
            {authorBadge && (
              <Badge
                variant={authorBadge === 'admin' ? 'destructive' : 'secondary'}
              >
                {authorBadge === 'admin' ? '관리자' : authorBadge === 'approved' ? '파트너' : authorBadge}
              </Badge>
            )}
            {post_type === 'announcement' && (
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                공지사항
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{excerpt}</p>
        </CardContent>
        <CardFooter className="text-sm text-primary hover:underline">
          자세히 보기
        </CardFooter>
      </Link>
    </Card>
  );
}
