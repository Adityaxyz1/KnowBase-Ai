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

  const buttonVariants = {
    hover: { scale: 1.02, x: 2 },
    tap: { scale: 0.98 }
  };

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
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 overflow-y-auto p-4 space-y-6"
              >
                {/* Appearance Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Appearance
                  </h3>
                  
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        key={isDarkMode ? 'moon' : 'sun'}
                        initial={{ rotate: -30, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 30, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                      >
                        <AnimatePresence mode="wait">
                          {isDarkMode ? (
                            <motion.div
                              key="moon"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Moon className="w-5 h-5 text-primary" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="sun"
                              initial={{ scale: 0, rotate: 90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: -90 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Sun className="w-5 h-5 text-primary" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      <div>
                        <Label className="text-sm font-medium">Theme</Label>
                        <motion.p 
                          key={isDarkMode ? 'dark' : 'light'}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-muted-foreground"
                        >
                          {isDarkMode ? 'Dark mode active' : 'Light mode active'}
                        </motion.p>
                      </div>
                    </div>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={onToggleTheme}
                    />
                  </motion.div>
                </div>

                {/* Data Management Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Data Management
                  </h3>
                  
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => setResetChatsDialogOpen(true)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset All Chats
                    </Button>
                  </motion.div>
                    
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => setResetBotDialogOpen(true)}
                    >
                      <Bot className="w-4 h-4" />
                      Reset Bot Settings
                    </Button>
                  </motion.div>
                    
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setClearDataDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Data
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
              {/* About Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 border-t border-border"
              >
                <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Knowbase v1.0.0</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI-powered knowledge workspace for research, learning, and work projects.
                  </p>
                </div>
              </motion.div>
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
