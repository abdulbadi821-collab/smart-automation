import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Brain, Zap, History, Shield, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        {/* Top badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-brand-300 mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Powered by Google Gemini 3.1 & Supabase Realtime</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Master any subject with your personalized{' '}
          <span className="bg-gradient-to-r from-brand-400 to-emerald-200 bg-clip-text text-transparent">
            AI Learning Assistant
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Ask complex questions, break down difficult concepts, and track your conversational learning journey with live streaming status indicators.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link
              id="cta-dashboard"
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl font-semibold text-slate-950 bg-brand-400 hover:bg-brand-300 shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                id="cta-register"
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl font-semibold text-slate-950 bg-brand-400 hover:bg-brand-300 shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
              >
                <span>Start Learning Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                id="cta-login"
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <span>Existing User? Log In</span>
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-5">
              <Brain className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Deep Concept Explanations</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Synthesize challenging topics into intuitive, step-by-step breakdowns with code samples, analogies, and practical exercises.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Realtime Status Pipeline</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience responsive state transitions from <span className="text-slate-300 font-mono">sending</span> to <span className="text-slate-300 font-mono">generating</span> to <span className="text-slate-300 font-mono">completed</span> via Supabase Realtime.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm hover:border-slate-700/80 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Persistent History & Control</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pick up exactly where you left off. Every session is securely stored with RLS protection and instant one-click deletion control.
            </p>
          </div>
        </div>

        {/* Local Verification Highlights */}
        <div className="mt-16 p-6 rounded-2xl bg-slate-900/30 border border-slate-800/60 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Strict JWT scoped isolation</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Flash model speed with fallback</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Fully responsive mobile layout</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        AI Learning Assistant • Built with React, Vite, Node/Express, Supabase & Google Gemini
      </footer>
    </div>
  );
};
