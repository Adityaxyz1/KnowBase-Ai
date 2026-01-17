import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightOpen, PanelRightClose, Menu, Sparkles, LogOut, Brain, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { ChatInput, type ChatInputHandle } from '@/components/ChatInput';
import { MessageList, type Message } from '@/components/MessageBubble';
import { ContextPanel } from '@/components/ContextPanel';
import { EmptyState } from '@/components/EmptyState';
import { KnowledgeOrb } from '@/components/KnowledgeOrb';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ProfileDialog } from '@/components/ProfileDialog';
import { ImageGenerationButton } from '@/components/ImageGenerationButton';
import { LearningPreferencesDialog } from '@/components/LearningPreferencesDialog';
import { LearningInsights } from '@/components/LearningInsights';
import { streamChat, analyzeConfidence, type ChatMessage, type FileAttachment } from '@/lib/chat';
import { exportToMarkdown, exportToPDF, downloadMarkdown } from '@/lib/exportConversation';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useProfile } from '@/hooks/useProfile';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useLearningAnalytics } from '@/hooks/useLearningAnalytics';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const {
    conversations: dbConversations,
    knowledgeSpaces: dbSpaces,
    loading: dbLoading,
    createConversation,
    updateConversation,
    deleteConversation,
    clearAllConversations,
    fetchMessages,
    addMessage,
    updateMessage,
    createSpace,
    updateSpace,
    deleteSpace,
  } = useConversations();

  // Image generation with daily limit
  const { 
    remainingGenerations, 
    canGenerate, 
    isGenerating, 
    generateImage 
  } = useImageGeneration(user?.id);

  // Learning analytics and preferences
  const {
    analytics,
    preferences,
    updatePreferences,
    getRecommendedDifficulty,
    trackInteraction
  } = useLearningAnalytics(user?.id);

  // Theme preference
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('knowbase-theme-dark', true);
  
  // Session state
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [activeSpaceId, setActiveSpaceId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [learningPrefsOpen, setLearningPrefsOpen] = useState(false);
  const [reasoning, setReasoning] = useState<{ id: string; title: string; description: string }[]>([]);
  const [keyPoints, setKeyPoints] = useState<{ id: string; text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Transform DB conversations to UI format
  const conversations: Conversation[] = dbConversations.map(c => ({
    id: c.id,
    title: c.title,
    preview: c.preview || '',
    timestamp: new Date(c.updated_at),
    starred: c.starred,
    spaceId: c.space_id ?? undefined,
    messages: []
  }));

  // Transform DB spaces to UI format with counts
  const knowledgeSpaces: KnowledgeSpace[] = dbSpaces.map(s => ({
    id: s.id,
    name: s.name,
    color: s.color,
    conversationCount: dbConversations.filter(c => c.space_id === s.id).length
  }));

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
        toast({
          title: 'New chat created',
          description: 'Press Ctrl+K to search',
        });
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!sidebarOpen) {
          setSidebarOpen(true);
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      
      if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
        } else if (profileOpen) {
          setProfileOpen(false);
        } else if (contextOpen) {
          setContextOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, settingsOpen, contextOpen, profileOpen]);

  const handleSend = async (content: string, files?: FileAttachment[]) => {
    let currentConvId = activeConversationId;
    
    // Auto-create conversation if none exists
    if (!currentConvId) {
      const title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
      const { data } = await createConversation(title, content.slice(0, 50) + '...');
      if (data) {
        currentConvId = data.id;
        setActiveConversationId(data.id);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create conversation',
          variant: 'destructive',
        });
        return;
      }
    }

    // Create user message
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

    // Save user message to DB
    await addMessage(currentConvId, {
      role: 'user',
      content,
      attachments: userMessage.attachments
    });

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

    const assistantId = (Date.now() + 1).toString();
    let assistantContent = '';

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
      onDone: async () => {
        setIsThinking(false);
        
        const confidence = analyzeConfidence(assistantContent);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, confidence } : m
          )
        );

        // Save assistant message to DB
        if (currentConvId) {
          await addMessage(currentConvId, {
            role: 'assistant',
            content: assistantContent,
            confidence
          });
          
          // Update conversation preview
          await updateConversation(currentConvId, {
            preview: content.slice(0, 50) + '...'
          });
        }

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

  const handleNewChat = async () => {
    setActiveConversationId(undefined);
    setMessages([]);
    setContextOpen(false);
    setReasoning([]);
    setKeyPoints([]);
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    const msgs = await fetchMessages(id);
    setMessages(msgs);
    setContextOpen(msgs.length > 0);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
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

  const handleAddSpace = async (name: string, color: string) => {
    const { error } = await createSpace(name, color);
    if (!error) {
      toast({
        title: 'Space created',
        description: `"${name}" has been added to your knowledge spaces.`,
      });
    }
  };

  const handleUpdateSpace = async (id: string, name: string, color: string) => {
    const { error } = await updateSpace(id, { name, color });
    if (!error) {
      toast({
        title: 'Space updated',
        description: `"${name}" has been updated.`,
      });
    }
  };

  const handleDeleteSpace = async (id: string) => {
    // First update all conversations in this space to have no space
    const convosInSpace = dbConversations.filter(c => c.space_id === id);
    for (const conv of convosInSpace) {
      await updateConversation(conv.id, { space_id: null } as any);
    }
    
    await deleteSpace(id);
    if (activeSpaceId === id) {
      setActiveSpaceId(undefined);
    }
    toast({
      title: 'Space deleted',
      description: 'The knowledge space has been removed.',
    });
  };

  const handleAssignConversations = async (spaceId: string, conversationIds: string[]) => {
    // Update all conversations: assign to space or remove
    for (const conv of dbConversations) {
      const shouldBeInSpace = conversationIds.includes(conv.id);
      const isInSpace = conv.space_id === spaceId;
      
      if (shouldBeInSpace && !isInSpace) {
        await updateConversation(conv.id, { space_id: spaceId } as any);
      } else if (!shouldBeInSpace && isInSpace) {
        await updateConversation(conv.id, { space_id: null } as any);
      }
    }
  };

  const handleAddConversationToSpace = async (conversationId: string, spaceId: string | undefined) => {
    await updateConversation(conversationId, { space_id: spaceId ?? null } as any);
    
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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleClearAllData = async () => {
    await clearAllConversations();
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
      description: 'Your conversations have been reset.',
    });
  };

  const handleResetAllChats = async () => {
    await clearAllConversations();
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

  const handleExportConversation = async (conversationId: string, format: 'markdown' | 'pdf') => {
    const conversation = dbConversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const msgs = await fetchMessages(conversationId);
    if (msgs.length === 0) {
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
          messages: msgs,
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
          messages: msgs,
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
      updateConversation(activeConversationId, { title });
    }
  }, [messages, activeConversationId]);

  const hasMessages = messages.length > 0;

  // Show loading state while checking auth
  if (loading || dbLoading) {
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

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    return user.email?.slice(0, 2).toUpperCase() || 'U';
  };

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

      {/* Profile Dialog */}
      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      {/* Learning Preferences Dialog */}
      <LearningPreferencesDialog
        open={learningPrefsOpen}
        onOpenChange={setLearningPrefsOpen}
        preferences={preferences}
        onSave={updatePreferences}
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
            <ImageGenerationButton
              remainingGenerations={remainingGenerations}
              canGenerate={canGenerate}
              isGenerating={isGenerating}
              onGenerate={generateImage}
              onImageGenerated={(imageUrl, prompt) => {
                const imageMessage: Message = {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: `![Generated Image](${imageUrl})\n\n*Generated from: "${prompt}"*`,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, imageMessage]);
                toast({
                  title: "Image generated!",
                  description: "Your AI-generated image has been added to the chat."
                });
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLearningPrefsOpen(true)}
              title="Learning preferences"
            >
              <Brain className="w-5 h-5" />
            </Button>
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
              onClick={() => setProfileOpen(true)}
              title="Edit profile"
            >
              <Avatar className="w-7 h-7">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
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
