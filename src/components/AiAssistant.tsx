import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, RotateCcw, Loader2, ArrowDown, Bot, Paperclip } from 'lucide-react';
import rikpioAiLogo from '@/assets/rikapio-ai-logo.jpg';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/use-site-settings';

type Message = { role: 'user' | 'assistant'; content: string; timestamp?: number; imageUrl?: string };

// Auto-link phone numbers and emails in markdown content
function autoLinkContent(text: string): string {
  let result = text;
  // Link phone numbers to WhatsApp
  result = result.replace(/(?<!\[)(\+?880?\d{10,13})(?!\])/g, (match) => {
    const cleaned = match.replace(/\D/g, '');
    const waNumber = cleaned.startsWith('880') ? cleaned : `88${cleaned}`;
    return `[${match}](https://wa.me/${waNumber})`;
  });
  // Link emails to mailto
  result = result.replace(/(?<!\[)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?!\])/g, '[$1](mailto:$1)');
  return result;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const DEFAULT_QUICK_PROMPTS = [
  { icon: '🛍️', text: 'কোন পণ্য জনপ্রিয়?' },
  { icon: '📦', text: 'অর্ডার ট্র্যাক করতে চাই' },
  { icon: '🏷️', text: 'কোনো অফার আছে?' },
  { icon: '🚚', text: 'ডেলিভারি চার্জ কত?' },
];

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center py-1 px-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, isLast, imageBorderSize, imageBorderColor }: { msg: Message; isLast: boolean; imageBorderSize?: number; imageBorderColor?: string }) {
  const isUser = msg.role === 'user';
  const borderPx = imageBorderSize ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center mt-0.5">
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
      {msg.imageUrl ? (
        <div
          className={`max-w-[75%] rounded-2xl overflow-hidden ${
            isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
          }`}
          style={{
            padding: borderPx > 0 ? `${borderPx}px` : undefined,
            backgroundColor: borderPx > 0 && imageBorderColor ? imageBorderColor : isUser ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.6)',
          }}
        >
          <img src={msg.imageUrl} alt="Attached" className="w-full max-h-64 object-cover" style={{ borderRadius: borderPx > 0 ? '12px' : undefined }} />
          {msg.content && (
            <div
              className="px-3 py-2 text-[13px] leading-relaxed"
              style={{ color: '#ffffff' }}
            >
              <span>{msg.content}</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted/60 text-foreground rounded-bl-sm'
        }`}>
          {!isUser ? (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>p:not(:last-child)]:mb-1.5 [&>ul]:my-1 [&>ol]:my-1 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-foreground">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => {
                    const isTel = href?.startsWith('tel:');
                    const isMailto = href?.startsWith('mailto:');
                    return (
                      <a href={href} target={isTel || isMailto ? '_self' : '_blank'} rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {autoLinkContent(msg.content)}
              </ReactMarkdown>
              {isLast && msg.content && (
                <motion.span
                  className="inline-block w-[2px] h-3.5 bg-foreground/30 ml-0.5 align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </div>
          ) : (
            msg.content && <span>{msg.content}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function AiAssistant({ open, onClose, userName }: { open: boolean; onClose: () => void; userName?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: siteSettings } = useSiteSettings();

  const aiName = siteSettings?.ai_name || 'rikapio AI';
  const aiSubtitle = siteSettings?.ai_subtitle || 'সবসময় আপনার পাশে';
  const welcomeTitle = siteSettings?.ai_welcome_title || 'হ্যায়! কী খুঁজছেন? 🔍';
  const welcomeSubtitle = siteSettings?.ai_welcome_subtitle || 'আমি আপনার শপিং বাডি — প্রোডাক্ট, অফার, অর্ডার সব জানি!';
  const imageBorderSize = siteSettings?.ai_image_border_size ? Number(siteSettings.ai_image_border_size) : 0;
  const imageBorderColor = siteSettings?.ai_image_border_color || '';
  
  let quickPrompts = DEFAULT_QUICK_PROMPTS;
  try {
    if (siteSettings?.ai_quick_prompts) {
      const parsed = JSON.parse(siteSettings.ai_quick_prompts);
      if (Array.isArray(parsed) && parsed.length > 0) quickPrompts = parsed;
    }
  } catch { /* use defaults */ }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('chat-images').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('chat-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      console.error('Image upload error:', e);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
    if (e.target) e.target.value = '';
  };

  const clearPendingImage = () => {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  const sendMessage = useCallback(async (text: string, imageFile?: File | null) => {
    if ((!text.trim() && !imageFile) || isLoading) return;

    let imageUrl: string | undefined;
    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) imageUrl = url;
    }

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: Date.now(), imageUrl };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    clearPendingImage();
    setIsLoading(true);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg].map(m => {
      if (m.imageUrl) {
        return { role: m.role, content: `${m.content ? m.content + '\n' : ''}[ছবি সংযুক্ত: ${m.imageUrl}]` };
      }
      return { role: m.role, content: m.content };
    });

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, language: 'bn', userName: userName || undefined, imageUrl }),
      });

      if (!resp.ok || !resp.body) throw new Error('Failed to get response');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar, timestamp: Date.now() }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('AI chat error:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'দুঃখিত, কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন। 🙏', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, userName, uploadImage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input, pendingImage);
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
    clearPendingImage();
  };

  if (!open) return null;

  const isStreaming = isLoading && messages[messages.length - 1]?.role === 'assistant';

  // Get first name for display
  const firstName = userName?.split(' ')[0] || null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="relative w-full sm:max-w-[420px] h-[85vh] sm:h-[580px] bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border/60 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-background">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
                <img src={rikpioAiLogo} alt="rikapio" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{aiName}</h3>
              <p className="text-[11px] text-muted-foreground">{aiSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={resetChat} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" title="নতুন চ্যাট">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          <AnimatePresence mode="wait">
            {messages.length === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center h-full gap-5 text-center px-4 py-6"
              >
                {/* Greeting */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  {firstName ? (
                    <>
                      <h4 className="font-bold text-base text-foreground tracking-tight">
                        {welcomeTitle.replace('!', '')}, {firstName}! 👋
                      </h4>
                      <p className="text-[13px] text-muted-foreground/80 mt-1.5 font-medium">
                        আজ আপনাকে কিভাবে সাহায্য করতে পারি?
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-base text-foreground tracking-tight">
                        {welcomeTitle} 👋
                      </h4>
                      <p className="text-[13px] text-muted-foreground/80 mt-1.5 font-medium">
                        {welcomeSubtitle}
                      </p>
                    </>
                  )}
                </motion.div>

                {/* Quick Prompts */}
                <div className="w-full grid grid-cols-2 gap-2.5">
                  {quickPrompts.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                      onClick={() => sendMessage(prompt.text)}
                      className="flex flex-col items-center gap-2 text-center px-3 py-3.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-[0.97] group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform duration-200">{prompt.icon}</span>
                      <span className="text-[12px] font-medium leading-tight">{prompt.text}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              isLast={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
              imageBorderSize={imageBorderSize}
              imageBorderColor={imageBorderColor}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2.5 items-start"
            >
              <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                <TypingDots />
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToBottom}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center z-10"
              >
                <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border px-3 py-2.5 bg-background">
          {pendingImagePreview && (
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <img src={pendingImagePreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-border" />
                <button
                  type="button"
                  onClick={clearPendingImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {isUploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          )}
          <div className="flex gap-2 items-center">
            <label className={`flex-shrink-0 w-11 h-11 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors ${isLoading || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isLoading || isUploading}
              />
            </label>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="মেসেজ লিখুন..."
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={(!input.trim() && !pendingImage) || isLoading || isUploading}
              className="flex-shrink-0 w-11 h-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-40 active:scale-95"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
