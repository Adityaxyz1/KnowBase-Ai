import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightOpen, PanelRightClose, Menu, Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { ChatInput, type ChatInputHandle } from '@/components/ChatInput';
import { MessageList, type Message } from '@/components/MessageBubble';
import { ContextPanel } from '@/components/ContextPanel';
import { EmptyState } from '@/components/EmptyState';
import { KnowledgeOrb } from '@/components/KnowledgeOrb';
import { SettingsPanel } from '@/components/SettingsPanel';
import { streamChat, analyzeConfidence, type ChatMessage, type FileAttachment } from '@/lib/chat';
import { exportToMarkdown, exportToPDF, downloadMarkdown } from '@/lib/exportConversation';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  starred?: boolean;
  messages: Message[];
  spaceId?: string;
}

interface KnowledgeSpace {
  id: string;
  name: string;
  color: string;
  conversationCount: number;
}

const defaultSpaces: KnowledgeSpace[] = [
  { id: '1', name: 'Research', color: '#00d4ff', conversationCount: 0 },
  { id: '2', name: 'Work Projects', color: '#ff6b6b', conversationCount: 0 },
  { id: '3', name: 'Learning', color: '#ffd93d', conversationCount: 0 },
];

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Persisted state
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('knowbase-conversations', []);
  const [knowledgeSpaces, setKnowledgeSpaces] = useLocalStorage<KnowledgeSpace[]>('knowbase-spaces', defaultSpaces);
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('knowbase-theme-dark', true);
  
  // Session state
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [activeSpaceId, setActiveSpaceId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reasoning, setReasoning] = useState<{ id: string; title: string; description: string }[]>([]);
  const [keyPoints, setKeyPoints] = useState<{ id: string; text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
      navigate('/auth');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
        toast({
          title: 'New chat created',
          description: 'Press Ctrl+K to search',
        });
      }
      
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!sidebarOpen) {
          setSidebarOpen(true);
        }
        // Focus search after sidebar opens
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
      
      // Ctrl/Cmd + B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      
      // Escape: Close panels
      if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
        } else if (contextOpen) {
          setContextOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, settingsOpen, contextOpen]);

  const handleSend = async (content: string, files?: FileAttachment[]) => {
    // Auto-create conversation if none exists
    let currentConvId = activeConversationId;
    if (!currentConvId) {
      const newId = Date.now().toString();
      const title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
      const newConversation: Conversation = {
        id: newId,
        title,
        preview: content.slice(0, 50) + '...',
        timestamp: new Date(),
        messages: [],
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newId);
      currentConvId = newId;
    }

    // Create user message with optional file attachments
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments: files?.map(f => ({
        name: f.name,
        type: f.type,
        preview: f.type.startsWith('image/') ? f.base64 : undefined
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    setContextOpen(true);

    // Set reasoning steps
    const reasoningSteps = files && files.length > 0
      ? [
          { id: '1', title: 'Processing attachments', description: 'Analyzing uploaded files' },
          { id: '2', title: 'Analyzing content', description: 'Understanding context and intent' },
          { id: '3', title: 'Generating response', description: 'Synthesizing comprehensive answer' },
        ]
      : [
          { id: '1', title: 'Analyzing question', description: 'Understanding context and intent' },
          { id: '2', title: 'Retrieving knowledge', description: 'Searching relevant information' },
          { id: '3', title: 'Generating response', description: 'Synthesizing comprehensive answer' },
        ];
    setReasoning(reasoningSteps);

    // Create assistant message placeholder
    const assistantId = (Date.now() + 1).toString();
    let assistantContent = '';

    // Prepare messages for API
    const chatMessages: ChatMessage[] = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
    }));

    await streamChat({
      messages: chatMessages,
      files,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.id === assistantId) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [
            ...prev,
            {
              id: assistantId,
              role: 'assistant' as const,
              content: assistantContent,
              timestamp: new Date(),
            },
          ];
        });
      },
      onDone: () => {
        setIsThinking(false);
        
        // Analyze confidence
        const confidence = analyzeConfidence(assistantContent);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, confidence } : m
          )
        );

        // Extract key points from the response
        const sentences = assistantContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const points = sentences.slice(0, 4).map((text, i) => ({
          id: String(i),
          text: text.trim(),
        }));
        setKeyPoints(points);
      },
      onError: (error) => {
        setIsThinking(false);
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
      },
    });
  };

  const handleNewChat = () => {
    // Save current conversation if it has messages
    if (activeConversationId && messages.length > 0) {
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConversationId
            ? { ...c, messages, preview: messages[0]?.content.slice(0, 50) + '...' }
            : c
        )
      );
    }

    // Create new conversation
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: 'New Chat',
      preview: 'Start a new conversation...',
      timestamp: new Date(),
      messages: [],
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newId);
    setMessages([]);
    setContextOpen(false);
    setReasoning([]);
    setKeyPoints([]);
  };

  const handleSelectConversation = (id: string) => {
    // Save current conversation
    if (activeConversationId && messages.length > 0) {
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConversationId
            ? { ...c, messages, preview: messages[0]?.content.slice(0, 50) + '...' }
            : c
        )
      );
    }

    // Load selected conversation
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setActiveConversationId(id);
      setMessages(conversation.messages);
      setContextOpen(conversation.messages.length > 0);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(undefined);
      setMessages([]);
      setContextOpen(false);
      setReasoning([]);
      setKeyPoints([]);
    }
  };

  const handleSelectSpace = (id: string) => {
    setActiveSpaceId(activeSpaceId === id ? undefined : id);
  };

  const handleAddSpace = (name: string, color: string) => {
    const newSpace: KnowledgeSpace = {
      id: Date.now().toString(),
      name,
      color,
      conversationCount: 0,
    };
    setKnowledgeSpaces(prev => [...prev, newSpace]);
    toast({
      title: 'Space created',
      description: `"${name}" has been added to your knowledge spaces.`,
    });
  };

  const handleUpdateSpace = (id: string, name: string, color: string) => {
    setKnowledgeSpaces(prev =>
      prev.map(space =>
        space.id === id ? { ...space, name, color } : space
      )
    );
    toast({
      title: 'Space updated',
      description: `"${name}" has been updated.`,
    });
  };

  const handleDeleteSpace = (id: string) => {
    // Unassign all conversations from this space
    setConversations(prev =>
      prev.map(c => c.spaceId === id ? { ...c, spaceId: undefined } : c)
    );
    setKnowledgeSpaces(prev => prev.filter(space => space.id !== id));
    if (activeSpaceId === id) {
      setActiveSpaceId(undefined);
    }
    toast({
      title: 'Space deleted',
      description: 'The knowledge space has been removed.',
    });
  };

  const handleAssignConversations = (spaceId: string, conversationIds: string[]) => {
    setConversations(prev =>
      prev.map(c => ({
        ...c,
        spaceId: conversationIds.includes(c.id) ? spaceId : (c.spaceId === spaceId ? undefined : c.spaceId)
      }))
    );
    // Update conversation count
    setKnowledgeSpaces(prev =>
      prev.map(space => ({
        ...space,
        conversationCount: space.id === spaceId ? conversationIds.length : 
          conversations.filter(c => c.spaceId === space.id && !conversationIds.includes(c.id)).length
      }))
    );
  };

  const handleAddConversationToSpace = (conversationId: string, spaceId: string | undefined) => {
    const oldSpaceId = conversations.find(c => c.id === conversationId)?.spaceId;
    
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, spaceId } : c)
    );
    
    // Update conversation counts
    setKnowledgeSpaces(prev =>
      prev.map(space => {
        let count = space.conversationCount;
        if (space.id === oldSpaceId) count--;
        if (space.id === spaceId) count++;
        return { ...space, conversationCount: Math.max(0, count) };
      })
    );

    const spaceName = knowledgeSpaces.find(s => s.id === spaceId)?.name;
    toast({
      title: spaceId ? 'Added to space' : 'Removed from space',
      description: spaceId 
        ? `Conversation added to "${spaceName}".`
        : 'Conversation removed from space.',
    });
  };

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleClearAllData = () => {
    setConversations([]);
    setKnowledgeSpaces(defaultSpaces);
    setIsDarkMode(true);
    setActiveConversationId(undefined);
    setActiveSpaceId(undefined);
    setMessages([]);
    setContextOpen(false);
    setReasoning([]);
    setKeyPoints([]);
    setSettingsOpen(false);
    toast({
      title: 'All data cleared',
      description: 'Your conversations and settings have been reset.',
    });
  };

  const handleResetAllChats = () => {
    setConversations([]);
    setActiveConversationId(undefined);
    setMessages([]);
    setContextOpen(false);
    setReasoning([]);
    setKeyPoints([]);
    setSettingsOpen(false);
    toast({
      title: 'Chats reset',
      description: 'All conversations have been deleted.',
    });
  };

  const handleResetBot = () => {
    setSettingsOpen(false);
    toast({
      title: 'Bot reset',
      description: 'AI assistant has been reset to default settings.',
    });
  };

  const handleExportConversation = (conversationId: string, format: 'markdown' | 'pdf') => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || conversation.messages.length === 0) {
      toast({
        title: 'Cannot export',
        description: 'This conversation has no messages to export.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (format === 'markdown') {
        const markdown = exportToMarkdown({
          title: conversation.title,
          messages: conversation.messages,
          format: 'markdown',
        });
        downloadMarkdown(markdown, conversation.title);
        toast({
          title: 'Exported successfully',
          description: `Conversation saved as Markdown file.`,
        });
      } else {
        exportToPDF({
          title: conversation.title,
          messages: conversation.messages,
          format: 'pdf',
        });
        toast({
          title: 'Exported successfully',
          description: `Conversation saved as PDF file.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting the conversation.',
        variant: 'destructive',
      });
    }
  };

  // Update conversation title after first message
  useEffect(() => {
    if (activeConversationId && messages.length === 1 && messages[0].role === 'user') {
      const title = messages[0].content.slice(0, 40) + (messages[0].content.length > 40 ? '...' : '');
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConversationId ? { ...c, title } : c
        )
      );
    }
  }, [messages, activeConversationId]);

  const hasMessages = messages.length > 0;

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden transition-colors duration-300">
      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onClearAllData={handleClearAllData}
        onResetAllChats={handleResetAllChats}
        onResetBot={handleResetBot}
      />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar
            conversations={conversations}
            knowledgeSpaces={knowledgeSpaces}
            activeConversationId={activeConversationId}
            activeSpaceId={activeSpaceId}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onSelectSpace={handleSelectSpace}
            onAddSpace={handleAddSpace}
            onUpdateSpace={handleUpdateSpace}
            onDeleteSpace={handleDeleteSpace}
            onAssignConversations={handleAssignConversations}
            onAddConversationToSpace={handleAddConversationToSpace}
            onExportConversation={handleExportConversation}
            onClearAllChats={handleResetAllChats}
            onOpenSettings={() => setSettingsOpen(true)}
            searchInputRef={searchInputRef}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            {!sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-semibold">Knowbase AI</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasMessages && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setContextOpen(!contextOpen)}
              >
                {contextOpen ? (
                  <PanelRightClose className="w-5 h-5" />
                ) : (
                  <PanelRightOpen className="w-5 h-5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            {hasMessages ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-thin relative">
                  {/* Floating orb */}
                  <div className="fixed top-20 right-4 w-24 h-24 pointer-events-none opacity-60 z-10">
                    <KnowledgeOrb isActive={hasMessages} isThinking={isThinking} />
                  </div>

                  <MessageList messages={messages} isThinking={isThinking} />
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border p-4 surface-elevated">
                  <div className="max-w-3xl mx-auto">
                    <ChatInput onSend={handleSend} disabled={isThinking} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col">
                <EmptyState onStartChat={(message) => {
                  if (message) {
                    handleSend(message);
                  } else {
                    chatInputRef.current?.focus();
                  }
                }} />
                <div className="p-4 surface-elevated">
                  <div className="max-w-3xl mx-auto">
                    <ChatInput ref={chatInputRef} onSend={handleSend} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Context panel */}
          <ContextPanel
            isOpen={contextOpen && hasMessages}
            onClose={() => setContextOpen(false)}
            reasoning={reasoning}
            sources={[]}
            keyPoints={keyPoints}
          />
        </div>
      </main>
    </div>
  );
}
