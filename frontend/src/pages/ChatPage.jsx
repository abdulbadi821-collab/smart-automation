import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { supabase } from '../supabase';
import { 
  Send, 
  Sparkles, 
  User, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Bot
} from 'lucide-react';

export const ChatPage = () => {
  const { id: conversationId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(location.state?.initialPrompt || '');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Load conversation message history on mount
  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        setError(null);
        const data = await api.getConversationMessages(token, conversationId);
        if (isMounted) {
          setMessages(data || []);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        if (isMounted) {
          setError(err.message || 'Could not load conversation messages.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }

    if (token && conversationId) {
      loadHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [token, conversationId]);

  // 2. Subscribe to Supabase Realtime for this conversation_id
  useEffect(() => {
    if (!conversationId) return;

    const channelName = `realtime:messages:${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new;
            setMessages((prev) => {
              // Avoid duplicates if already present
              const exists = prev.some((m) => m.id === newRow.id);
              if (exists) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedRow.id ? updatedRow : msg))
            );
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old;
            setMessages((prev) => prev.filter((msg) => msg.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Focus input on initial mount
  useEffect(() => {
    if (!isLoadingHistory && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoadingHistory]);

  // 3. Handle message submit
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const question = inputText.trim();
    if (!question || isSending) return;

    setInputText('');
    setIsSending(true);
    setError(null);

    try {
      // Call backend POST /api/conversations/:id/messages
      // Backend performs: insert user msg -> insert assistant 'sending' -> update 'generating' -> Gemini call -> update 'completed'
      await api.sendMessage(token, conversationId, question);
    } catch (err) {
      console.error('Failed to send question:', err);
      setError(err.message || 'Error sending message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Helper badge renderer for assistant messages
  const renderStatusBadge = (status) => {
    if (!status || status === 'completed') return null;

    if (status === 'sending') {
      return (
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-300 animate-pulse mt-2">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Sending to AI queue...</span>
        </div>
      );
    }

    if (status === 'generating') {
      return (
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-[11px] font-medium text-brand-300 animate-soft-pulse mt-2 shadow-sm">
          <Sparkles className="w-3 h-3 text-brand-400 animate-spin" />
          <span>Generating AI response...</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950">
      {/* Chat Header Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Learning Conversation</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" title="Realtime active" />
            </h1>
            <p className="text-[11px] text-slate-400">
              Live updates enabled via Supabase Realtime
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {isLoadingHistory ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            <p className="text-xs">Restoring conversation history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 shadow-sm">
              <Bot className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-white">Ask your first question</h2>
            <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
              Inquire about any topic, concept, math problem, or code snippet. Your AI Learning Assistant will generate a detailed explanation.
            </p>
            <div className="w-full space-y-2">
              {[
                'How does an event loop in Node.js work?',
                'Explain Supabase Row Level Security with an example',
                'What is the difference between supervised and unsupervised learning?'
              ].map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(sample)}
                  className="w-full text-left px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/30 text-xs text-slate-300 hover:text-white transition-all truncate"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                    isUser
                      ? 'bg-brand-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800/80 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {/* Message content */}
                  {message.content ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                      {message.content}
                    </div>
                  ) : !isUser && message.status !== 'completed' ? (
                    <div className="flex items-center space-x-2 text-xs text-slate-400 py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                      <span>Thinking and formulating answer...</span>
                    </div>
                  ) : null}

                  {/* Assistant Status Badge for 'sending' or 'generating' */}
                  {!isUser && renderStatusBadge(message.status)}

                  {/* Timestamp */}
                  <div
                    className={`text-[10px] mt-1.5 ${
                      isUser ? 'text-slate-900/70 text-right' : 'text-slate-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="px-4 sm:px-6 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 sm:p-6 border-t border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-2.5">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              id="chat-message-input"
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Ask a question about any subject... (Shift+Enter for newline)"
              className="w-full resize-none rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all max-h-32"
            />
          </div>

          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-slate-950 bg-brand-400 hover:bg-brand-300 shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-[46px]"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
