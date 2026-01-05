import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Shield, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KnowledgeOrb } from '@/components/KnowledgeOrb';

interface EmptyStateProps {
  onStartChat: () => void;
}

const features = [
  {
    icon: Brain,
    title: 'Deep Understanding',
    description: 'Context-aware responses that build on your conversation'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get answers in seconds, not minutes'
  },
  {
    icon: Shield,
    title: 'Source Verified',
    description: 'Every answer backed by traceable reasoning'
  }
];

const suggestedQuestions = [
  'Explain quantum computing in simple terms',
  'Compare React vs Vue for enterprise apps',
  'Help me understand machine learning basics',
  'What are the key principles of good UX design?'
];

export function EmptyState({ onStartChat }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <div className="w-[500px] h-[500px]">
          <KnowledgeOrb isActive={false} isThinking={false} />
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-2xl mx-auto text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          Powered by Advanced AI
        </motion.div>

        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Your Intelligent
          <span className="gradient-text block">Knowledge Companion</span>
        </h1>

        <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
          Ask anything, upload documents, and get clear explanations with 
          step-by-step reasoning you can trust.
        </p>

        <Button
          size="xl"
          variant="hero"
          onClick={onStartChat}
          className="group"
        >
          Start Exploring
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-3xl w-full"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="glass-panel rounded-xl p-5 card-hover"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium mb-1">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Suggested questions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 mt-12"
      >
        <p className="text-xs uppercase tracking-wider text-muted-foreground text-center mb-3">
          Try asking
        </p>
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
          {suggestedQuestions.map((question, index) => (
            <motion.button
              key={question}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              onClick={onStartChat}
              className="px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {question}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
