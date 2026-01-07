import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PanelRightOpen, PanelRightClose, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { ChatInput, type ChatInputHandle } from '@/components/ChatInput';
import { MessageList, type Message } from '@/components/MessageBubble';
import { ContextPanel } from '@/components/ContextPanel';
import { EmptyState } from '@/components/EmptyState';
import { KnowledgeOrb } from '@/components/KnowledgeOrb';
import { streamChat, analyzeConfidence, type ChatMessage } from '@/lib/chat';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  starred?: boolean;
  messages: Message[];
}

const mockSpaces = [
  { id: '1', name: 'Research', color: '#00d4ff', conversationCount: 12 },
  { id: '2', name: 'Work Projects', color: '#ff6b6b', conversationCount: 8 },
  { id: '3', name: 'Learning', color: '#ffd93d', conversationCount: 5 },
];

export default function Index() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [reasoning, setReasoning] = useState<{ id: string; title: string; description: string }[]>([]);
  const [keyPoints, setKeyPoints] = useState<{ id: string; text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    setContextOpen(true);

    // Set reasoning steps
    setReasoning([
      { id: '1', title: 'Analyzing question', description: 'Understanding context and intent' },
      { id: '2', title: 'Retrieving knowledge', description: 'Searching relevant information' },
      { id: '3', title: 'Generating response', description: 'Synthesizing comprehensive answer' },
    ]);

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

  return (
    <div className="h-screen flex bg-background overflow-hidden dark">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          conversations={conversations}
          knowledgeSpaces={mockSpaces}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onSelectSpace={() => {}}
        />
      )}

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
                <span className="font-display font-semibold">Knowbase</span>
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
