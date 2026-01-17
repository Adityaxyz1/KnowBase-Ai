import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, BookOpen, Gamepad2, Target } from 'lucide-react';

interface LearningPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: {
    preferred_learning_style: string;
    preferred_examples: string;
    difficulty_preference: string;
    gamification_enabled: boolean;
  } | null;
  onSave: (preferences: {
    preferred_learning_style: string;
    preferred_examples: string;
    difficulty_preference: string;
    gamification_enabled: boolean;
  }) => void;
}

export const LearningPreferencesDialog = ({
  open,
  onOpenChange,
  preferences,
  onSave
}: LearningPreferencesDialogProps) => {
  const [learningStyle, setLearningStyle] = useState('textual');
  const [examples, setExamples] = useState('general');
  const [difficulty, setDifficulty] = useState('adaptive');
  const [gamification, setGamification] = useState(true);

  useEffect(() => {
    if (preferences) {
      setLearningStyle(preferences.preferred_learning_style || 'textual');
      setExamples(preferences.preferred_examples || 'general');
      setDifficulty(preferences.difficulty_preference || 'adaptive');
      setGamification(preferences.gamification_enabled ?? true);
    }
  }, [preferences]);

  const handleSave = () => {
    onSave({
      preferred_learning_style: learningStyle,
      preferred_examples: examples,
      difficulty_preference: difficulty,
      gamification_enabled: gamification
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Learning Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Learning Style
            </Label>
            <Select value={learningStyle} onValueChange={setLearningStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="textual">Textual - Detailed explanations</SelectItem>
                <SelectItem value="visual">Visual - Diagrams & charts</SelectItem>
                <SelectItem value="practical">Practical - Hands-on examples</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How you prefer to receive information
            </p>
          </div>

          <div className="space-y-2">
            <Label>Example Types</Label>
            <Select value={examples} onValueChange={setExamples}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General examples</SelectItem>
                <SelectItem value="sports">Sports (cricket, football, etc.)</SelectItem>
                <SelectItem value="technology">Technology & computing</SelectItem>
                <SelectItem value="daily_life">Daily life situations</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Relatable examples to explain concepts
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Difficulty Level
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adaptive">Adaptive - Adjusts automatically</SelectItem>
                <SelectItem value="easy">Easy - Simple explanations</SelectItem>
                <SelectItem value="medium">Medium - Balanced complexity</SelectItem>
                <SelectItem value="hard">Hard - Advanced concepts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-primary" />
              <div>
                <Label htmlFor="gamification" className="cursor-pointer">
                  Gamification
                </Label>
                <p className="text-xs text-muted-foreground">
                  Points, achievements & progress
                </p>
              </div>
            </div>
            <Switch
              id="gamification"
              checked={gamification}
              onCheckedChange={setGamification}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
