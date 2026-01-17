-- Create image generation usage tracking table
CREATE TABLE public.image_generation_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  prompt TEXT NOT NULL,
  image_url TEXT
);

-- Enable RLS
ALTER TABLE public.image_generation_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for image generation usage
CREATE POLICY "Users can view their own image usage"
  ON public.image_generation_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own image usage"
  ON public.image_generation_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create learning analytics table for personalized learning
CREATE TABLE public.learning_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  quiz_accuracy DECIMAL(5,2),
  response_time_ms INTEGER,
  engagement_score DECIMAL(5,2),
  topic TEXT,
  learning_style TEXT,
  difficulty_level TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning analytics
CREATE POLICY "Users can view their own learning analytics"
  ON public.learning_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning analytics"
  ON public.learning_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning analytics"
  ON public.learning_analytics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create user preferences table for personalization
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_learning_style TEXT DEFAULT 'textual',
  preferred_examples TEXT DEFAULT 'general',
  difficulty_preference TEXT DEFAULT 'adaptive',
  gamification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create function to count daily image generations
CREATE OR REPLACE FUNCTION public.get_daily_image_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.image_generation_usage
    WHERE user_id = p_user_id
    AND generated_at >= CURRENT_DATE
    AND generated_at < CURRENT_DATE + INTERVAL '1 day'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for user_preferences updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();