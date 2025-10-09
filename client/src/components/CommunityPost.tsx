import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  Crown,
  Flame
} from "lucide-react";

interface CommunityPostProps {
  post: {
    id: number;
    userId: string;
    content: string;
    tags?: string[];
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isAchievement: boolean;
    createdAt: string;
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
      level: number;
      xp: number;
    };
  };
  currentUserId?: string;
}

const getInitials = (firstName?: string, lastName?: string, email?: string) => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`;
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export default function CommunityPost({ post, currentUserId }: CommunityPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/community/posts/${post.id}/like`);
      } else {
        await apiRequest("POST", `/api/community/posts/${post.id}/like`);
      }
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Action Failed",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = () => {
    toast({
      title: "Coming Soon",
      description: "Comment feature will be available soon!",
    });
  };

  const handleShare = () => {
    toast({
      title: "Coming Soon", 
      description: "Share feature will be available soon!",
    });
  };

  const tagColors = [
    "bg-primary/20 text-primary",
    "bg-secondary/20 text-secondary", 
    "bg-accent/20 text-accent",
    "bg-success/20 text-success",
  ];

  return (
    <Card 
      className={`glass-card hover-glow transition-all ${post.isAchievement ? 'border-2 border-accent/30 bg-accent/5' : ''}`}
      data-testid={`community-post-${post.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          {/* User Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">
              {getInitials(post.user?.firstName, post.user?.lastName, post.user?.email)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold">
                  {post.user?.firstName || post.user?.email?.split('@')[0] || 'Anonymous'}
                </h4>
                {post.isAchievement && (
                  <Badge className="bg-accent text-accent-foreground text-xs font-bold">
                    <Crown className="w-3 h-3 mr-1" />
                    ACHIEVEMENT
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Level {post.user?.level || 1}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(post.createdAt)}
                </span>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <Badge 
                    key={tag} 
                    className={`text-xs ${tagColors[index % tagColors.length]}`}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <Button
                  variant="ghost" 
                  size="sm"
                  className={`flex items-center space-x-2 hover:text-primary transition-colors p-0 h-auto ${
                    isLiked ? 'text-primary' : ''
                  }`}
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  data-testid={`button-like-${post.id}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{post.likesCount + (isLiked ? 1 : 0)}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm" 
                  className="flex items-center space-x-2 hover:text-primary transition-colors p-0 h-auto"
                  onClick={handleComment}
                  data-testid={`button-comment-${post.id}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.commentsCount}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 hover:text-primary transition-colors p-0 h-auto"
                  onClick={handleShare}
                  data-testid={`button-share-${post.id}`}
                >
                  <Share className="w-4 h-4" />
                  <span>{post.sharesCount}</span>
                </Button>
              </div>

              {/* User XP Badge */}
              {post.user?.xp && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Flame className="w-3 h-3 text-accent" />
                  <span>{post.user.xp.toLocaleString()} XP</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
