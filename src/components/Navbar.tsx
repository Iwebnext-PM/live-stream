import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppView } from '../types/streaming';

interface NavbarProps {
  activeView: AppView;
  onNavigateView: (view: AppView, sectionId?: string) => void;
}

export function Navbar({ activeView, onNavigateView }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (view: AppView, sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigateView(view, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#060913]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home', 'top');
          }}
          className="text-lg font-display font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-violet-300 transition-colors"
        >
          GoToLive Stream
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          <a
            href="#streams"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', 'streams');
            }}
            className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors ${
              activeView === 'home'
                ? 'border-transparent hover:border-violet-400 hover:text-white'
                : 'border-transparent hover:border-violet-400 hover:text-white'
            }`}
          >
            Live Streams
          </a>
          <a
            href="#creators"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', 'creators');
            }}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400 hover:text-white transition-colors"
          >
            Creators
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', 'pricing');
            }}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400 hover:text-white transition-colors"
          >
            Pricing
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', 'contact');
            }}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400 hover:text-white transition-colors"
          >
            Contact
          </a>
          <button
            type="button"
            onClick={() => handleLinkClick('admin')}
            className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors cursor-pointer ${
              activeView === 'admin'
                ? 'border-violet-400 text-white'
                : 'border-transparent hover:border-violet-400 hover:text-white'
            }`}
          >
            Admin
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleLinkClick('studio')}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            {activeView === 'studio' ? 'Studio Active' : 'Start Streaming'}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0C1120] border-b border-white/10 px-4 py-4 space-y-1">
          <a
            href="#streams"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', 'streams');
            }}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            Live Streams
          </a>
          <a
            href="#creators"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', 'creators');
            }}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            Creators
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', 'pricing');
            }}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            Pricing
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', 'contact');
            }}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            Contact
          </a>
          <button
            type="button"
            onClick={() => handleLinkClick('admin')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-violet-300 hover:bg-white/5 cursor-pointer"
          >
            Admin Dashboard
          </button>
        </div>
      )}
    </header>
  );
}
