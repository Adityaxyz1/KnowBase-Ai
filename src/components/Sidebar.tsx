import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Search,
  Settings,
  ChevronDown,
  Sparkles,
  Clock,
  Star,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { AddSpaceDialog } from '@/components/AddSpaceDialog';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  starred?: boolean;
}

interface KnowledgeSpace {
  id: string;
  name: string;
  color: string;
  conversationCount: number;
}

interface SidebarProps {
  conversations: Conversation[];
  knowledgeSpaces: KnowledgeSpace[];
  activeConversationId?: string;
  activeSpaceId?: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSelectSpace: (id: string) => void;
  onAddSpace: (name: string, color: string) => void;
  onOpenSettings: () => void;
  className?: string;
}

export function Sidebar({
  conversations,
  knowledgeSpaces,
  activeConversationId,
  activeSpaceId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onSelectSpace,
  onAddSpace,
  onOpenSettings,
  className
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSpaces, setExpandedSpaces] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [addSpaceDialogOpen, setAddSpaceDialogOpen] = useState(false);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      onDeleteConversation(conversationToDelete);
      setConversationToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentConversations = filteredConversations.slice(0, 5);
  const starredConversations = filteredConversations.filter(c => c.starred);

  return (
    <aside className={cn(
      'w-64 h-full border-r border-border bg-sidebar flex flex-col',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg">Knowbase</span>
        </div>
        
        <Button 
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="glow"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="pl-9 h-9 bg-sidebar-accent border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Knowledge Spaces */}
        <div className="p-3">
          <button
            onClick={() => setExpandedSpaces(!expandedSpaces)}
            className="flex items-center gap-2 w-full text-xs uppercase tracking-wider text-muted-foreground font-medium px-2 py-1.5 hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn(
              'w-3 h-3 transition-transform',
              !expandedSpaces && '-rotate-90'
            )} />
            Knowledge Spaces
          </button>
          
          <AnimatePresence>
            {expandedSpaces && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-1 space-y-1"
              >
                {knowledgeSpaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => onSelectSpace(space.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-2 py-2 rounded-lg transition-colors text-left",
                      activeSpaceId === space.id 
                        ? "bg-sidebar-accent text-foreground" 
                        : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <div 
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: space.color }}
                    />
                    <span className="text-sm truncate flex-1">{space.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {space.conversationCount}
                    </span>
                  </button>
                ))}
                <button 
                  onClick={() => setAddSpaceDialogOpen(true)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground"
                >
                  <Plus className="w-3 h-3" />
                  <span className="text-sm">Add space</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Starred */}
        {starredConversations.length > 0 && (
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
              <Star className="w-3 h-3" />
              Starred
            </div>
            <div className="mt-1 space-y-1">
              {starredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  onClick={() => onSelectConversation(conv.id)}
                  onDelete={(e) => handleDeleteClick(conv.id, e)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
            <Clock className="w-3 h-3" />
            Recent
          </div>
          <div className="mt-1 space-y-1">
            {recentConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => onSelectConversation(conv.id)}
                onDelete={(e) => handleDeleteClick(conv.id, e)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>
      </div>

      {/* Add Space Dialog */}
      <AddSpaceDialog
        open={addSpaceDialogOpen}
        onOpenChange={setAddSpaceDialogOpen}
        onAddSpace={onAddSpace}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        'flex items-start gap-3 w-full px-2 py-2 rounded-lg transition-colors text-left group',
        isActive 
          ? 'bg-sidebar-accent text-foreground' 
          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
      )}
    >
      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{conversation.title}</p>
        <p className="text-xs text-muted-foreground truncate">{conversation.preview}</p>
      </div>
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <button 
              onClick={onDelete}
              className="p-1 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
