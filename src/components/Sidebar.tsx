import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Search, Settings, ChevronDown, Sparkles, Clock, Star, Trash2, Pencil, FolderPlus, X, GripVertical, Filter, Download, FileText, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AddSpaceDialog } from '@/components/AddSpaceDialog';
import { EditSpaceDialog } from '@/components/EditSpaceDialog';
import { AddToSpacePopup } from '@/components/AddToSpacePopup';
import { cn } from '@/lib/utils';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    name: string;
    type: string;
    preview?: string;
  }>;
}
interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  starred?: boolean;
  spaceId?: string;
  messages: Message[];
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
  onUpdateSpace: (id: string, name: string, color: string) => void;
  onDeleteSpace: (id: string) => void;
  onAssignConversations: (spaceId: string, conversationIds: string[]) => void;
  onAddConversationToSpace: (conversationId: string, spaceId: string | undefined) => void;
  onExportConversation: (conversationId: string, format: 'markdown' | 'pdf') => void;
  onClearAllChats: () => void;
  onOpenSettings: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
}

// Animation variants
const sidebarVariants = {
  hidden: {
    x: -264,
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    x: -264,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};
const itemVariants = {
  hidden: {
    opacity: 0,
    x: -20
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut'
    }
  })
};
const buttonVariants = {
  tap: {
    scale: 0.95
  },
  hover: {
    scale: 1.02
  }
};
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
  onUpdateSpace,
  onDeleteSpace,
  onAssignConversations,
  onAddConversationToSpace,
  onExportConversation,
  onClearAllChats,
  onOpenSettings,
  searchInputRef,
  className
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpaceId, setFilterSpaceId] = useState<string | null>(null);
  const [expandedSpaces, setExpandedSpaces] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [addSpaceDialogOpen, setAddSpaceDialogOpen] = useState(false);
  const [editSpaceDialogOpen, setEditSpaceDialogOpen] = useState(false);
  const [spaceToEdit, setSpaceToEdit] = useState<KnowledgeSpace | null>(null);
  const [addToSpacePopupOpen, setAddToSpacePopupOpen] = useState(false);
  const [conversationForSpace, setConversationForSpace] = useState<Conversation | null>(null);
  const [deleteSpaceDialogOpen, setDeleteSpaceDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<KnowledgeSpace | null>(null);
  const [draggedConversation, setDraggedConversation] = useState<string | null>(null);
  const [dragOverSpace, setDragOverSpace] = useState<string | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const handleAddToSpaceClick = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationForSpace(conv);
    setAddToSpacePopupOpen(true);
  };
  const handleSpaceSelected = (spaceId: string | undefined) => {
    if (conversationForSpace) {
      onAddConversationToSpace(conversationForSpace.id, spaceId);
    }
    setConversationForSpace(null);
  };
  const handleDeleteSpaceClick = (space: KnowledgeSpace, e: React.MouseEvent) => {
    e.stopPropagation();
    setSpaceToDelete(space);
    setDeleteSpaceDialogOpen(true);
  };
  const confirmDeleteSpace = () => {
    if (spaceToDelete) {
      onDeleteSpace(spaceToDelete.id);
      setSpaceToDelete(null);
    }
    setDeleteSpaceDialogOpen(false);
  };
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };
  const handleEditSpaceClick = (space: KnowledgeSpace, e: React.MouseEvent) => {
    e.stopPropagation();
    setSpaceToEdit(space);
    setEditSpaceDialogOpen(true);
  };
  const confirmDelete = () => {
    if (conversationToDelete) {
      onDeleteConversation(conversationToDelete);
      setConversationToDelete(null);
    }
    setDeleteDialogOpen(false);
  };
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterSpaceId === null || c.spaceId === filterSpaceId;
    return matchesSearch && matchesFilter;
  });
  const recentConversations = filteredConversations.slice(0, 10);
  const starredConversations = filteredConversations.filter(c => c.starred);
  const handleDragStart = (conversationId: string) => {
    setDraggedConversation(conversationId);
  };
  const handleDragEnd = () => {
    if (draggedConversation && dragOverSpace) {
      onAddConversationToSpace(draggedConversation, dragOverSpace);
    }
    setDraggedConversation(null);
    setDragOverSpace(null);
  };
  const handleDragOverSpace = (spaceId: string) => {
    setDragOverSpace(spaceId);
  };
  const handleDragLeaveSpace = () => {
    setDragOverSpace(null);
  };
  const filterSpace = filterSpaceId ? knowledgeSpaces.find(s => s.id === filterSpaceId) : null;
  return <motion.aside variants={sidebarVariants} initial="hidden" animate="visible" exit="exit" className={cn('w-64 h-full border-r border-border bg-sidebar flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg">Knowbase AI</span>
        </motion.div>
        
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button onClick={onNewChat} className="w-full justify-start gap-2" variant="glow">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </motion.div>
      </div>

      {/* Search with Filter */}
      <div className="p-3 border-b border-sidebar-border space-y-2">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input ref={searchInputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search chats... (Ctrl+K)" className="pl-9 h-9 bg-sidebar-accent border-transparent" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }} className={cn("h-9 w-9 rounded-md flex items-center justify-center transition-colors", filterSpaceId ? "bg-primary text-primary-foreground" : "bg-sidebar-accent hover:bg-sidebar-accent/80")}>
                <Filter className="w-4 h-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setFilterSpaceId(null)}>
                <span className={cn(!filterSpaceId && "font-semibold")}>All Spaces</span>
              </DropdownMenuItem>
              {knowledgeSpaces.map(space => <DropdownMenuItem key={space.id} onClick={() => setFilterSpaceId(space.id)}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{
                  backgroundColor: space.color
                }} />
                    <span className={cn(filterSpaceId === space.id && "font-semibold")}>{space.name}</span>
                  </div>
                </DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <AnimatePresence>
          {filterSpace && <motion.div initial={{
          opacity: 0,
          height: 0
        }} animate={{
          opacity: 1,
          height: 'auto'
        }} exit={{
          opacity: 0,
          height: 0
        }} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-sidebar-accent text-xs">
                <div className="w-2 h-2 rounded-sm" style={{
              backgroundColor: filterSpace.color
            }} />
                <span>Filtering: {filterSpace.name}</span>
                <button onClick={() => setFilterSpaceId(null)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Knowledge Spaces */}
        <div className="p-3">
          <button onClick={() => setExpandedSpaces(!expandedSpaces)} className="flex items-center gap-2 w-full text-xs uppercase tracking-wider text-muted-foreground font-medium px-2 py-1.5 hover:text-foreground transition-colors">
            <ChevronDown className={cn('w-3 h-3 transition-transform', !expandedSpaces && '-rotate-90')} />
            Knowledge Spaces
          </button>
          
          <AnimatePresence>
            {expandedSpaces && <motion.div initial={{
            height: 0,
            opacity: 0
          }} animate={{
            height: 'auto',
            opacity: 1
          }} exit={{
            height: 0,
            opacity: 0
          }} className="mt-1 space-y-1">
                {knowledgeSpaces.map((space, index) => <motion.div key={space.id} custom={index} variants={itemVariants} initial="hidden" animate="visible" className="group relative" onDragOver={e => {
              e.preventDefault();
              handleDragOverSpace(space.id);
            }} onDragLeave={handleDragLeaveSpace} onDrop={e => {
              e.preventDefault();
              handleDragEnd();
            }}>
                    <motion.button whileHover={{
                x: 2
              }} whileTap={{
                scale: 0.98
              }} onClick={() => onSelectSpace(space.id)} className={cn("flex items-center gap-3 w-full px-2 py-2 rounded-lg transition-all text-left", activeSpaceId === space.id ? "bg-sidebar-accent text-foreground" : "hover:bg-sidebar-accent/50", dragOverSpace === space.id && "ring-2 ring-primary bg-primary/10")}>
                      <motion.div className="w-3 h-3 rounded-sm" style={{
                  backgroundColor: space.color
                }} whileHover={{
                  scale: 1.2
                }} animate={dragOverSpace === space.id ? {
                  scale: [1, 1.3, 1]
                } : {}} transition={{
                  repeat: dragOverSpace === space.id ? Infinity : 0,
                  duration: 0.5
                }} />
                      <span className="text-sm truncate flex-1">{space.name}</span>
                      <span className="text-xs text-muted-foreground group-hover:hidden">
                        {space.conversationCount}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <motion.button initial={{
                    opacity: 0
                  }} whileHover={{
                    scale: 1.1
                  }} onClick={e => handleEditSpaceClick(space, e)} className="p-1 hover:text-primary transition-colors">
                          <Pencil className="w-3 h-3 bg-[#8a0a0a] text-white" />
                        </motion.button>
                        <motion.button initial={{
                    opacity: 0
                  }} whileHover={{
                    scale: 1.1
                  }} onClick={e => handleDeleteSpaceClick(space, e)} className="p-1 text-destructive hover:text-destructive/80 transition-colors">
                          <X className="w-3.5 h-3.5 text-white" />
                        </motion.button>
                      </div>
                    </motion.button>
                  </motion.div>)}
                <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={() => setAddSpaceDialogOpen(true)} className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground">
                  <Plus className="w-3 h-3" />
                  <span className="text-sm">Add space</span>
                </motion.button>
              </motion.div>}
          </AnimatePresence>
        </div>

        {/* Starred */}
        {starredConversations.length > 0 && <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
              <Star className="w-3 h-3" />
              Starred
            </div>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="mt-1 space-y-1">
              {starredConversations.map((conv, index) => <ConversationItem key={conv.id} conversation={conv} isActive={conv.id === activeConversationId} onClick={() => onSelectConversation(conv.id)} onDelete={e => handleDeleteClick(conv.id, e)} onAddToSpace={e => handleAddToSpaceClick(conv, e)} onExport={format => onExportConversation(conv.id, format)} index={index} hasSpace={!!conv.spaceId} onDragStart={() => handleDragStart(conv.id)} isDragging={draggedConversation === conv.id} />)}
            </motion.div>
          </div>}

        {/* Recent */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-medium">
              <Clock className="w-3 h-3" />
              Recent
            </div>
            {recentConversations.length > 0 && <motion.button whileHover={{
            scale: 1.1
          }} whileTap={{
            scale: 0.95
          }} onClick={() => setClearAllDialogOpen(true)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Clear all chats">
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>}
          </div>
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="mt-1 space-y-1">
            {recentConversations.map((conv, index) => <ConversationItem key={conv.id} conversation={conv} isActive={conv.id === activeConversationId} onClick={() => onSelectConversation(conv.id)} onDelete={e => handleDeleteClick(conv.id, e)} onAddToSpace={e => handleAddToSpaceClick(conv, e)} onExport={format => onExportConversation(conv.id, format)} index={index} hasSpace={!!conv.spaceId} onDragStart={() => handleDragStart(conv.id)} isDragging={draggedConversation === conv.id} />)}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.2
    }} className="p-3 border-t border-sidebar-border">
        <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={onOpenSettings} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </motion.button>
      </motion.div>

      {/* Add Space Dialog */}
      <AddSpaceDialog open={addSpaceDialogOpen} onOpenChange={setAddSpaceDialogOpen} onAddSpace={onAddSpace} />

      {/* Edit Space Dialog */}
      <EditSpaceDialog open={editSpaceDialogOpen} onOpenChange={setEditSpaceDialogOpen} space={spaceToEdit} conversations={conversations} onUpdateSpace={onUpdateSpace} onDeleteSpace={onDeleteSpace} onAssignConversations={onAssignConversations} />

      {/* Add to Space Popup */}
      <AddToSpacePopup open={addToSpacePopupOpen} onOpenChange={setAddToSpacePopupOpen} spaces={knowledgeSpaces} currentSpaceId={conversationForSpace?.spaceId} onSelectSpace={handleSpaceSelected} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.2
        }}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the conversation and all its messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <motion.div whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }}>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </motion.div>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Space Confirmation Dialog */}
      <AlertDialog open={deleteSpaceDialogOpen} onOpenChange={setDeleteSpaceDialogOpen}>
        <AlertDialogContent>
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.2
        }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <motion.div className="w-4 h-4 rounded-sm" style={{
                backgroundColor: spaceToDelete?.color
              }} />
                Delete "{spaceToDelete?.name}"?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this knowledge space. Conversations assigned to this space will be unassigned but not deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <motion.div whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }}>
                <AlertDialogCancel className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </AlertDialogCancel>
              </motion.div>
              <motion.div whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }}>
                <AlertDialogAction onClick={confirmDeleteSpace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Confirm Delete
                </AlertDialogAction>
              </motion.div>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Chats Confirmation Dialog */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.2
        }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                Clear all chats?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your conversations. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <motion.div whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }}>
                <AlertDialogCancel className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </AlertDialogCancel>
              </motion.div>
              <motion.div whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }}>
                <AlertDialogAction onClick={() => {
                onClearAllChats();
                setClearAllDialogOpen(false);
              }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </AlertDialogAction>
              </motion.div>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </motion.aside>;
}
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onAddToSpace: (e: React.MouseEvent) => void;
  onExport: (format: 'markdown' | 'pdf') => void;
  index: number;
  hasSpace?: boolean;
  onDragStart?: () => void;
  isDragging?: boolean;
}
function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onAddToSpace,
  onExport,
  index,
  hasSpace,
  onDragStart,
  isDragging
}: ConversationItemProps) {
  const [showActions, setShowActions] = useState(false);
  return <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible" draggable onDragStart={onDragStart} className={cn('flex items-start gap-1 w-full rounded-lg transition-all text-left group cursor-grab active:cursor-grabbing', isActive ? 'bg-sidebar-accent text-foreground' : 'hover:bg-sidebar-accent/50 text-sidebar-foreground', isDragging && 'opacity-50 scale-95')}>
      <motion.div whileHover={{
      scale: 1.1
    }} className="p-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 flex-shrink-0">
        <GripVertical className="w-3 h-3" />
      </motion.div>
      
      <button onClick={onClick} onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)} className="flex items-start gap-2 flex-1 py-2 pr-2">
        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium truncate">{conversation.title}</p>
          <p className="text-xs text-muted-foreground truncate">{conversation.preview}</p>
        </div>
        <AnimatePresence>
          {showActions && <motion.div initial={{
          opacity: 0,
          scale: 0.8
        }} animate={{
          opacity: 1,
          scale: 1
        }} exit={{
          opacity: 0,
          scale: 0.8
        }} transition={{
          duration: 0.15
        }} className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <motion.button whileHover={{
            scale: 1.2
          }} whileTap={{
            scale: 0.9
          }} onClick={onAddToSpace} className={cn("p-1 transition-colors", hasSpace ? "text-primary hover:text-primary/80" : "hover:text-primary")} title="Add to space">
                <FolderPlus className="w-3.5 h-3.5" />
              </motion.button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button whileHover={{
                scale: 1.2
              }} whileTap={{
                scale: 0.9
              }} className="p-1 hover:text-primary transition-colors" title="Export conversation">
                    <Download className="w-3.5 h-3.5" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onExport('markdown')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport('pdf')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <motion.button whileHover={{
            scale: 1.2
          }} whileTap={{
            scale: 0.9
          }} onClick={onDelete} className="p-1 hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>}
        </AnimatePresence>
      </button>
    </motion.div>;
}