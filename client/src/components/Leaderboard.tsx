import { Card, CardContent } from '@/components/ui/card';

export function Leaderboard() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">Coming soon! See how you rank against other learners</p>
        </div>

        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="text-6xl text-muted-foreground mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Leaderboard Coming Soon</h3>
            <p className="text-muted-foreground">
              Compete with fellow learners and climb the ranks! This feature is under development.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
