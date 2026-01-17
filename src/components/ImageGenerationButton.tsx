import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImageGenerationButtonProps {
  remainingGenerations: number;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: (prompt: string) => Promise<{ imageUrl: string; textResponse?: string } | null>;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
}

export const ImageGenerationButton = ({
  remainingGenerations,
  canGenerate,
  isGenerating,
  onGenerate,
  onImageGenerated
}: ImageGenerationButtonProps) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim() || !canGenerate) return;

    const result = await onGenerate(prompt);
    if (result?.imageUrl) {
      onImageGenerated(result.imageUrl, prompt);
      setPrompt('');
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          disabled={!canGenerate && !open}
        >
          <ImagePlus className="h-4 w-4" />
          {remainingGenerations > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {remainingGenerations}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Generate Image</h4>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {canGenerate 
              ? `You have ${remainingGenerations} generation${remainingGenerations !== 1 ? 's' : ''} remaining today.`
              : "You've reached your daily limit. Try again tomorrow!"}
          </p>

          {canGenerate && (
            <>
              <Input
                placeholder="Describe the image you want..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                disabled={isGenerating}
              />
              <Button 
                className="w-full" 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
