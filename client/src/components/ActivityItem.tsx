import { BookOpen, CheckCircle, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItemProps {
  activity: {
    id: string;
    type: 'course_enrollment' | 'quiz_completed' | 'badge_earned';
    title: string;
    date: string;
  };
}

const activityConfig = {
  course_enrollment: {
    icon: BookOpen,
    text: 'Enrolled in',
    color: 'text-blue-500',
  },
  quiz_completed: {
    icon: CheckCircle,
    text: 'Completed quiz',
    color: 'text-green-500',
  },
  badge_earned: {
    icon: Trophy,
    text: 'Earned badge',
    color: 'text-yellow-500',
  },
};

export default function ActivityItem({ activity }: ActivityItemProps) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start space-x-4 p-3 hover:bg-primary/10 rounded-lg transition-colors duration-200">
      <div className={`mt-1 ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm">
          {config.text}{' '}
          <span className="font-semibold">{activity.title}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
