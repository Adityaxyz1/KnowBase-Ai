import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LearningAnalytics {
  quiz_accuracy: number | null;
  response_time_ms: number | null;
  engagement_score: number | null;
  topic: string | null;
  learning_style: string | null;
  difficulty_level: string;
}

interface UserPreferences {
  preferred_learning_style: string;
  preferred_examples: string;
  difficulty_preference: string;
  gamification_enabled: boolean;
}

export const useLearningAnalytics = (userId: string | undefined) => {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return;

    try {
      // Get the most recent learning analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analyticsError) throw analyticsError;

      // Get user preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (prefsError && prefsError.code !== 'PGRST116') throw prefsError;

      setAnalytics(analyticsData);
      setPreferences(prefsData);
    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const trackInteraction = async (
    conversationId: string,
    data: Partial<LearningAnalytics>
  ) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('learning_analytics')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          ...data
        });

      if (error) throw error;
      
      // Refresh analytics
      fetchAnalytics();
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!userId) return;

    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update(newPrefs)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            ...newPrefs
          });
        if (error) throw error;
      }

      setPreferences(prev => prev ? { ...prev, ...newPrefs } : newPrefs as UserPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  // Calculate adaptive difficulty based on recent performance
  const getRecommendedDifficulty = useCallback(() => {
    if (!analytics?.quiz_accuracy) return 'medium';
    
    if (analytics.quiz_accuracy >= 80) return 'hard';
    if (analytics.quiz_accuracy >= 50) return 'medium';
    return 'easy';
  }, [analytics]);

  return {
    analytics,
    preferences,
    loading,
    trackInteraction,
    updatePreferences,
    getRecommendedDifficulty,
    refetch: fetchAnalytics
  };
};
