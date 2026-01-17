import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  Target,
  Clock,
  Zap,
  Award,
  Brain,
  BookOpen,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface ProgressDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
}

interface AnalyticsData {
  date: string;
  accuracy: number;
  engagement: number;
  responseTime: number;
}

interface Stats {
  totalQuizzes: number;
  averageAccuracy: number;
  averageEngagement: number;
  averageResponseTime: number;
  topTopics: { topic: string; count: number }[];
  streak: number;
}

export const ProgressDashboard = ({
  open,
  onOpenChange,
  userId
}: ProgressDashboardProps) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      fetchAnalytics();
    }
  }, [open, userId]);

  const fetchAnalytics = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Fetch learning analytics for the past 30 days
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process data for charts
      const groupedByDate = data?.reduce((acc, item) => {
        const date = format(new Date(item.created_at), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { accuracies: [], engagements: [], responseTimes: [] };
        }
        if (item.quiz_accuracy) acc[date].accuracies.push(item.quiz_accuracy);
        if (item.engagement_score) acc[date].engagements.push(item.engagement_score);
        if (item.response_time_ms) acc[date].responseTimes.push(item.response_time_ms);
        return acc;
      }, {} as Record<string, { accuracies: number[]; engagements: number[]; responseTimes: number[] }>);

      const chartData = Object.entries(groupedByDate || {}).map(([date, values]) => ({
        date,
        accuracy: values.accuracies.length 
          ? Math.round(values.accuracies.reduce((a, b) => a + b, 0) / values.accuracies.length)
          : 0,
        engagement: values.engagements.length
          ? Math.round(values.engagements.reduce((a, b) => a + b, 0) / values.engagements.length)
          : 0,
        responseTime: values.responseTimes.length
          ? Math.round(values.responseTimes.reduce((a, b) => a + b, 0) / values.responseTimes.length / 1000)
          : 0
      }));

      setAnalyticsData(chartData);

      // Calculate stats
      const allAccuracies = data?.filter(d => d.quiz_accuracy).map(d => d.quiz_accuracy!) || [];
      const allEngagements = data?.filter(d => d.engagement_score).map(d => d.engagement_score!) || [];
      const allResponseTimes = data?.filter(d => d.response_time_ms).map(d => d.response_time_ms!) || [];

      // Get top topics
      const topicCounts = data?.reduce((acc, item) => {
        if (item.topic) {
          acc[item.topic] = (acc[item.topic] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const topTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalQuizzes: data?.length || 0,
        averageAccuracy: allAccuracies.length 
          ? Math.round(allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length)
          : 0,
        averageEngagement: allEngagements.length
          ? Math.round(allEngagements.reduce((a, b) => a + b, 0) / allEngagements.length)
          : 0,
        averageResponseTime: allResponseTimes.length
          ? Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length / 1000)
          : 0,
        topTopics,
        streak: calculateStreak(data || [])
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (data: any[]): number => {
    if (!data.length) return 0;
    
    const dates = [...new Set(data.map(d => format(new Date(d.created_at), 'yyyy-MM-dd')))].sort().reverse();
    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = format(subDays(new Date(today), i), 'yyyy-MM-dd');
      if (dates[i] === expectedDate) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 80) return { label: 'Expert', color: 'text-green-500' };
    if (accuracy >= 60) return { label: 'Proficient', color: 'text-blue-500' };
    if (accuracy >= 40) return { label: 'Developing', color: 'text-yellow-500' };
    return { label: 'Beginner', color: 'text-orange-500' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Learning Progress Dashboard
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="h-8 w-8 text-primary" />
            </motion.div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Accuracy</span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.averageAccuracy || 0}%</div>
                  <Badge className={getPerformanceLevel(stats?.averageAccuracy || 0).color}>
                    {getPerformanceLevel(stats?.averageAccuracy || 0).label}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Engagement</span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.averageEngagement || 0}/100</div>
                  <Progress value={stats?.averageEngagement || 0} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Avg Response</span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.averageResponseTime || 0}s</div>
                  <span className="text-xs text-muted-foreground">per question</span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Streak</span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.streak || 0} days</div>
                  <span className="text-xs text-muted-foreground">Keep it up!</span>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="accuracy" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
                <TabsTrigger value="response">Response Time</TabsTrigger>
              </TabsList>

              <TabsContent value="accuracy" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quiz Accuracy Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={analyticsData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis domain={[0, 100]} className="text-xs" />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="accuracy" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary) / 0.2)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Complete quizzes to see your progress!</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engagement" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Engagement Score Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analyticsData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis domain={[0, 100]} className="text-xs" />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="engagement" 
                            stroke="hsl(var(--accent))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--accent))' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No engagement data yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="response" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Average Response Time (seconds)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analyticsData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Bar 
                            dataKey="responseTime" 
                            fill="hsl(var(--primary))" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No response time data yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Top Topics */}
            {stats?.topTopics && stats.topTopics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Most Studied Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topTopics.map((topic, index) => (
                      <div key={topic.topic} className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="flex-1 truncate">{topic.topic}</span>
                        <Badge variant="secondary">{topic.count} sessions</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
