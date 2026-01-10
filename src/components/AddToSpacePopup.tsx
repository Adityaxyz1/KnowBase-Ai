import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KnowledgeSpace {
  id: string;
  name: string;
  color: string;
  conversationCount: number;
}

interface AddToSpacePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaces: KnowledgeSpace[];
  currentSpaceId?: string;
  onSelectSpace: (spaceId: string | undefined) => void;
}

export function AddToSpacePopup({
  open,
  onOpenChange,
  spaces,
  currentSpaceId,
  onSelectSpace,
}: AddToSpacePopupProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>(currentSpaceId);

  const handleConfirm = () => {
    onSelectSpace(selectedSpaceId);
    onOpenChange(false);
  };

  const handleRemoveFromSpace = () => {
    onSelectSpace(undefined);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => onOpenChange(false)}
          />

          {/* Popup - positioned at top center */}
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 350,
              duration: 0.3 
            }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-80 max-w-[90vw]"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Add to Space</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Space List */}
              <div className="p-3 max-h-64 overflow-y-auto">
                {spaces.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No spaces available. Create one first!
                  </p>
                ) : (
                  <div className="space-y-1">
                    {spaces.map((space, index) => (
                      <motion.button
                        key={space.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedSpaceId(space.id)}
                        className={cn(
                          'flex items-center gap-3 w-full p-3 rounded-lg transition-all',
                          selectedSpaceId === space.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted/50 border border-transparent'
                        )}
                      >
                        <motion.div
                          className="w-4 h-4 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: space.color }}
                          animate={{ scale: selectedSpaceId === space.id ? 1.2 : 1 }}
                        />
                        <span className="flex-1 text-left text-sm font-medium truncate">
                          {space.name}
                        </span>
                        <AnimatePresence>
                          {selectedSpaceId === space.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Check className="w-4 h-4 text-primary" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-muted/20 flex gap-2">
                {currentSpaceId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFromSpace}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                )}
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={!selectedSpaceId && !currentSpaceId}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Confirm
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
