import { useState, useEffect } from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  gradient?: "primary" | "secondary" | "accent";
}

export default function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  className = "",
  gradient = "primary"
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setAnimatedProgress(progress));
    return () => cancelAnimationFrame(animation);
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  const gradientColors = {
    primary: { from: "hsl(243 75% 59%)", to: "hsl(188 94% 43%)" },
    secondary: { from: "hsl(188 94% 43%)", to: "hsl(142 76% 36%)" },
    accent: { from: "hsl(38 92% 50%)", to: "hsl(328 86% 70%)" },
  };

  const colors = gradientColors[gradient];

  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id={`gradient-${gradient}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(217 33% 24%)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gradient-${gradient})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Progress text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">
          {Math.round(animatedProgress)}%
        </span>
      </div>
    </div>
  );
}
