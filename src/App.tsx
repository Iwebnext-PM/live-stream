import React, { useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { BroadcastStudio } from './components/BroadcastStudio';
import { CreatorProfileModal } from './components/CreatorProfileModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeroSection } from './components/HeroSection';
import { MarketingSections } from './components/MarketingSections';
import { Navbar } from './components/Navbar';
import { StreamPlayerModal } from './components/StreamPlayerModal';
import { StreamsDiscoverySection } from './components/StreamsDiscoverySection';
import { PlatformProvider } from './context/PlatformContext';
import { AppView, StreamItem } from './types/streaming';

function GoToLiveAppShell() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStream, setActiveStream] = useState<StreamItem | null>(null);
  const [activeCreatorId, setActiveCreatorId] = useState<string | null>(null);

  const handleNavigateView = (view: AppView, sectionId?: string) => {
    setActiveView(view);
    if (view === 'home' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectCategoryAndScroll = (category: string) => {
    setActiveView('home');
    setSelectedCategory(category);
    setTimeout(() => {
      const el = document.getElementById('streams');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col">
      <Navbar activeView={activeView} onNavigateView={handleNavigateView} />

      <main className="flex-1">
        {activeView === 'home' && (
          <>
            <HeroSection
              onStartStreaming={() => handleNavigateView('studio')}
              onExploreStreams={() => handleNavigateView('home', 'streams')}
              onWatchStream={(stream) => setActiveStream(stream)}
            />

            <StreamsDiscoverySection
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onWatchStream={(stream) => setActiveStream(stream)}
              onStartStreaming={() => handleNavigateView('studio')}
            />

            <MarketingSections
              onStartStreaming={() => handleNavigateView('studio')}
              onSelectCategoryAndScroll={handleSelectCategoryAndScroll}
              onOpenCreatorProfile={(creatorId) => setActiveCreatorId(creatorId)}
            />
          </>
        )}

        {activeView === 'studio' && (
          <BroadcastStudio onBackHome={() => handleNavigateView('home', 'streams')} />
        )}

        {activeView === 'admin' && (
          <AdminDashboard onBackHome={() => handleNavigateView('home')} />
        )}
      </main>

      <StreamPlayerModal
        stream={activeStream}
        onClose={() => setActiveStream(null)}
        onOpenCreatorProfile={(creatorId) => {
          setActiveStream(null);
          setActiveCreatorId(creatorId);
        }}
      />

      <CreatorProfileModal
        creatorId={activeCreatorId}
        onClose={() => setActiveCreatorId(null)}
        onWatchStream={(stream) => setActiveStream(stream)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PlatformProvider>
        <GoToLiveAppShell />
      </PlatformProvider>
    </ErrorBoundary>
  );
}
