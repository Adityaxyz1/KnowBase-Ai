import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfidenceIndicatorProps {
  level: 'high' | 'medium' | 'low';
  className?: string;
  showLabel?: boolean;
}

const confidenceConfig = {
  high: {
    label: 'High confidence',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    bars: 3,
  },
  medium: {
    label: 'Medium confidence',
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    bars: 2,
  },
  low: {
    label: 'Low confidence',
    color: 'bg-rose-500',
    textColor: 'text-rose-400',
    bars: 1,
  },
};

export function ConfidenceIndicator({ 
  level, 
  className,
  showLabel = true 
}: ConfidenceIndicatorProps) {
  const config = confidenceConfig[level];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3].map((bar) => (
          <motion.div
            key={bar}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: bar * 0.1, duration: 0.2 }}
            className={cn(
              'w-1 rounded-full origin-bottom',
              bar === 1 ? 'h-2' : bar === 2 ? 'h-3' : 'h-4',
              bar <= config.bars ? config.color : 'bg-muted-foreground/20'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn('text-xs', config.textColor)}>
          {config.label}
        </span>
      )}
    </div>
  );
}
