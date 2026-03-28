import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ChevronDown, Bot, ArrowLeft, Send, RotateCcw, Loader2, ArrowDown, Paperclip, X } from 'lucide-react';
import rikpioLogoDark from '@/assets/rikapio-logo-dark.png';
import rikpioAiLogo from '@/assets/rikapio-ai-logo.jpg';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

// ── Icons ──
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

// ── Helpers ──
function autoLinkContent(text: string): string {
  let result = text;
  result = result.replace(/(?<!\[)(\+?880?\d{10,13})(?!\])/g, (match) => {
    const cleaned = match.replace(/\D/g, '');
    const waNumber = cleaned.startsWith('880') ? cleaned : `88${cleaned}`;
    return `[${match}](https://wa.me/${waNumber})`;
  });
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

type Message = { role: 'user' | 'assistant'; content: string; timestamp?: number; imageUrl?: string };

// ── Sub-components ──
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
          className={`max-w-[75%] rounded-2xl overflow-hidden ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          style={{
            padding: borderPx > 0 ? `${borderPx}px` : undefined,
            backgroundColor: borderPx > 0 && imageBorderColor ? imageBorderColor : isUser ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.6)',
          }}
        >
          <img src={msg.imageUrl} alt="Attached" className="w-full max-h-64 object-cover" style={{ borderRadius: borderPx > 0 ? '12px' : undefined }} />
          {msg.content && (
            <div className="px-3 py-2 text-[13px] leading-relaxed" style={{ color: '#ffffff' }}>
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

// ── Main Component ──
export function AiFloatingButton() {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'chat'>('menu');
  const [userName, setUserName] = useState<string | null>(null);
  const { data: settings } = useSiteSettings();

  // Chat state
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

  const isEnabled = settings?.ai_enabled !== 'false';
  const whatsapp = settings?.whatsapp || '8801840469120';
  const facebookUrl = settings?.chat_facebook_url || settings?.facebook_url || '';
  const instagramUrl = settings?.chat_instagram_url || settings?.instagram_url || '';
  const aiName = settings?.ai_name || 'rikapio AI';
  const aiSubtitle = settings?.ai_subtitle || 'সবসময় আপনার পাশে';
  const welcomeTitle = settings?.ai_welcome_title || 'হ্যায়! কী খুঁজছেন? 🔍';
  const welcomeSubtitle = settings?.ai_welcome_subtitle || 'আমি আপনার শপিং বাডি — প্রোডাক্ট, অফার, অর্ডার সব জানি!';
  const imageBorderSize = settings?.ai_image_border_size ? Number(settings.ai_image_border_size) : 0;
  const imageBorderColor = settings?.ai_image_border_color || '';
  const closeBtnContainerSize = settings?.ai_close_btn_container_size ? Number(settings.ai_close_btn_container_size) : 28;
  const closeBtnIconSize = settings?.ai_close_btn_icon_size ? Number(settings.ai_close_btn_icon_size) : 16;

  let quickPrompts = DEFAULT_QUICK_PROMPTS;
  try {
    if (settings?.ai_quick_prompts) {
      const parsed = JSON.parse(settings.ai_quick_prompts);
      if (Array.isArray(parsed) && parsed.length > 0) quickPrompts = parsed;
    }
  } catch { /* use defaults */ }

  const firstName = userName?.split(' ')[0] || null;

  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', session.user.id)
          .maybeSingle();
        const name = profile?.full_name || session.user.user_metadata?.full_name || null;
        setUserName(name && name.trim() ? name.trim() : null);
      } else {
        setUserName(null);
      }
    };
    fetchUserName();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from('profiles').select('full_name').eq('user_id', session.user.id).maybeSingle()
          .then(({ data: profile }) => {
            const name = profile?.full_name || session.user.user_metadata?.full_name || null;
            setUserName(name && name.trim() ? name.trim() : null);
          });
      } else { setUserName(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Don't auto-focus input to prevent keyboard from showing on mobile

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
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
    if (file.size > 5 * 1024 * 1024) return; // 5MB max
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

  const resetChat = () => { setMessages([]); setInput(''); clearPendingImage(); };

  const handleClose = () => {
    setWidgetOpen(false);
    // Keep view state so user can return to chat
  };

  const handleBack = () => {
    setView('menu');
  };

  if (!isEnabled) return null;

  const isStreaming = isLoading && messages[messages.length - 1]?.role === 'assistant';

  const chatChannels = [
    {
      key: 'livechat',
      icon: <Bot className="h-5 w-5 text-primary" />,
      label: 'লাইভ চ্যাট',
      sublabel: 'AI অ্যাসিস্ট্যান্ট',
      onClick: () => setView('chat'),
      show: true,
    },
    {
      key: 'whatsapp',
      icon: <WhatsAppIcon className="h-5 w-5 text-[hsl(142,70%,45%)]" />,
      label: 'WhatsApp',
      sublabel: 'মেসেজ পাঠান',
      href: `https://wa.me/${whatsapp}`,
      show: !!whatsapp,
    },
    {
      key: 'facebook',
      icon: <FacebookIcon className="h-5 w-5 text-[#1877F2]" />,
      label: 'Facebook',
      sublabel: 'মেসেঞ্জারে চ্যাট করুন',
      href: facebookUrl,
      show: !!facebookUrl && facebookUrl !== '#',
    },
    {
      key: 'instagram',
      icon: <InstagramIcon className="h-5 w-5 text-[#E4405F]" />,
      label: 'Instagram',
      sublabel: 'DM পাঠান',
      href: instagramUrl,
      show: !!instagramUrl && instagramUrl !== '#',
    },
  ].filter(c => c.show);

  return createPortal(
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!widgetOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => setWidgetOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-[52px] h-[52px] max-md:bottom-[72px]"
            style={{
              background: 'linear-gradient(145deg, #1a1a2e, #0f0f1a)',
              borderRadius: '16px 16px 4px 16px',
              boxShadow: '0 4px 24px -6px rgba(0, 0, 0, 0.5)',
            }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Open Chat"
          >
            <motion.div
              className="absolute inset-0"
              style={{
                borderRadius: '16px 16px 4px 16px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
              }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <MessageCircle className="relative z-10 text-primary-foreground" size={22} strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Widget Panel */}
      <AnimatePresence>
        {widgetOpen && (
          <motion.div
            key="widget-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-auto"
              onClick={handleClose}
            />
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              className="absolute bottom-6 right-6 w-[340px] max-md:bottom-[72px] max-md:right-3 max-md:left-3 max-md:w-auto pointer-events-auto"
            >
              <div className="bg-background rounded-2xl shadow-2xl border border-border/60 overflow-hidden flex flex-col"
                style={{ maxHeight: 'min(70vh, 520px)' }}
              >
                {/* Header - Always visible */}
                <div
                  className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary-foreground flex items-center justify-center overflow-hidden shadow-sm border-2 border-primary-foreground/30">
                        <img src={rikpioAiLogo} alt="rikapio" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-primary/80" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-primary-foreground">{aiName}</h3>
                      <p className="text-[11px] text-primary-foreground/70">{aiSubtitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="rounded-full bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-colors"
                    style={{ width: `${closeBtnContainerSize}px`, height: `${closeBtnContainerSize}px` }}
                  >
                    <ChevronDown style={{ width: `${closeBtnIconSize}px`, height: `${closeBtnIconSize}px` }} className="text-primary-foreground" />
                  </button>
                </div>

                {/* View: Menu or Chat */}
                <AnimatePresence mode="wait" initial={false}>
                  {view === 'menu' ? (
                    <motion.div
                      key="menu"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 overflow-y-auto"
                    >

                      {/* Channel Options */}
                      <div className="px-3 pb-4 pt-2 space-y-1.5">
                        {chatChannels.map((channel, i) => {
                          const content = (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 + i * 0.04 }}
                              key={channel.key}
                              className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-border/50 bg-background hover:bg-muted/40 transition-colors cursor-pointer active:scale-[0.98]"
                              onClick={channel.onClick}
                            >
                              <div className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                {channel.icon}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{channel.label}</p>
                                <p className="text-[11px] text-muted-foreground">{channel.sublabel}</p>
                              </div>
                            </motion.div>
                          );

                          if (channel.href) {
                            return (
                              <a
                                key={channel.key}
                                href={channel.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                {content}
                              </a>
                            );
                          }
                          return content;
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chat"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 flex flex-col overflow-hidden"
                    >
                      {/* Back button + reset */}
                      <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between flex-shrink-0">
                        <button
                          onClick={handleBack}
                          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/50"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          ফিরে যান
                        </button>
                        {messages.length > 0 && (
                          <button
                            onClick={resetChat}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/50"
                            title="নতুন চ্যাট"
                          >
                            <RotateCcw className="h-3 w-3" />
                            নতুন চ্যাট
                          </button>
                        )}
                      </div>

                      {/* Messages area */}
                      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-3 relative">
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
                                    <h4 className="font-bold text-[15px] text-foreground tracking-tight">
                                      {welcomeTitle.replace('!', '')}, {firstName}! 👋
                                    </h4>
                                    <p className="text-[12px] text-muted-foreground/80 mt-1.5 font-medium">
                                      আজ আপনাকে কিভাবে সাহায্য করতে পারি?
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <h4 className="font-bold text-[15px] text-foreground tracking-tight">
                                      {welcomeTitle} 👋
                                    </h4>
                                    <p className="text-[12px] text-muted-foreground/80 mt-1.5 font-medium">{welcomeSubtitle}</p>
                                  </>
                                )}
                              </motion.div>

                              {/* Quick Prompts */}
                              <div className="w-full grid grid-cols-2 gap-2">
                                {quickPrompts.map((prompt, i) => (
                                  <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                                    onClick={() => sendMessage(prompt.text)}
                                    className="flex flex-col items-center gap-1.5 text-center px-2.5 py-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-[0.97] group"
                                  >
                                    <span className="text-lg group-hover:scale-110 transition-transform duration-200">{prompt.icon}</span>
                                    <span className="text-[11px] font-medium leading-tight">{prompt.text}</span>
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
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 items-start">
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
                              className="sticky bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-background border border-border shadow-md flex items-center justify-center z-10"
                            >
                              <ArrowDown className="h-3 w-3 text-muted-foreground" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Input */}
                      <form onSubmit={handleSubmit} className="border-t border-border px-2.5 py-2 bg-background flex-shrink-0">
                        {pendingImagePreview && (
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <div className="relative">
                              <img src={pendingImagePreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover border border-border" />
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
                          <input
                            id="ai-chat-image-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={isLoading || isUploading}
                            className="fixed right-full bottom-full h-px w-px opacity-0 pointer-events-none"
                          />
                          <label
                            htmlFor="ai-chat-image-input"
                            className={`flex-shrink-0 w-11 h-11 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors ${isLoading || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <Paperclip className="h-5 w-5" />
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
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
