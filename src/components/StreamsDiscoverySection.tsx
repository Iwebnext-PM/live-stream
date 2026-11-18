import React from 'react';
import { Info, Play, Search, Users, X } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { StreamItem } from '../types/streaming';
import { SmartImage } from './SmartImage';

interface StreamsDiscoverySectionProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onWatchStream: (stream: StreamItem) => void;
  onStartStreaming: () => void;
}

export function StreamsDiscoverySection({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onWatchStream,
  onStartStreaming,
}: StreamsDiscoverySectionProps) {
  const { streams, categories, siteSettings, dataLoading } = usePlatform();

  const filteredStreams = streams.filter((stream) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      stream.category.toLowerCase() === selectedCategory.toLowerCase();

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      stream.title.toLowerCase().includes(q) ||
      stream.creatorName.toLowerCase().includes(q) ||
      stream.category.toLowerCase().includes(q) ||
      stream.tags.some((tag) => tag.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="streams" className="py-16 sm:py-20 border-b border-white/10 bg-[#060913]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header + Search */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Discover Live Streams
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl">
              Browse active channels by category, inspect stream quality, and join interactive chat rooms.
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search streams, creators, or tags..."
              aria-label="Search live streams"
              className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-[#0C1120] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Transparent Demo Mode Notice */}
        {siteSettings.streamingBannerNotice && (
          <div className="mb-6 flex items-start sm:items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[#0C1120] border border-white/10 text-xs sm:text-sm text-slate-300">
            <div className="flex items-start sm:items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>{siteSettings.streamingBannerNotice}</span>
            </div>
            <button
              type="button"
              onClick={onStartStreaming}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Studio
            </button>
          </div>
        )}

        {/* Interactive Category Filter Buttons */}
        <div
          role="tablist"
          aria-label="Stream categories"
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-8"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'All'}
            onClick={() => onSelectCategory('All')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-violet-600 text-white'
                : 'bg-[#0C1120] text-slate-300 border border-white/10 hover:border-white/25 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const active = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectCategory(cat.name)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-violet-600 text-white'
                    : 'bg-[#0C1120] text-slate-300 border border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {dataLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#0C1120] border border-white/10 overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-slate-800/70" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/2 bg-slate-800 rounded" />
                  <div className="h-5 w-full bg-slate-800 rounded" />
                  <div className="h-9 w-full bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStreams.length === 0 ? (
          /* Empty State */
          <div className="rounded-xl bg-[#0C1120] border border-white/10 p-12 text-center">
            <p className="text-lg font-display font-semibold text-white mb-2">
              No matching streams found
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Try clearing your search filter or switch to another streaming category.
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('All');
                onSearchChange('');
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Stream Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredStreams.map((stream) => (
              <article
                key={stream.id}
                className="group rounded-xl bg-[#0C1120] border border-white/10 hover:border-violet-500/50 transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* 16:9 Thumbnail */}
                  <div
                    onClick={() => onWatchStream(stream)}
                    className="relative aspect-video overflow-hidden bg-slate-900 cursor-pointer"
                  >
                    <SmartImage
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      fallbackTitle={stream.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35"
                    />

                    {/* Top status indicators */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {stream.isLive && (
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold tracking-wider uppercase">
                          LIVE
                        </span>
                      )}
                      {stream.isDemo && (
                        <span className="px-2 py-0.5 rounded bg-black/70 text-slate-200 text-[10px] font-medium border border-white/15">
                          DEMO
                        </span>
                      )}
                    </div>

                    {/* Viewer count bottom-left */}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-xs font-mono-tabular text-white">
                      <Users className="w-3.5 h-3.5 text-violet-400" />
                      <span>{stream.viewerCount.toLocaleString()}</span>
                    </div>

                    <div className="absolute bottom-2.5 right-3 text-[11px] font-mono-tabular text-slate-300">
                      {stream.quality}
                    </div>
                  </div>

                  {/* Card Body: Unboxed Metadata + Title */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 truncate">
                      <span className="text-violet-300 font-medium">{stream.category}</span>
                      {stream.tags.slice(0, 2).map((tag) => (
                        <React.Fragment key={tag}>
                          <span aria-hidden="true">·</span>
                          <span>{tag}</span>
                        </React.Fragment>
                      ))}
                    </div>

                    <h3 className="text-sm font-display font-semibold text-white leading-snug line-clamp-2 mb-3">
                      {stream.title}
                    </h3>

                    <div className="flex items-center gap-2.5">
                      <SmartImage
                        src={stream.creatorAvatarUrl}
                        alt={stream.creatorName}
                        fallbackTitle={stream.creatorName}
                        className="w-7 h-7 rounded-full object-cover border border-white/15 shrink-0"
                      />
                      <span className="text-xs font-medium text-slate-300 truncate">
                        {stream.creatorName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Watch Now CTA */}
                <div className="px-4 pb-4 pt-1">
                  <button
                    type="button"
                    onClick={() => onWatchStream(stream)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#131B31] hover:bg-violet-600 border border-white/10 hover:border-violet-500 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Watch Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
