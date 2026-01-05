import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PanelRightOpen, PanelRightClose, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { ChatInput } from '@/components/ChatInput';
import { MessageList, type Message } from '@/components/MessageBubble';
import { ContextPanel } from '@/components/ContextPanel';
import { EmptyState } from '@/components/EmptyState';
import { KnowledgeOrb } from '@/components/KnowledgeOrb';
import { cn } from '@/lib/utils';

// Mock data
const mockConversations = [
  {
    id: '1',
    title: 'Understanding Neural Networks',
    preview: 'Can you explain how backpropagation works...',
    timestamp: new Date(),
    starred: true,
  },
  {
    id: '2',
    title: 'React Performance Tips',
    preview: 'What are the best practices for...',
    timestamp: new Date(Date.now() - 86400000),
  },
  {
    id: '3',
    title: 'API Design Patterns',
    preview: 'Compare REST vs GraphQL for...',
    timestamp: new Date(Date.now() - 172800000),
  },
];

const mockSpaces = [
  { id: '1', name: 'Research', color: '#00d4ff', conversationCount: 12 },
  { id: '2', name: 'Work Projects', color: '#ff6b6b', conversationCount: 8 },
  { id: '3', name: 'Learning', color: '#ffd93d', conversationCount: 5 },
];

const mockReasoning = [
  { id: '1', title: 'Analyzed question context', description: 'Identified key concepts and intent' },
  { id: '2', title: 'Retrieved relevant knowledge', description: 'Searched knowledge base for related topics' },
  { id: '3', title: 'Synthesized response', description: 'Combined information into coherent answer' },
];

const mockSources = [
  { id: '1', title: 'Machine Learning Fundamentals', type: 'document' as const },
  { id: '2', title: 'Wikipedia: Neural Networks', url: 'https://wikipedia.org', type: 'web' as const },
];

const mockKeyPoints = [
  { id: '1', text: 'Neural networks are inspired by biological neurons' },
  { id: '2', text: 'Backpropagation adjusts weights based on error gradients' },
  { id: '3', text: 'Deep learning uses multiple hidden layers' },
];

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    setContextOpen(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: generateMockResponse(content),
      timestamp: new Date(),
      confidence: Math.random() > 0.5 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
    };

    setIsThinking(false);
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveConversationId(undefined);
    setContextOpen(false);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-screen flex bg-background overflow-hidden dark">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          conversations={mockConversations}
          knowledgeSpaces={mockSpaces}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={setActiveConversationId}
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
                <EmptyState onStartChat={() => {}} />
                <div className="p-4 surface-elevated">
                  <div className="max-w-3xl mx-auto">
                    <ChatInput onSend={handleSend} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Context panel */}
          <ContextPanel
            isOpen={contextOpen && hasMessages}
            onClose={() => setContextOpen(false)}
            reasoning={mockReasoning}
            sources={mockSources}
            keyPoints={mockKeyPoints}
          />
        </div>
      </main>
    </div>
  );
}

function generateMockResponse(query: string): string {
  const responses = [
    `Great question! Let me break this down for you.

## Overview

${query.includes('neural') || query.includes('machine learning') 
  ? `Neural networks are computational systems inspired by the biological neural networks in our brains. They consist of interconnected nodes (neurons) organized in layers.`
  : `This is a fascinating topic that touches on several key concepts. Let me explain the core ideas and how they connect.`}

### Key Concepts

1. **Foundation**: Understanding the basics is crucial for building more complex knowledge
2. **Application**: These principles can be applied in various real-world scenarios
3. **Best Practices**: Following established patterns leads to better outcomes

### Example

\`\`\`javascript
// Here's a simple demonstration
const example = {
  concept: "learning",
  approach: "step-by-step",
  outcome: "understanding"
};
\`\`\`

### Summary

The key takeaway is that complex topics become manageable when broken down into smaller, digestible pieces. Each component builds upon the previous one, creating a solid foundation of knowledge.

Would you like me to dive deeper into any specific aspect?`,
  ];

  return responses[0];
}
