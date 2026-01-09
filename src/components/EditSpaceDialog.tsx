import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  preview: string;
  spaceId?: string;
}

interface KnowledgeSpace {
  id: string;
  name: string;
  color: string;
  conversationCount: number;
}

interface EditSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: KnowledgeSpace | null;
  conversations: Conversation[];
  onUpdateSpace: (id: string, name: string, color: string) => void;
  onDeleteSpace: (id: string) => void;
  onAssignConversations: (spaceId: string, conversationIds: string[]) => void;
}

const PRESET_COLORS = [
  '#00d4ff', '#ff6b6b', '#ffd93d', '#6bcb77',
  '#a855f7', '#f97316', '#ec4899', '#3b82f6',
];

export function EditSpaceDialog({
  open,
  onOpenChange,
  space,
  conversations,
  onUpdateSpace,
  onDeleteSpace,
  onAssignConversations,
}: EditSpaceDialogProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (space) {
      setName(space.name);
      setSelectedColor(space.color);
      // Get conversations that belong to this space
      const spaceConvs = conversations
        .filter(c => c.spaceId === space.id)
        .map(c => c.id);
      setSelectedConversations(spaceConvs);
    }
  }, [space, conversations]);

  const handleSave = () => {
    if (space && name.trim()) {
      onUpdateSpace(space.id, name.trim(), selectedColor);
      onAssignConversations(space.id, selectedConversations);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (space) {
      onDeleteSpace(space.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  const toggleConversation = (convId: string) => {
    setSelectedConversations(prev =>
      prev.includes(convId)
        ? prev.filter(id => id !== convId)
        : [...prev, convId]
    );
  };

  if (!space) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit Knowledge Space
            </DialogTitle>
            <DialogDescription>
              Modify the space settings and manage assigned conversations.
            </DialogDescription>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="edit-space-name">Space Name</Label>
              <Input
                id="edit-space-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Research Notes"
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <motion.button
                    key={color}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all relative',
                      selectedColor === color && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                    style={{ backgroundColor: color }}
                  >
                    <AnimatePresence>
                      {selectedColor === color && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <motion.div
              layout
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
            >
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm font-medium truncate">
                {name || 'Space Name'}
              </span>
            </motion.div>

            {/* Conversations Assignment */}
            <div className="space-y-2">
              <Label>Assign Conversations</Label>
              <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg bg-muted/20 border border-border">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        id={`conv-${conv.id}`}
                        checked={selectedConversations.includes(conv.id)}
                        onCheckedChange={() => toggleConversation(conv.id)}
                      />
                      <label
                        htmlFor={`conv-${conv.id}`}
                        className="flex-1 text-sm cursor-pointer truncate"
                      >
                        {conv.title}
                      </label>
                    </motion.div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedConversations.length} conversation(s) assigned
              </p>
            </div>
          </motion.div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Space
            </Button>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!name.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{space.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this knowledge space. Conversations assigned to this space will be unassigned but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Space
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
