import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  FileText, 
  Link, 
  Lightbulb,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReasoningStep {
  id: string;
  title: string;
  description: string;
}

interface Source {
  id: string;
  title: string;
  url?: string;
  type: 'document' | 'web' | 'knowledge';
}

interface KeyPoint {
  id: string;
  text: string;
}

interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  reasoning?: ReasoningStep[];
  sources?: Source[];
  keyPoints?: KeyPoint[];
  className?: string;
}

export function ContextPanel({
  isOpen,
  onClose,
  reasoning = [],
  sources = [],
  keyPoints = [],
  className
}: ContextPanelProps) {
  const hasContent = reasoning.length > 0 || sources.length > 0 || keyPoints.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'h-full border-l border-border bg-card overflow-hidden flex flex-col',
            className
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display font-semibold">Context</h3>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
            {!hasContent && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Context will appear here as you chat
                </p>
              </div>
            )}

            {reasoning.length > 0 && (
              <section>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  Reasoning Steps
                </h4>
                <div className="space-y-2">
                  {reasoning.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {sources.length > 0 && (
              <section>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  Sources
                </h4>
                <div className="space-y-2">
                  {sources.map((source) => (
                    <motion.a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {source.type === 'document' ? (
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Link className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm truncate flex-1 group-hover:text-primary transition-colors">
                        {source.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.a>
                  ))}
                </div>
              </section>
            )}

            {keyPoints.length > 0 && (
              <section>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  Key Points
                </h4>
                <ul className="space-y-2">
                  {keyPoints.map((point) => (
                    <motion.li
                      key={point.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{point.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
