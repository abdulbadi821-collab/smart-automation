import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  History, 
  Trash2, 
  MessageSquare, 
  Loader2, 
  Plus, 
  ArrowRight, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export const HistoryPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getConversations(token);
        if (isMounted) {
          setConversations(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch conversation history:', err);
        if (isMounted) {
          setError(err.message || 'Unable to load conversation history.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (token) {
      fetchHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleDelete = async (e, convId) => {
    e.stopPropagation();
    e.preventDefault();

    if (!window.confirm('Are you sure you want to delete this conversation? All associated messages will be deleted.')) {
      return;
    }

    try {
      setDeletingId(convId);
      await api.deleteConversation(token, convId);
      // Remove from state on success
      setConversations((prev) => prev.filter((c) => c.id !== convId));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert(err.message || 'Failed to delete conversation.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <History className="w-7 h-7 text-brand-400" />
            <span>Learning History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review past discussions or prune sessions you no longer need.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-brand-400 hover:bg-brand-300 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Session</span>
        </Link>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Conversations List */}
      <div className="mt-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            <p className="text-sm">Loading your conversation history...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">No conversations found</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">
              When you ask questions in the assistant, your sessions are archived here automatically.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-brand-400 hover:bg-brand-300 transition-colors shadow-sm"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70 transition-all cursor-pointer"
              >
                <div className="flex items-start space-x-3.5 min-w-0 pr-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400 shrink-0 group-hover:bg-brand-500/10 transition-colors mt-0.5">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
                      {conv.title || 'Untitled conversation'}
                    </h3>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(conv.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(conv.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    id={`delete-conv-${conv.id}`}
                    onClick={(e) => handleDelete(e, conv.id)}
                    disabled={deletingId === conv.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-900/40 disabled:opacity-50"
                    title="Delete conversation"
                  >
                    {deletingId === conv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
