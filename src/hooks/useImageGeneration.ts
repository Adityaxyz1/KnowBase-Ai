import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DAILY_LIMIT = 2;
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const useImageGeneration = (userId: string | undefined) => {
  const [dailyCount, setDailyCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDailyCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_daily_image_count', {
        p_user_id: userId
      });
      
      if (error) throw error;
      setDailyCount(data || 0);
    } catch (error) {
      console.error('Error fetching daily count:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDailyCount();
  }, [fetchDailyCount]);

  const generateImage = async (prompt: string): Promise<{ imageUrl: string; textResponse?: string } | null> => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate images.",
        variant: "destructive"
      });
      return null;
    }

    if (dailyCount >= DAILY_LIMIT) {
      toast({
        title: "Daily limit reached",
        description: `You can generate ${DAILY_LIMIT} images per day. Try again tomorrow!`,
        variant: "destructive"
      });
      return null;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          generateImage: { prompt }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();

      // Record the usage
      const { error: insertError } = await supabase
        .from('image_generation_usage')
        .insert({
          user_id: userId,
          prompt,
          image_url: data.imageUrl
        });

      if (insertError) {
        console.error('Error recording image usage:', insertError);
      }

      setDailyCount(prev => prev + 1);

      toast({
        title: "Image generated!",
        description: `You have ${DAILY_LIMIT - dailyCount - 1} generations remaining today.`
      });

      return {
        imageUrl: data.imageUrl,
        textResponse: data.textResponse
      };
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    dailyCount,
    remainingGenerations: DAILY_LIMIT - dailyCount,
    isGenerating,
    loading,
    generateImage,
    canGenerate: dailyCount < DAILY_LIMIT
  };
};
