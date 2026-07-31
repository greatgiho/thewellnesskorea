import { CommunityPostCard } from './community-post-card';

interface CommunityPostListProps {
  posts: {
    id: string;
    title: string;
    content: string;
    author_id: string; // author_id는 내부적으로 사용
    authorName: string;
    authorBadge?: string;
    post_type: 'announcement' | 'general';
    created_at: string;
    updated_at: string;
    is_published: boolean;
  }[];
}

export function CommunityPostList({ posts }: CommunityPostListProps) {
  return (
    <div className="grid gap-4">
      {posts.map((post) => (
        <CommunityPostCard
          key={post.id}
          id={post.id}
          title={post.title}
          content={post.content}
          authorName={post.authorName}
          authorBadge={post.authorBadge}
          post_type={post.post_type}
          created_at={post.created_at}
        />
      ))}
    </div>
  );
}
