import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CommunityPostType } from '@/lib/actions/community-actions';

interface CommunityPostListProps {
  posts: {
    id: string;
    title: string;
    authorName: string;
    authorBadge?: string; // registration_status
    post_type: CommunityPostType;
    created_at: string;
  }[];
  currentPage: number;
  itemsPerPage: number;
  totalCount: number; // totalCount 추가
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function CommunityPostList({ posts, currentPage, itemsPerPage, totalCount }: CommunityPostListProps) {
  if (!posts || posts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        게시글이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium w-[5%]">No.</th>
            <th className="px-4 py-3 font-medium w-[65%]">제목</th>
            <th className="px-4 py-3 font-medium text-right w-[15%]">작성자</th>
            <th className="px-4 py-3 font-medium text-right w-[15%]">작성일</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => (
            <tr key={post.id} className="border-b border-border last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 w-[5%]">
                {totalCount - ((currentPage - 1) * itemsPerPage + index)}
              </td>
              <td className="px-4 py-3 font-medium text-foreground w-[65%]">
                <Link href={`/p/community/${post.id}`} className="hover:underline flex items-center gap-2">
                  {post.post_type === 'announcement' && (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      공지
                    </Badge>
                  )}
                  {post.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground w-[15%]">
                {post.authorName}{' '}
                {post.authorBadge && (
                  <Badge
                    variant={post.authorBadge === 'admin' ? 'destructive' : 'default'}
                    className={post.authorBadge === 'approved' ? 'ml-1 bg-blue-500 text-white hover:bg-blue-500' : 'ml-1'}
                  >
                    {post.authorBadge === 'admin' ? 'A' : post.authorBadge === 'approved' ? 'P' : post.authorBadge}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground w-[15%]">
                {formatDate(post.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
