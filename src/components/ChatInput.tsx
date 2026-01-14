import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, X, FileText, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PromptTemplates, StyleModifiers, promptTemplates, styleModifiers, type PromptTemplate } from '@/components/PromptTemplates';
import { cn } from '@/lib/utils';
import { fileToBase64, type FileAttachment } from '@/lib/chat';

interface ChatInputProps {
  onSend: (message: string, files?: FileAttachment[]) => void;
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
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
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
    if ((!message.trim() && fileAttachments.length === 0) || disabled) return;
    
    let finalMessage = message || 'Please analyze this image/file.';
    const style = styleModifiers.find(s => s.id === selectedStyle);
    if (style) {
      finalMessage += style.suffix;
    }
    
    onSend(finalMessage, fileAttachments.length > 0 ? fileAttachments : undefined);
    setMessage('');
    setSelectedTemplate(undefined);
    setSelectedStyle(undefined);
    setFiles([]);
    setFileAttachments([]);
    setShowTemplates(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      setIsProcessingFiles(true);
      
      try {
        const newAttachments: FileAttachment[] = [];
        for (const file of newFiles) {
          const base64 = await fileToBase64(file);
          newAttachments.push({
            name: file.name,
            type: file.type,
            base64
          });
        }
        setFileAttachments(prev => [...prev, ...newAttachments]);
      } catch (error) {
        console.error('Error processing files:', error);
      } finally {
        setIsProcessingFiles(false);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  const getFilePreview = (file: File, attachment: FileAttachment | undefined) => {
    if (file.type.startsWith('image/') && attachment) {
      return (
        <img 
          src={attachment.base64} 
          alt={file.name}
          className="w-10 h-10 object-cover rounded"
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-muted-foreground/10 rounded flex items-center justify-center">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  };

  const canSend = message.trim() || fileAttachments.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      <AnimatePresence>
        {showTemplates && message.length === 0 && files.length === 0 && (
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
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg"
        >
          {files.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group flex items-center gap-2 px-2 py-1.5 bg-background rounded-lg border border-border shadow-sm"
            >
              {getFilePreview(file, fileAttachments[index])}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium truncate max-w-[120px]">{file.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {file.type.startsWith('image/') ? 'Image' : 'Document'}
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-1.5 -right-1.5 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
          {isProcessingFiles && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </div>
          )}
        </motion.div>
      )}

      <div className="relative glass-panel-solid rounded-2xl p-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={files.length > 0 ? "Ask about the uploaded file..." : "Ask anything..."}
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
            className={cn(
              "text-muted-foreground hover:text-foreground transition-colors",
              files.length > 0 && "text-primary"
            )}
            disabled={disabled || isProcessingFiles}
          >
            {isProcessingFiles ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Button
            variant={canSend ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={handleSend}
            disabled={!canSend || disabled || isProcessingFiles}
            className={cn(
              'transition-all',
              canSend && 'shadow-glow'
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {(message.length > 0 || files.length > 0) && (
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
