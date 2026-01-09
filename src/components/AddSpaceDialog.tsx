import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AddSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSpace: (name: string, color: string) => void;
}

const PRESET_COLORS = [
  '#00d4ff', // Cyan
  '#ff6b6b', // Red
  '#ffd93d', // Yellow
  '#6bcb77', // Green
  '#a855f7', // Purple
  '#f97316', // Orange
  '#ec4899', // Pink
  '#3b82f6', // Blue
];

export function AddSpaceDialog({ open, onOpenChange, onAddSpace }: AddSpaceDialogProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddSpace(name.trim(), selectedColor);
      setName('');
      setSelectedColor(PRESET_COLORS[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create Knowledge Space</DialogTitle>
          <DialogDescription>
            Add a new space to organize your conversations and knowledge.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="space-name">Space Name</Label>
            <Input
              id="space-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Personal Notes, Project Alpha"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all',
                    selectedColor === color 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' 
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div 
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm font-medium truncate">
              {name || 'New Space'}
            </span>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Space
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
