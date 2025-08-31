'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Code, 
  FileText, 
  Lightbulb,
  Search,
  BookOpen,
  MessageSquare,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    files?: string[];
    features?: string[];
    suggestions?: string[];
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  category: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'explain-auth',
    label: 'Explain authentication system',
    icon: <Code className="h-4 w-4" />,
    prompt: 'Can you explain how the authentication system works in this codebase?',
    category: 'Architecture'
  },
  {
    id: 'mcp-integration',
    label: 'How does MCP integration work?',
    icon: <FileText className="h-4 w-4" />,
    prompt: 'How does the MCP (Model Context Protocol) integration work in this project?',
    category: 'Features'
  },
  {
    id: 'improve-performance',
    label: 'Performance optimization tips',
    icon: <Lightbulb className="h-4 w-4" />,
    prompt: 'What are some ways I can improve the performance of this application?',
    category: 'Optimization'
  },
  {
    id: 'testing-strategy',
    label: 'Testing best practices',
    icon: <Search className="h-4 w-4" />,
    prompt: 'What testing strategies should I implement for this codebase?',
    category: 'Quality'
  },
  {
    id: 'deployment-guide',
    label: 'Deployment recommendations',
    icon: <BookOpen className="h-4 w-4" />,
    prompt: 'What are the best practices for deploying this application to production?',
    category: 'DevOps'
  },
  {
    id: 'security-review',
    label: 'Security considerations',
    icon: <MessageSquare className="h-4 w-4" />,
    prompt: 'What security considerations should I be aware of in this codebase?',
    category: 'Security'
  }
];

function ChatContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = ['all', ...Array.from(new Set(quickActions.map(action => action.category)))];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: `Hello! I'm your AI-powered knowledge assistant for the RampForgeAI codebase. I can help you understand the architecture, explain features, suggest improvements, and answer questions about the code.

Here are some things I can help you with:
• Explain how different components work together
• Provide code examples and best practices
• Suggest performance optimizations
• Help with debugging and troubleshooting
• Guide you through the codebase structure

Feel free to ask me anything about the project, or use one of the quick actions below to get started!`,
        timestamp: new Date(),
        context: {
          features: ['Authentication', 'MCP Integration', 'Project Management', 'Code Analysis'],
          suggestions: ['Ask about specific components', 'Request code explanations', 'Get optimization tips']
        }
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(content.trim()),
        timestamp: new Date(),
        context: {
          files: ['auth.py', 'AuthProvider.tsx', 'main.py'],
          features: ['JWT Authentication', 'Protected Routes'],
          suggestions: ['Check the auth middleware', 'Review token validation', 'Test with different user roles']
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('authentication') || lowerPrompt.includes('auth')) {
      return `The authentication system in RampForgeAI uses JWT (JSON Web Tokens) for secure user authentication. Here's how it works:

**Backend (FastAPI):**
- \`auth.py\` handles user registration, login, and token generation
- Passwords are hashed using bcrypt for security
- JWT tokens are signed with a secret key and include user information
- Protected endpoints use dependency injection to validate tokens

**Frontend (Next.js):**
- \`AuthProvider.tsx\` manages authentication state globally
- \`ProtectedRoute.tsx\` wraps pages that require authentication
- Tokens are stored securely and included in API requests
- Automatic redirect to login page for unauthenticated users

**Key Features:**
- Role-based access control (admin, developer, team_lead, observer)
- Session management with database tracking
- Automatic token refresh before expiry
- Secure logout with token invalidation

Would you like me to explain any specific part in more detail?`;
    }

    if (lowerPrompt.includes('mcp') || lowerPrompt.includes('integration')) {
      return `The MCP (Model Context Protocol) integration allows RampForgeAI to connect with various development tools. Here's the architecture:

**Supported Services:**
- GitHub/GitLab (repository data, issues, PRs)
- Jira/Azure DevOps (project management)
- Confluence (documentation)

**Backend Implementation:**
- \`mcp_service.py\` contains the core MCP client logic
- Each service has its own client class with standardized methods
- Credentials are encrypted and stored securely in the database
- Rate limiting and error handling for external API calls

**Frontend Management:**
- \`MCPServiceList.tsx\` displays all configured services
- \`MCPServiceForm.tsx\` handles service configuration
- Real-time connection status and health monitoring
- Bulk operations for syncing multiple services

**Key Features:**
- Automatic data synchronization
- Health checks and connection monitoring
- Configurable rate limits and timeouts
- Secure credential management

The system is designed to be extensible - adding new MCP services requires implementing the standard interface.`;
    }

    if (lowerPrompt.includes('performance') || lowerPrompt.includes('optimization')) {
      return `Here are key performance optimization strategies for RampForgeAI:

**Frontend Optimizations:**
- **Code Splitting:** Next.js automatically splits code, but consider dynamic imports for heavy components
- **Image Optimization:** Use Next.js Image component for automatic optimization
- **Caching:** Implement proper caching strategies for API responses
- **Bundle Analysis:** Use \`npm run analyze\` to identify large dependencies

**Backend Optimizations:**
- **Database:** Add indexes for frequently queried fields
- **Async Operations:** Use async/await for I/O operations
- **Connection Pooling:** Configure SQLAlchemy connection pooling
- **Caching Layer:** Implement Redis for frequently accessed data

**API Optimizations:**
- **Pagination:** Implement proper pagination for large datasets
- **Field Selection:** Allow clients to specify which fields to return
- **Batch Operations:** Combine multiple operations where possible
- **Rate Limiting:** Prevent abuse while maintaining performance

**Infrastructure:**
- **CDN:** Use a CDN for static assets
- **Load Balancing:** Distribute traffic across multiple instances
- **Database Optimization:** Consider PostgreSQL for production
- **Monitoring:** Implement APM tools for performance tracking

Would you like me to dive deeper into any of these areas?`;
    }

    // Default response
    return `I understand you're asking about "${prompt}". Based on the RampForgeAI codebase, I can provide insights about:

**Architecture Components:**
- Frontend: Next.js 15.5.0 with TypeScript and Tailwind CSS
- Backend: FastAPI with Python 3.11+ and SQLAlchemy
- Database: SQLite for development, with PostgreSQL recommended for production
- Authentication: JWT-based with role management

**Key Features:**
- User authentication and authorization
- MCP integration for development tools
- Project management integration (Jira, Azure DevOps)
- Code analysis and insights
- AI-powered knowledge assistance

**Development Practices:**
- TypeScript strict mode for type safety
- Comprehensive testing with Jest and pytest
- Docker-based development environment
- Automated API documentation with OpenAPI

Could you be more specific about what aspect you'd like me to explain? I can provide detailed information about any component, feature, or development practice in the codebase.`;
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const filteredActions = selectedCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === selectedCategory);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Knowledge Assistant</h1>
            <p className="text-gray-600">
              Ask questions about your codebase and get instant AI-powered answers
            </p>
          </div>
          <Button variant="outline" onClick={() => setMessages([])}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </div>

        <div className="flex-1 flex gap-6">
          {/* Quick Actions Sidebar */}
          <div className="w-80 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common questions and tasks to get you started
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? 'All' : category}
                    </Button>
                  ))}
                </div>

                {/* Quick Action Buttons */}
                <div className="space-y-2">
                  {filteredActions.map(action => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleQuickAction(action)}
                    >
                      <div className="flex items-start space-x-3">
                        {action.icon}
                        <div className="text-left">
                          <div className="font-medium text-sm">{action.label}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {action.category}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2 mb-2">
                        {message.type === 'assistant' ? (
                          <Bot className="h-5 w-5 mt-0.5 text-primary" />
                        ) : (
                          <User className="h-5 w-5 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                          
                          {/* Context Information */}
                          {message.context && message.type === 'assistant' && (
                            <div className="mt-3 space-y-2">
                              {message.context.files && (
                                <div>
                                  <div className="text-xs font-medium text-gray-600 mb-1">Related Files:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {message.context.files.map((file, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {file}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {message.context.suggestions && (
                                <div>
                                  <div className="text-xs font-medium text-gray-600 mb-1">Suggestions:</div>
                                  <div className="space-y-1">
                                    {message.context.suggestions.map((suggestion, index) => (
                                      <div key={index} className="text-xs text-gray-600">
                                        • {suggestion}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Message Actions */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                        {message.type === 'assistant' && (
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(inputValue);
                      }
                    }}
                    placeholder="Ask me anything about the codebase..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={isLoading || !inputValue.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}