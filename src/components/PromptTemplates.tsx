import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  Scale, 
  Search, 
  Wand2, 
  Bug,
  GraduationCap,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  prefix: string;
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: 'explain',
    name: 'Explain',
    description: 'Break down complex topics',
    icon: <Lightbulb className="w-4 h-4" />,
    prefix: 'Explain this concept clearly: ',
  },
  {
    id: 'compare',
    name: 'Compare',
    description: 'Analyze differences',
    icon: <Scale className="w-4 h-4" />,
    prefix: 'Compare and contrast: ',
  },
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Deep dive analysis',
    icon: <Search className="w-4 h-4" />,
    prefix: 'Provide a detailed analysis of: ',
  },
  {
    id: 'generate',
    name: 'Generate',
    description: 'Create content',
    icon: <Wand2 className="w-4 h-4" />,
    prefix: 'Generate: ',
  },
  {
    id: 'debug',
    name: 'Debug',
    description: 'Find issues',
    icon: <Bug className="w-4 h-4" />,
    prefix: 'Help me debug this: ',
  },
];

export const styleModifiers = [
  {
    id: 'eli5',
    name: 'ELI5',
    description: 'Explain like I\'m 5',
    icon: <GraduationCap className="w-4 h-4" />,
    suffix: ' Explain it simply, as if to a 5-year-old.',
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'In-depth technical',
    icon: <Sparkles className="w-4 h-4" />,
    suffix: ' Use technical terminology and be precise.',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Executive summary',
    icon: <Briefcase className="w-4 h-4" />,
    suffix: ' Frame this in business terms with actionable insights.',
  },
];

interface PromptTemplatesProps {
  onSelect: (template: PromptTemplate) => void;
  selectedId?: string;
  className?: string;
}

export function PromptTemplates({ 
  onSelect, 
  selectedId,
  className 
}: PromptTemplatesProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {promptTemplates.map((template, index) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Button
            variant={selectedId === template.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(template)}
            className="gap-1.5"
          >
            {template.icon}
            {template.name}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

interface StyleModifiersProps {
  onSelect: (modifier: typeof styleModifiers[0]) => void;
  selectedId?: string;
  className?: string;
}

export function StyleModifiers({
  onSelect,
  selectedId,
  className
}: StyleModifiersProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {styleModifiers.map((modifier) => (
        <Button
          key={modifier.id}
          variant={selectedId === modifier.id ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onSelect(modifier)}
          className="gap-1.5 text-xs"
        >
          {modifier.icon}
          {modifier.name}
        </Button>
      ))}
    </div>
  );
}
