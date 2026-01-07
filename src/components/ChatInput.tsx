import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PromptTemplates, StyleModifiers, promptTemplates, styleModifiers, type PromptTemplate } from '@/components/PromptTemplates';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface ChatInputHandle {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({ onSend, disabled, className }, ref) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const [selectedStyle, setSelectedStyle] = useState<string | undefined>();
  const [showTemplates, setShowTemplates] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleTemplateSelect = (template: PromptTemplate) => {
    if (selectedTemplate === template.id) {
      setSelectedTemplate(undefined);
      setMessage(message.replace(template.prefix, ''));
    } else {
      const oldTemplate = promptTemplates.find(t => t.id === selectedTemplate);
      let newMessage = message;
      if (oldTemplate) {
        newMessage = newMessage.replace(oldTemplate.prefix, '');
      }
      setSelectedTemplate(template.id);
      setMessage(template.prefix + newMessage);
    }
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const handleStyleSelect = (modifier: typeof styleModifiers[0]) => {
    setSelectedStyle(selectedStyle === modifier.id ? undefined : modifier.id);
  };

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    
    let finalMessage = message;
    const style = styleModifiers.find(s => s.id === selectedStyle);
    if (style) {
      finalMessage += style.suffix;
    }
    
    onSend(finalMessage);
    setMessage('');
    setSelectedTemplate(undefined);
    setSelectedStyle(undefined);
    setFiles([]);
    setShowTemplates(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <AnimatePresence>
        {showTemplates && message.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3"
          >
            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick actions</p>
              <PromptTemplates 
                onSelect={handleTemplateSelect}
                selectedId={selectedTemplate}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
            >
              {getFileIcon(file)}
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <div className="relative glass-panel-solid rounded-2xl p-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled}
          className="min-h-[52px] max-h-[200px] border-0 bg-transparent focus-visible:ring-0 focus-visible:border-0 resize-none pr-24"
          rows={1}
        />
        
        <div className="absolute right-3 bottom-3 flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,image/*"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Button
            variant={message.trim() ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className={cn(
              'transition-all',
              message.trim() && 'shadow-glow'
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {message.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-xs text-muted-foreground mb-2">Response style</p>
          <StyleModifiers
            onSelect={handleStyleSelect}
            selectedId={selectedStyle}
          />
        </motion.div>
      )}
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
