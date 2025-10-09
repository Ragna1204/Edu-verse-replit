import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/types';

interface CreatePostFormProps {
  onSubmit: (content: string, tags: string[]) => void;
  isLoading: boolean;
}

function CreatePostForm({ onSubmit, isLoading }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content, tags);
    setContent('');
    setTags([]);
    setTagInput('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="glass-card rounded-xl p-6" data-testid="create-post-form">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold">JD</span>
        </div>
        <div className="flex-1">
          <textarea 
            placeholder="Share your learning progress, tips, or ask questions..."
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            data-testid="textarea-post-content"
          />
          
          {/* Tags Input */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded flex items-center"
                  data-testid={`tag-${tag}`}
                >
                  #{tag}
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-primary hover:text-primary/70"
                    data-testid={`button-remove-tag-${tag}`}
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-1 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  data-testid="input-tag"
                />
                <button 
                  onClick={handleAddTag}
                  className="px-3 py-1 bg-muted/20 text-muted-foreground hover:text-foreground rounded text-xs transition-colors"
                  data-testid="button-add-tag"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex space-x-2">
              <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Add image">
                <i className="fas fa-image"></i>
              </button>
              <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Add poll">
                <i className="fas fa-poll"></i>
              </button>
              <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Add code">
                <i className="fas fa-code"></i>
              </button>
            </div>
            <button 
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all disabled:opacity-50"
              onClick={handleSubmit}
              disabled={!content.trim() || isLoading}
              data-testid="button-create-post"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Posting...
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PostCardProps {
  post: Post & {
    user?: {
      firstName?: string;
      lastName?: string;
      level?: number;
      profileImageUrl?: string;
    };
  };
  onLike: (postId: string) => void;
}

function PostCard({ post, onLike }: PostCardProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className={`glass-card rounded-xl p-6 hover-glow ${post.isAchievement ? 'border-2 border-accent/30' : ''}`} data-testid={`post-${post.id}`}>
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
          {post.user?.profileImageUrl ? (
            <img 
              src={post.user.profileImageUrl} 
              alt={`${post.user.firstName} ${post.user.lastName}`}
              className="w-full h-full rounded-full object-cover" 
            />
          ) : (
            <span className="text-sm font-bold">
              {post.user?.firstName?.[0]}{post.user?.lastName?.[0]}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold flex items-center">
                {post.user?.firstName} {post.user?.lastName}
                {post.isAchievement && (
                  <span className="ml-2 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-bold rounded">
                    ACHIEVEMENT
                  </span>
                )}
              </h4>
              <p className="text-xs text-muted-foreground">
                Level {post.user?.level || 1} • {formatTimeAgo(post.createdAt)}
              </p>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </div>
          
          <p className="text-sm mb-3" data-testid={`text-post-content-${post.id}`}>
            {post.content}
          </p>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center space-x-2 mb-3">
              {post.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-1 bg-secondary/20 text-secondary text-xs font-semibold rounded"
                  data-testid={`post-tag-${tag}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <button 
              className="flex items-center space-x-2 hover:text-primary transition-colors"
              onClick={() => onLike(post.id)}
              data-testid={`button-like-${post.id}`}
            >
              <i className="fas fa-heart"></i>
              <span data-testid={`text-likes-${post.id}`}>{post.likes}</span>
            </button>
            <button 
              className="flex items-center space-x-2 hover:text-primary transition-colors"
              data-testid={`button-comment-${post.id}`}
            >
              <i className="fas fa-comment"></i>
              <span>{post.comments}</span>
            </button>
            <button 
              className="flex items-center space-x-2 hover:text-primary transition-colors"
              data-testid={`button-share-${post.id}`}
            >
              <i className="fas fa-share"></i>
              <span>{post.shares}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(0);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/community/posts', currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/community/posts?limit=20&offset=${currentPage * 20}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    }
  });

  const createPostMutation = useMutation({
    mutationFn: async ({ content, tags }: { content: string; tags: string[] }) => {
      const response = await apiRequest('POST', '/api/community/posts', {
        content,
        tags,
        isAchievement: false
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Created! 🎉",
        description: "Your post has been shared with the community.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Post",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest('POST', `/api/community/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Like Post",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = (content: string, tags: string[]) => {
    createPostMutation.mutate({ content, tags });
  };

  const handleLikePost = (postId: string) => {
    likePostMutation.mutate(postId);
  };

  const trendingTopics = [
    { name: 'ReactHooks', posts: 1200, trend: 'up' },
    { name: 'DataScience', posts: 890, trend: 'up' },
    { name: 'MachineLearning', posts: 756, trend: 'up' },
    { name: 'WebDev', posts: 623, trend: 'up' }
  ];

  const studyGroups = [
    { id: 1, name: 'React Masters', members: 432, description: 'Advanced React patterns & best practices' },
    { id: 2, name: 'Python Enthusiasts', members: 678, description: 'All things Python & data science' },
    { id: 3, name: 'ML Study Group', members: 234, description: 'Machine learning fundamentals' }
  ];

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted/20 rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted/20 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card rounded-xl p-6 h-32"></div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card rounded-xl p-6 h-48"></div>
                ))}
              </div>
              <div className="space-y-6">
                <div className="glass-card rounded-xl p-6 h-64"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Community</h2>
          <p className="text-muted-foreground">Connect with fellow learners and share your journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Community Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <CreatePostForm 
              onSubmit={handleCreatePost}
              isLoading={createPostMutation.isPending}
            />

            {/* Feed Posts */}
            <div className="space-y-6" data-testid="community-feed">
              {posts?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                    <i className="fas fa-users text-4xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                  <p className="text-muted-foreground">Be the first to share something with the community!</p>
                </div>
              ) : (
                posts?.map((post: Post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onLike={handleLikePost}
                  />
                ))
              )}
            </div>

            {/* Load More */}
            {posts && posts.length >= 20 && (
              <div className="text-center">
                <button 
                  className="px-6 py-3 glass-card border border-border rounded-lg font-semibold hover:bg-card transition-all"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  data-testid="button-load-more"
                >
                  Load More Posts
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <div className="glass-card rounded-xl p-6" data-testid="card-trending-topics">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-fire text-accent mr-2"></i>Trending Topics
              </h3>
              <div className="space-y-3">
                {trendingTopics.map((topic) => (
                  <div key={topic.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-card/50 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold">#{topic.name}</p>
                      <p className="text-xs text-muted-foreground">{topic.posts.toLocaleString()} posts</p>
                    </div>
                    <i className={`fas fa-arrow-trend-${topic.trend} text-success`}></i>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Groups */}
            <div className="glass-card rounded-xl p-6" data-testid="card-study-groups">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-users text-secondary mr-2"></i>Study Groups
              </h3>
              <div className="space-y-3">
                {studyGroups.map((group) => (
                  <div key={group.id} className="p-3 bg-card/50 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold">{group.name}</h4>
                      <span className="text-xs text-muted-foreground">{group.members} members</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{group.description}</p>
                    <button 
                      className="w-full py-1.5 bg-primary/20 text-primary text-xs font-semibold rounded hover:bg-primary/30 transition-colors"
                      data-testid={`button-join-group-${group.id}`}
                    >
                      Join Group
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Stats */}
            <div className="glass-card rounded-xl p-6" data-testid="card-community-stats">
              <h3 className="text-lg font-semibold mb-4">Your Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posts Created</span>
                  <span className="font-semibold">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Likes Received</span>
                  <span className="font-semibold">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Comments Made</span>
                  <span className="font-semibold">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Groups Joined</span>
                  <span className="font-semibold">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
