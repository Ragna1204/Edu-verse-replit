import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Bot, 
  User,
  Loader2,
  Lightbulb,
  Video,
  FileText,
  Download,
  Play,
  HelpCircle,
  Sparkles
} from "lucide-react";

interface Message {
  id: string;
  message: string;
  response: string;
  aiModel: string;
  createdAt: string;
  isUser: boolean;
}

interface ChatInterfaceProps {
  className?: string;
}

const quickQuestions = [
  "What is JSX?",
  "Explain async/await",
  "What are closures?",
  "How do React hooks work?",
  "What is the difference between let and const?",
  "Explain event bubbling",
];

const mockResources = [
  {
    id: 1,
    title: "React Hooks Cheatsheet",
    type: "pdf",
    size: "2.4 MB",
    icon: FileText,
  },
  {
    id: 2,
    title: "Advanced Hooks Tutorial", 
    type: "video",
    duration: "45 min",
    icon: Video,
  },
];

export default function ChatInterface({ className = "" }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [useGemini, setUseGemini] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: chatHistory } = useQuery({
    queryKey: ["/api/ai/chat-history", { limit: 20 }],
    select: (data: any[]) => 
      data.map((msg, index) => ({
        ...msg,
        id: msg.id || index.toString(),
        isUser: false,
      })),
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message,
        useGemini,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const newMessage: Message = {
        id: data.id,
        message: data.message,
        response: data.response,
        aiModel: data.aiModel,
        createdAt: data.createdAt,
        isUser: false,
      };
      
      setMessages(prev => [newMessage, ...prev]);
      setInputMessage("");
      
      // Scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
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
        title: "Chat Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize with chat history
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory.reverse());
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      message: inputMessage,
      response: "",
      aiModel: "",
      createdAt: new Date().toISOString(),
      isUser: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Main Chat Interface */}
      <div className="lg:col-span-2">
        <Card className="glass-card h-[600px] flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b border-border bg-card/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">EduBot AI</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-xs text-success font-medium">Online & Ready</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={useGemini ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseGemini(true)}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Gemini
                </Button>
                <Button
                  variant={!useGemini ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseGemini(false)}
                >
                  <Bot className="w-4 h-4 mr-1" />
                  OpenAI
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="glass-card border border-border rounded-lg p-4 max-w-md">
                      <p className="text-sm">
                        Hello! I'm EduBot, your AI learning assistant. I can help you understand concepts, 
                        solve problems, and answer questions. What would you like to learn today?
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message) => (
                <div key={message.id}>
                  {/* User Message */}
                  {message.isUser && (
                    <div className="flex items-start space-x-3 justify-end mb-4">
                      <div className="flex-1 flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-md">
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* AI Response */}
                  {!message.isUser && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="glass-card border border-border rounded-lg p-4 max-w-2xl">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {message.aiModel === 'gemini' ? '✨ Gemini' : '🤖 OpenAI'}
                            </Badge>
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {message.response.split('\n').map((line, index) => (
                              <p key={index} className="text-sm mb-2 last:mb-0">
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {chatMutation.isPending && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="glass-card border border-border rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-border bg-card/50 flex-shrink-0">
            <div className="flex space-x-2">
              <Input
                placeholder="Ask me anything..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={chatMutation.isPending}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-send-message"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by {useGemini ? 'Gemini' : 'OpenAI'} - Responses are AI-generated
            </p>
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Questions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 text-accent mr-2" />
              Quick Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3 hover:bg-primary/10 hover:border-primary/30"
                  onClick={() => handleQuickQuestion(question)}
                  data-testid={`quick-question-${index}`}
                >
                  <HelpCircle className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                  <span className="text-sm">{question}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Resources */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 text-secondary mr-2" />
              Recommended Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockResources.map((resource) => (
                <div key={resource.id} className="p-3 bg-card/50 rounded-lg border border-border hover:border-primary transition-colors">
                  <div className="flex items-start space-x-3">
                    <resource.icon className={`w-5 h-5 mt-0.5 ${resource.type === 'pdf' ? 'text-destructive' : 'text-secondary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resource.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {resource.type === 'pdf' ? `PDF • ${resource.size}` : `Video • ${resource.duration}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      {resource.type === 'pdf' ? (
                        <Download className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Usage Stats */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>AI Usage Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Questions Asked</span>
                <span className="font-semibold">{messages.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sessions Today</span>
                <span className="font-semibold">1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Preferred AI</span>
                <Badge variant="outline">
                  {useGemini ? '✨ Gemini' : '🤖 OpenAI'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
