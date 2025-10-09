import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Message, AiConversation } from '@/types';

export function AITutor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm EduBot, your AI learning assistant. I can help you understand concepts, solve problems, and answer questions. What would you like to learn today?",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/user/conversations'],
  });

  const { data: aiStats } = useQuery({
    queryKey: ['/api/user/analytics'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/tutor', {
        question: message,
        context: 'general'
      });
      return response.json();
    },
    onMutate: (message: string) => {
      // Add user message immediately
      const userMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage('');
      setIsTyping(true);
    },
    onSuccess: (data) => {
      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      // Save conversation
      saveConversationMutation.mutate();
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveConversationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/ai/conversations', {
        messages: messages,
        context: 'general'
      });
    },
  });

  const quickQuestions = [
    "What is JSX?",
    "Explain async/await",
    "What are closures?",
    "How do React hooks work?",
    "What is the difference between == and ===?",
    "Explain the event loop"
  ];

  const recommendedResources = [
    {
      id: 1,
      title: "React Hooks Cheatsheet",
      type: "PDF",
      size: "2.4 MB",
      icon: "fa-file-pdf",
      color: "text-destructive"
    },
    {
      id: 2,
      title: "Advanced Hooks Tutorial", 
      type: "Video",
      duration: "45 min",
      icon: "fa-video",
      color: "text-destructive"
    },
    {
      id: 3,
      title: "JavaScript ES6 Guide",
      type: "Article",
      readTime: "10 min",
      icon: "fa-article",
      color: "text-secondary"
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    sendMessageMutation.mutate(currentMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setCurrentMessage(question);
    sendMessageMutation.mutate(question);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <section className="py-16 bg-background/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">AI Tutor Assistant</h2>
          <p className="text-muted-foreground">Get instant help powered by Gemini AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl overflow-hidden h-[600px] flex flex-col" data-testid="chat-interface">
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <i className="fas fa-robot text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">EduBot AI</h3>
                    <p className="text-xs text-success flex items-center">
                      <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
                      Online & Ready
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start space-x-3 ${
                      message.role === 'user' ? 'justify-end' : ''
                    }`}
                    data-testid={`message-${index}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-robot text-sm"></i>
                      </div>
                    )}
                    
                    <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`rounded-lg p-3 max-w-2xl ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'glass-card border border-border'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start space-x-3" data-testid="typing-indicator">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-sm"></i>
                    </div>
                    <div className="glass-card border border-border rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border bg-card/50">
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Ask me anything..." 
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-message"
                  />
                  <button 
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all disabled:opacity-50"
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send"
                  >
                    {sendMessageMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-paper-plane"></i>
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <i className="fas fa-info-circle mr-1"></i>
                  Powered by Gemini AI - Responses are AI-generated
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Resources */}
          <div className="space-y-6">
            {/* Quick Questions */}
            <div className="glass-card rounded-xl p-6" data-testid="card-quick-questions">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-bolt text-accent mr-2"></i>Quick Questions
              </h3>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <button 
                    key={index}
                    className="w-full p-3 glass-card border border-border rounded-lg text-left text-sm hover:border-primary hover:bg-primary/10 transition-all"
                    onClick={() => handleQuickQuestion(question)}
                    disabled={sendMessageMutation.isPending}
                    data-testid={`button-quick-${index}`}
                  >
                    <i className="fas fa-question-circle text-primary mr-2"></i>
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommended Resources */}
            <div className="glass-card rounded-xl p-6" data-testid="card-recommended-resources">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-bookmark text-secondary mr-2"></i>Recommended Resources
              </h3>
              <div className="space-y-3">
                {recommendedResources.map((resource) => (
                  <div 
                    key={resource.id}
                    className="p-3 bg-card/50 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                    data-testid={`resource-${resource.id}`}
                  >
                    <div className="flex items-start space-x-2">
                      <i className={`fas ${resource.icon} ${resource.color} mt-1`}></i>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{resource.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {resource.type} • {resource.size || resource.duration || resource.readTime}
                        </p>
                      </div>
                      <button className="text-primary hover:text-primary/80" data-testid={`button-resource-${resource.id}`}>
                        <i className="fas fa-external-link-alt"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Stats */}
            <div className="glass-card rounded-xl p-6" data-testid="card-ai-stats">
              <h3 className="text-lg font-semibold mb-4">AI Usage Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Questions Asked</span>
                  <span className="font-semibold" data-testid="text-questions-asked">
                    {conversations?.reduce((total: number, conv: AiConversation) => 
                      total + conv.messages.filter((m: Message) => m.role === 'user').length, 0) || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Concepts Explained</span>
                  <span className="font-semibold" data-testid="text-concepts-explained">
                    {Math.floor((conversations?.length || 0) * 2.3)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Sessions</span>
                  <span className="font-semibold" data-testid="text-active-sessions">
                    {conversations?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
