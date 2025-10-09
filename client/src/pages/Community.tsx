import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import CommunityPost from "@/components/CommunityPost";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  TrendingUp, 
  MessageSquarePlus,
  Image,
  BarChart3,
  Code,
  Send,
  Flame,
  UserPlus,
  Hash
} from "lucide-react";

const trendingTopics = [
  { tag: "ReactHooks", posts: 1200, trend: "up" },
  { tag: "DataScience", posts: 890, trend: "up" },
  { tag: "MachineLearning", posts: 756, trend: "up" },
  { tag: "WebDev", posts: 623, trend: "stable" },
  { tag: "JavaScript", posts: 445, trend: "down" },
];

const studyGroups = [
  {
    id: 1,
    name: "React Masters",
    description: "Advanced React patterns & best practices",
    members: 432,
    category: "Programming"
  },
  {
    id: 2, 
    name: "Python Enthusiasts",
    description: "All things Python & data science",
    members: 678,
    category: "Data Science"
  },
  {
    id: 3,
    name: "AI/ML Study Group",
    description: "Machine Learning and AI discussions",
    members: 234,
    category: "AI & ML"
  },
];

const suggestedUsers = [
  {
    id: "user1",
    firstName: "Priya",
    lastName: "Patel", 
    level: 10,
    interests: "Similar interests",
    mutualCourses: 0
  },
  {
    id: "user2",
    firstName: "David",
    lastName: "Kim",
    level: 10, 
    interests: "",
    mutualCourses: 3
  },
  {
    id: "user3",
    firstName: "Sarah",
    lastName: "Wilson",
    level: 12,
    interests: "AI & Machine Learning",
    mutualCourses: 1
  },
];

export default function Community() {
  const [postContent, setPostContent] = useState("");
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ["/api/community/posts"],
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  const { data: studyGroupsData } = useQuery({
    queryKey: ["/api/study-groups"],
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/community/posts", {
        content,
        tags: extractTags(content),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Created!",
        description: "Your post has been shared with the community.",
      });
      setPostContent("");
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
        title: "Post Failed",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      await apiRequest("POST", `/api/study-groups/${groupId}/join`);
    },
    onSuccess: () => {
      toast({
        title: "Joined Study Group!",
        description: "You've successfully joined the study group.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/study-groups"] });
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
        title: "Join Failed",
        description: "Failed to join study group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle unauthorized errors at page level
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (postsError && isUnauthorizedError(postsError)) {
      toast({
        title: "Unauthorized", 
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [postsError, toast]);

  const extractTags = (content: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const handleCreatePost = () => {
    if (!postContent.trim() || createPostMutation.isPending) return;
    createPostMutation.mutate(postContent);
  };

  const handleJoinGroup = (groupId: number) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleConnectUser = (userId: string) => {
    toast({
      title: "Coming Soon",
      description: "User connection feature will be available soon!",
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    return firstName?.[0]?.toUpperCase() || "U";
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Community
            </h1>
            <p className="text-muted-foreground">
              Connect with fellow learners and share your journey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {getInitials(user?.firstName, user?.lastName)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Share your learning progress, tips, or ask questions..."
                        rows={4}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="resize-none border-border bg-background"
                        data-testid="textarea-create-post"
                      />
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                            <Image className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                            <Code className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button 
                          onClick={handleCreatePost}
                          disabled={!postContent.trim() || createPostMutation.isPending}
                          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                          data-testid="button-create-post"
                        >
                          {createPostMutation.isPending ? (
                            "Posting..."
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Post
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Feed */}
              <div className="space-y-6">
                {postsLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-muted rounded-full" />
                            <div className="flex-1 space-y-3">
                              <div className="h-4 bg-muted rounded w-1/4" />
                              <div className="space-y-2">
                                <div className="h-4 bg-muted rounded" />
                                <div className="h-4 bg-muted rounded w-3/4" />
                              </div>
                              <div className="flex space-x-4">
                                <div className="h-4 bg-muted rounded w-16" />
                                <div className="h-4 bg-muted rounded w-16" />
                                <div className="h-4 bg-muted rounded w-16" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : posts && posts.length > 0 ? (
                  posts.map((post: any) => (
                    <CommunityPost 
                      key={post.id} 
                      post={post} 
                      currentUserId={user?.id}
                    />
                  ))
                ) : (
                  <Card className="glass-card">
                    <CardContent className="p-12 text-center">
                      <div className="text-6xl text-muted-foreground mb-4">💬</div>
                      <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                      <p className="text-muted-foreground">
                        Be the first to share something with the community!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending Topics */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Flame className="w-5 h-5 text-accent mr-2" />
                    Trending Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trendingTopics.map((topic, index) => (
                      <div 
                        key={topic.tag} 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-card/50 transition-colors cursor-pointer"
                        data-testid={`trending-topic-${index}`}
                      >
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-semibold">#{topic.tag}</p>
                            <p className="text-xs text-muted-foreground">
                              {topic.posts.toLocaleString()} posts
                            </p>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          topic.trend === 'up' ? 'bg-success' : 
                          topic.trend === 'down' ? 'bg-destructive' : 'bg-accent'
                        }`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Study Groups */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 text-secondary mr-2" />
                    Study Groups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(studyGroupsData || studyGroups).slice(0, 3).map((group: any) => (
                      <div key={group.id} className="p-3 bg-card/50 rounded-lg border border-border hover:border-primary transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">{group.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {group.members || group.membersCount} members
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {group.description}
                        </p>
                        <Button 
                          size="sm"
                          className="w-full bg-primary/20 text-primary hover:bg-primary/30"
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={joinGroupMutation.isPending}
                          data-testid={`button-join-group-${group.id}`}
                        >
                          {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Suggested Connections */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Suggested Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suggestedUsers.map((suggestedUser) => (
                      <div key={suggestedUser.id} className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {getInitials(suggestedUser.firstName, suggestedUser.lastName)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold truncate">
                            {suggestedUser.firstName} {suggestedUser.lastName}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Level {suggestedUser.level} • {
                              suggestedUser.mutualCourses > 0 
                                ? `${suggestedUser.mutualCourses} mutual courses`
                                : suggestedUser.interests
                            }
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="px-3 py-1 text-xs"
                          onClick={() => handleConnectUser(suggestedUser.id)}
                          data-testid={`button-connect-${suggestedUser.id}`}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Community Stats */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-primary mr-2" />
                    Community Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Members</span>
                      <span className="font-semibold">50,247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Today</span>
                      <span className="font-semibold text-success">3,421</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Posts This Week</span>
                      <span className="font-semibold">1,247</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Your Posts</span>
                      <span className="font-semibold text-primary">
                        {posts?.filter((p: any) => p.userId === user?.id).length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
