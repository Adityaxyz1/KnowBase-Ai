import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSyncOptions {
  userId: string | undefined;
  onConversationChange?: (payload: any) => void;
  onMessageChange?: (payload: any) => void;
}

export const useRealtimeSync = ({
  userId,
  onConversationChange,
  onMessageChange
}: RealtimeSyncOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const setupRealtimeSubscription = useCallback(() => {
    if (!userId) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create a new channel for real-time updates
    const channel = supabase
      .channel(`user-data-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Conversation change:', payload);
          onConversationChange?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Message change:', payload);
          onMessageChange?.(payload);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, onConversationChange, onMessageChange]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup?.();
    };
  }, [setupRealtimeSubscription]);

  return {
    isSubscribed: !!channelRef.current
  };
};
