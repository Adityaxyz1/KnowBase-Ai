import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Trophy, 
  Target,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizGeneratorProps {
  topic: string;
  conversationId?: string;
  userId?: string;
  onComplete?: (score: number, total: number) => void;
  onClose?: () => void;
}

export const QuizGenerator = ({
  topic,
  conversationId,
  userId,
  onComplete,
  onClose
}: QuizGeneratorProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  useEffect(() => {
    generateQuiz();
  }, [topic]);

  const generateQuiz = async () => {
    setIsLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsComplete(false);
    setResponseTimes([]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: `Generate a quiz with 5 multiple choice questions about "${topic}". 
                
Return ONLY a valid JSON array with this exact structure (no other text):
[
  {
    "id": "1",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

Make questions progressively harder. Ensure correctIndex is 0-3 matching the correct option position.`
              }
            ]
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate quiz');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let fullContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch {}
          }
        }
      }

      // Extract JSON from response
      const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setQuestions(parsed);
        setStartTime(Date.now());
      } else {
        throw new Error('Could not parse quiz questions');
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      // Generate fallback questions
      setQuestions([
        {
          id: '1',
          question: `What is the main concept of ${topic}?`,
          options: ['Understanding the basics', 'Advanced implementation', 'Historical context', 'Future predictions'],
          correctIndex: 0,
          explanation: 'Understanding basics is fundamental to learning any topic.'
        }
      ]);
      setStartTime(Date.now());
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    
    const responseTime = Date.now() - startTime;
    setResponseTimes(prev => [...prev, responseTime]);
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === questions[currentIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setStartTime(Date.now());
    } else {
      setIsComplete(true);
      
      // Save analytics
      if (userId && conversationId) {
        const accuracy = (score / questions.length) * 100;
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        
        await supabase.from('learning_analytics').insert({
          user_id: userId,
          conversation_id: conversationId,
          quiz_accuracy: accuracy,
          response_time_ms: Math.round(avgResponseTime),
          engagement_score: Math.min(100, accuracy + (avgResponseTime < 10000 ? 20 : 0)),
          topic: topic,
          difficulty_level: accuracy > 80 ? 'hard' : accuracy > 50 ? 'medium' : 'easy'
        });
      }

      onComplete?.(score, questions.length);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Generating quiz questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl font-bold text-primary mb-2"
            >
              {percentage}%
            </motion.div>
            <p className="text-muted-foreground">
              You got {score} out of {questions.length} correct
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Accuracy</span>
              <Badge variant={percentage >= 70 ? 'default' : 'secondary'}>
                {percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Keep practicing'}
              </Badge>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={generateQuiz} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            {onClose && (
              <Button onClick={onClose}>
                Continue Learning
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{score} correct</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-medium leading-relaxed">
            {currentQuestion?.question}
          </h3>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctIndex;
              const showCorrectness = showResult;

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAnswer(index)}
                  disabled={showResult}
                  className={cn(
                    'w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3',
                    !showResult && 'hover:border-primary hover:bg-primary/5',
                    showCorrectness && isCorrect && 'border-green-500 bg-green-500/10',
                    showCorrectness && isSelected && !isCorrect && 'border-red-500 bg-red-500/10',
                    !showCorrectness && isSelected && 'border-primary bg-primary/10'
                  )}
                >
                  <span className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium',
                    showCorrectness && isCorrect && 'border-green-500 bg-green-500 text-white',
                    showCorrectness && isSelected && !isCorrect && 'border-red-500 bg-red-500 text-white',
                    !showCorrectness && 'border-muted-foreground/30'
                  )}>
                    {showCorrectness && isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : showCorrectness && isSelected && !isCorrect ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </span>
                  <span className="flex-1">{option}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-muted/50 border"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm mb-1">Explanation</p>
                <p className="text-sm text-muted-foreground">
                  {currentQuestion?.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {showResult && (
          <Button onClick={handleNext} className="w-full">
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
