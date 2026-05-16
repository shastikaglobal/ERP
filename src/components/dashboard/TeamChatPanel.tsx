import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

export function TeamChatPanel() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  console.log('messages:', messages);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) setCurrentUser(user);
    });
    
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('team_chat')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (error) console.error('Fetch error:', error);
      else if (isMounted && data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel('team-chat-live')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'team_chat' 
      }, (payload) => {
        if (isMounted) {
          setMessages(prev => [...prev, payload.new]);
          if (!isOpen && payload.new.sender_id !== currentUser?.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      })
      .subscribe();
      
    const presenceChannel = supabase.channel('chat_presence_live', {
      config: { presence: { key: currentUser?.id || 'anonymous' } }
    });
    
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      if (isMounted) setOnlineCount(Object.keys(state).length);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [isOpen, currentUser?.id]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const messageText = inputText.trim();

    const { error } = await supabase.from('team_chat').insert({
      sender_name: currentUser?.email || 'Unknown',
      sender_id: currentUser?.id,
      message: messageText
    });

    if (error) console.error('Send error:', error);
    else setInputText("");
  };

  const formatTime = (ts: string) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* FLOATING BUBBLE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#1a1a1a] border-2 border-[#f0a500] flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50 group"
        >
          <MessageCircle className="h-6 w-6 text-[#f0a500] group-hover:fill-[#f0a500]/20 transition-colors" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#1a1a1a]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      )}

      {/* CHAT POPUP */}
      {isOpen && (
        <div 
          ref={popupRef}
          className="fixed bottom-[90px] right-6 w-[360px] h-[500px] bg-[#1a1a1a] rounded-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-8 duration-200"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        >
          {/* HEADER */}
          <div className="h-[60px] shrink-0 bg-[#f0a500] flex items-center justify-between px-4">
            <div>
              <h3 className="font-bold text-black leading-tight">Team Chat</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-700 animate-pulse"></div>
                <span className="text-[11px] font-medium text-black/70">Live • {onlineCount} online</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-black/70 hover:text-black hover:bg-black/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* MESSAGES AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111111]">
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUser?.id;
              
              return (
                <div key={msg.id || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="shrink-0 flex items-end">
                      <div className="h-6 w-6 rounded-full bg-[#2a2a2a] text-white flex items-center justify-center text-[10px] font-bold border border-white/10">
                        {getInitials(msg.sender_name || "U")}
                      </div>
                    </div>

                    {/* Bubble */}
                    <div 
                      className={`px-3 py-2 ${
                        isMe 
                          ? 'bg-[#f0a500] text-black rounded-[18px_18px_4px_18px]' 
                          : 'bg-[#2a2a2a] text-white rounded-[18px_18px_18px_4px]'
                      }`}
                    >
                      {!isMe && (
                        <div className="text-[10px] font-bold text-[#f0a500] mb-0.5">
                          {msg.sender_name}
                        </div>
                      )}
                      <p className="text-[13px] leading-snug whitespace-pre-wrap word-break-words break-words">
                        {msg.message}
                      </p>
                      <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-white/40'}`}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="shrink-0 p-3 bg-[#1a1a1a] border-t border-[#2a2a2a]">
            <div className="flex items-end gap-2 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-2xl py-2.5 pl-4 pr-12 resize-none focus:outline-none focus:ring-1 focus:ring-[#f0a500] max-h-32 min-h-[44px]"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="absolute right-2 bottom-1.5 h-8 w-8 rounded-full bg-[#f0a500] text-black flex items-center justify-center disabled:opacity-50 transition-opacity hover:bg-[#ffb515]"
              >
                <Send className="h-4 w-4 shrink-0 -ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
