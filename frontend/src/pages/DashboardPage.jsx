import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  Plus, 
  MessageSquare, 
  MessagesSquare, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Loader2, 
  BookOpen,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

export const DashboardPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ conversationCount: 0, messageCount: 0 });
  const [recentConversations, setRecentConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch stats and conversations in parallel
        const [statsData, convsData] = await Promise.all([
          api.getDashboardStats(token),
          api.getConversations(token),
        ]);

        if (isMounted) {
          setStats(statsData || { conversationCount: 0, messageCount: 0 });
          setRecentConversations((convsData || []).slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        if (isMounted) {
          setError(err.message || 'Unable to connect to backend server');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (token) {
      loadDashboardData();
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleStartNewChat = async (suggestedPrompt = null) => {
    try {
      setIsCreatingChat(true);
      const newConv = await api.createConversation(token, suggestedPrompt ? 'New Learning Session' : 'New conversation');
      if (newConv && newConv.id) {
        if (suggestedPrompt) {
          // Pass pre-filled prompt in navigation state if user clicked an idea card
          navigate(`/chat/${newConv.id}`, { state: { initialPrompt: suggestedPrompt } });
        } else {
          navigate(`/chat/${newConv.id}`);
        }
      }
    } catch (err) {
      console.error('Failed to create new conversation:', err);
      setError(err.message || 'Could not start new chat. Please try again.');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const sampleTopics = [
    { title: 'Quantum Computing Fundamentals', prompt: 'Explain the principles of superposition and entanglement with simple analogies.' },
    { title: 'Clean Architecture in Node.js', prompt: 'What are the key layers of Clean Architecture and how do I structure an Express API?' },
    { title: 'Machine Learning Neural Networks', prompt: 'Break down how backpropagation and gradient descent train deep neural networks.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Banner & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400 font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Learning Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your questions, review previous sessions, or start exploring a new topic.
          </p>
        </div>

        {/* New Chat Primary Action Button */}
        <div>
          <button
            id="dashboard-new-chat-btn"
            onClick={() => handleStartNewChat()}
            disabled={isCreatingChat}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-semibold text-slate-950 bg-brand-400 hover:bg-brand-300 shadow-md shadow-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
          >
            {isCreatingChat ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing Session...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Start New Chat</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="underline font-semibold hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Metric 1: Conversations */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Conversations</p>
              <p id="stat-conversations-count" className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-brand-400" /> : stats.conversationCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Sessions created and preserved with Supabase RLS
          </p>
        </div>

        {/* Metric 2: Messages */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Messages Exchanged</p>
              <p id="stat-messages-count" className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-brand-400" /> : stats.messageCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessagesSquare className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Realtime questions and AI-generated answers
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Conversations List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Recent Conversations</span>
            </h2>
            {recentConversations.length > 0 && (
              <Link to="/history" className="text-xs text-brand-400 font-semibold hover:underline flex items-center space-x-1">
                <span>View all history</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400 mb-2" />
              <p className="text-xs">Fetching recent conversations...</p>
            </div>
          ) : recentConversations.length === 0 ? (
            // Intentionally designed zero state
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No learning sessions yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                Your conversational history will appear here once you ask your first question. Start now with any subject!
              </p>
              <button
                id="empty-state-new-chat-btn"
                onClick={() => handleStartNewChat()}
                disabled={isCreatingChat}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-brand-400 hover:bg-brand-300 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Launch First Conversation</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentConversations.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/chat/${conv.id}`}
                  className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800/70 hover:border-slate-700 hover:bg-slate-900/80 transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 shrink-0 group-hover:bg-brand-500/10 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                        {conv.title || 'Untitled conversation'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(conv.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-slate-500 group-hover:text-brand-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Suggested Learning Prompts (1 col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Learning Starters</span>
          </h2>
          <div className="space-y-3">
            {sampleTopics.map((topic, i) => (
              <button
                key={i}
                onClick={() => handleStartNewChat(topic.prompt)}
                disabled={isCreatingChat}
                className="w-full text-left p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 hover:border-brand-500/40 hover:bg-slate-900/60 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Idea #{i + 1}</span>
                  <Sparkles className="w-3 h-3 text-slate-500 group-hover:text-brand-400 transition-colors" />
                </div>
                <h4 className="text-sm font-semibold text-white mt-1 group-hover:text-brand-200 transition-colors">
                  {topic.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  "{topic.prompt}"
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
