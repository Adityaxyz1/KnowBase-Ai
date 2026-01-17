import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, TrendingUp, Zap } from 'lucide-react';

interface LearningInsightsProps {
  analytics: {
    quiz_accuracy: number | null;
    response_time_ms: number | null;
    engagement_score: number | null;
    topic: string | null;
    difficulty_level: string;
  } | null;
  recommendedDifficulty: string;
}

export const LearningInsights = ({ analytics, recommendedDifficulty }: LearningInsightsProps) => {
  if (!analytics) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start learning to see your insights!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-primary/20 text-primary';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Learning Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {analytics.quiz_accuracy !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Accuracy
              </span>
              <span className="font-medium">{analytics.quiz_accuracy}%</span>
            </div>
            <Progress value={analytics.quiz_accuracy} className="h-2" />
          </div>
        )}

        {analytics.engagement_score !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Engagement
              </span>
              <span className="font-medium">{analytics.engagement_score}/100</span>
            </div>
            <Progress value={analytics.engagement_score} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Recommended Level</span>
          <Badge className={getDifficultyColor(recommendedDifficulty)}>
            {recommendedDifficulty}
          </Badge>
        </div>

        {analytics.topic && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Topic</span>
            <Badge variant="outline">{analytics.topic}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
