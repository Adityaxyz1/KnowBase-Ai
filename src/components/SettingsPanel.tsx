import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Moon, 
  Sun, 
  Trash2, 
  RotateCcw, 
  Bot,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onClearAllData: () => void;
  onResetAllChats: () => void;
  onResetBot: () => void;
}

export function SettingsPanel({
  isOpen,
  onClose,
  isDarkMode,
  onToggleTheme,
  onClearAllData,
  onResetAllChats,
  onResetBot,
}: SettingsPanelProps) {
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  const [resetChatsDialogOpen, setResetChatsDialogOpen] = useState(false);
  const [resetBotDialogOpen, setResetBotDialogOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold">Settings</h2>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Appearance Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Appearance
                  </h3>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {isDarkMode ? (
                        <Moon className="w-5 h-5 text-primary" />
                      ) : (
                        <Sun className="w-5 h-5 text-primary" />
                      )}
                      <div>
                        <Label className="text-sm font-medium">Dark Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          {isDarkMode ? 'Currently in dark mode' : 'Currently in light mode'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={onToggleTheme}
                    />
                  </div>
                </div>

                {/* Data Management Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Data Management
                  </h3>
                  
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => setResetChatsDialogOpen(true)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset All Chats
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => setResetBotDialogOpen(true)}
                    >
                      <Bot className="w-4 h-4" />
                      Reset Bot Settings
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setClearDataDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Data
                    </Button>
                  </div>
                </div>

                {/* About Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    About
                  </h3>
                  
                  <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Knowbase v1.0.0</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI-powered knowledge workspace for research, learning, and work projects.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Clear All Data Dialog */}
      <AlertDialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your conversations, knowledge spaces, and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClearAllData();
                setClearDataDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset All Chats Dialog */}
      <AlertDialog open={resetChatsDialogOpen} onOpenChange={setResetChatsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your conversation history. Your knowledge spaces will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onResetAllChats();
                setResetChatsDialogOpen(false);
              }}
            >
              Reset Chats
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Bot Dialog */}
      <AlertDialog open={resetBotDialogOpen} onOpenChange={setResetBotDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset bot settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the AI assistant to its default behavior and clear any learned preferences.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onResetBot();
                setResetBotDialogOpen(false);
              }}
            >
              Reset Bot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
