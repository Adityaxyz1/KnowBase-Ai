import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Message } from '@/components/MessageBubble';

export interface DbConversation {
  id: string;
  user_id: string;
  space_id: string | null;
  title: string;
  preview: string | null;
  starred: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence: number | null;
  attachments: any;
  created_at: string;
}

export interface DbKnowledgeSpace {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [knowledgeSpaces, setKnowledgeSpaces] = useState<DbKnowledgeSpace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
  }, [user]);

  const fetchKnowledgeSpaces = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('knowledge_spaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setKnowledgeSpaces(data);
    }
  }, [user]);

  // Handle real-time conversation updates
  const handleConversationChange = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      setConversations(prev => {
        const exists = prev.some(c => c.id === payload.new.id);
        if (exists) return prev;
        return [payload.new, ...prev];
      });
    } else if (payload.eventType === 'UPDATE') {
      setConversations(prev => 
        prev.map(c => c.id === payload.new.id ? payload.new : c)
      );
    } else if (payload.eventType === 'DELETE') {
      setConversations(prev => 
        prev.filter(c => c.id !== payload.old.id)
      );
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchConversations(), fetchKnowledgeSpaces()])
        .finally(() => setLoading(false));

      // Set up real-time subscription
      const channel = supabase
        .channel(`conversations-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `user_id=eq.${user.id}`
          },
          handleConversationChange
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setConversations([]);
      setKnowledgeSpaces([]);
      setLoading(false);
    }
  }, [user, fetchConversations, fetchKnowledgeSpaces, handleConversationChange]);

  const createConversation = async (title: string = 'New Chat', preview?: string) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title, preview })
      .select()
      .single();

    if (!error && data) {
      setConversations(prev => [data, ...prev]);
    }
    return { data, error };
  };

  const updateConversation = async (id: string, updates: Partial<DbConversation>) => {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setConversations(prev => prev.map(c => c.id === id ? data : c));
    }
    return { data, error };
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== id));
    }
    return { error };
  };

  const clearAllConversations = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setConversations([]);
    }
    return { error };
  };

  // Messages
  const fetchMessages = async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.created_at),
      confidence: m.confidence ? (m.confidence >= 0.7 ? 'high' : m.confidence >= 0.4 ? 'medium' : 'low') as 'high' | 'medium' | 'low' : undefined,
      attachments: m.attachments as any
    }));
  };

  const addMessage = async (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    // Convert confidence to number
    const confidenceMap: Record<string, number> = { high: 0.9, medium: 0.6, low: 0.3 };
    const confidenceNum = message.confidence ? confidenceMap[message.confidence] : null;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: message.role,
        content: message.content,
        confidence: confidenceNum,
        attachments: message.attachments ?? null
      } as any)
      .select()
      .single();

    return { data, error };
  };

  const updateMessage = async (id: string, updates: { content?: string; confidence?: number }) => {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  };

  // Knowledge Spaces
  const createSpace = async (name: string, color: string) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('knowledge_spaces')
      .insert({ user_id: user.id, name, color })
      .select()
      .single();

    if (!error && data) {
      setKnowledgeSpaces(prev => [...prev, data]);
    }
    return { data, error };
  };

  const updateSpace = async (id: string, updates: { name?: string; color?: string }) => {
    const { data, error } = await supabase
      .from('knowledge_spaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setKnowledgeSpaces(prev => prev.map(s => s.id === id ? data : s));
    }
    return { data, error };
  };

  const deleteSpace = async (id: string) => {
    const { error } = await supabase
      .from('knowledge_spaces')
      .delete()
      .eq('id', id);

    if (!error) {
      setKnowledgeSpaces(prev => prev.filter(s => s.id !== id));
    }
    return { error };
  };

  return {
    conversations,
    knowledgeSpaces,
    loading,
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
    refetch: () => Promise.all([fetchConversations(), fetchKnowledgeSpaces()])
  };
}
