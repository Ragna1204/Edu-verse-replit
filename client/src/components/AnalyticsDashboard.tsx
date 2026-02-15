import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const { data: analyticsSummary, isLoading: summaryLoading } = useQuery<any[]>({
    queryKey: ['/api/user/analytics/summary'],
    enabled: isAuthenticated && !isLoading,
    retry: false,
  });

  const { data: accuracyByTopic, isLoading: accuracyLoading } = useQuery<any[]>({
    queryKey: ['/api/user/analytics/accuracy-by-topic'],
    enabled: isAuthenticated && !isLoading,
    retry: false,
  });

  if (summaryLoading || accuracyLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* XP Gained (Daily) */}
      <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
        <CardHeader>
          <CardTitle>XP Gained</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Bar
                dataKey="xpEarned"
                name="XP Earned"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accuracy Rate */}
      <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
        <CardHeader>
          <CardTitle>Accuracy Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${Math.round(value)}%`, 'Accuracy']}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="accuracyRate"
                name="Accuracy"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Time Spent (Replacing Accuracy Per Topic) */}
      <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
        <CardHeader>
          <CardTitle>Time Spent (Minutes)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Bar
                dataKey="timeSpent"
                name="Minutes"
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Streak */}
      <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 flex flex-col items-center justify-center p-6">
        <CardTitle className="mb-4">Daily Streak</CardTitle>
        <div className="text-6xl font-bold text-accent mb-2">
          {user?.streak || 0}
        </div>
        <p className="text-muted-foreground">Consecutive days of learning</p>
      </Card>
    </div>
  );
}
