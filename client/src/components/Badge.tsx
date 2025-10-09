interface BadgeProps {
  name: string;
  iconClass: string;
  color: string;
  earned: boolean;
  description?: string;
}

export default function Badge({ name, iconClass, color, earned, description }: BadgeProps) {
  return (
    <div className={`flex flex-col items-center ${earned ? 'animate-pulse' : 'opacity-40'}`}>
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${
          earned 
            ? `shadow-lg` 
            : 'bg-muted/20 border-2 border-dashed border-muted'
        }`}
        style={{
          background: earned 
            ? `linear-gradient(135deg, ${color}, ${color}aa)` 
            : undefined,
          boxShadow: earned 
            ? `0 0 20px ${color}33` 
            : undefined,
        }}
      >
        <i 
          className={`${iconClass} ${earned ? 'text-white' : 'text-muted-foreground'}`}
          data-testid={`badge-${name.toLowerCase().replace(/\s+/g, '-')}`}
        />
      </div>
      <span className={`text-xs text-center font-medium ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
        {name}
      </span>
      {description && (
        <span className="text-xs text-muted-foreground text-center mt-1">
          {description}
        </span>
      )}
    </div>
  );
}
