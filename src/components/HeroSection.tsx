import React from 'react';
import { ArrowRight, Play, Radio, Users, Video } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { StreamItem } from '../types/streaming';
import { SmartImage } from './SmartImage';

interface HeroSectionProps {
  onStartStreaming: () => void;
  onExploreStreams: () => void;
  onWatchStream: (stream: StreamItem) => void;
}

export function HeroSection({
  onStartStreaming,
  onExploreStreams,
  onWatchStream,
}: HeroSectionProps) {
  const { siteSettings, streams } = usePlatform();
  const featuredStream = streams.find((s) => s.isLive) || streams[0];

  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-white/10 bg-[#060913]"
    >
      {/* Focused subtle radial illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-violet-600/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-0 h-[440px] w-[440px] rounded-full bg-blue-600/15 blur-[120px]"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Column: Headline & CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-medium tracking-wider text-violet-300 uppercase mb-4">
              Live Video & Creator Broadcasting
            </p>
            <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-display font-bold tracking-tight text-white leading-[1.08] text-balance mb-5">
              {siteSettings.heroHeadline}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-8">
              {siteSettings.heroSubheadline}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onStartStreaming}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-950/40 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <Video className="w-4 h-4" />
                {siteSettings.primaryCtaLabel}
              </button>

              <button
                type="button"
                onClick={onExploreStreams}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold text-slate-100 bg-[#0C1120] border border-white/15 hover:border-violet-400/60 hover:bg-[#131B31] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {siteSettings.secondaryCtaLabel}
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Right Column: Live-Streaming Video Preview Card */}
          <div className="lg:col-span-6 flex">
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0C1120] flex flex-col justify-between min-h-[300px] lg:min-h-[380px] group">
              <SmartImage
                src={featuredStream?.thumbnailUrl || siteSettings.heroMediaUrl}
                alt={featuredStream?.title || 'GoToLive Stream Broadcast Studio Preview'}
                fallbackTitle="GoToLive Studio Preview"
                priority
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              {/* Measured scrim for >= 4.5:1 contrast */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/45 to-[#060913]/30"
              />

              {/* Top Overlay: Animated LIVE indicator + Demo distinction */}
              <div className="relative z-10 flex items-center justify-between p-5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-600 text-white text-[11px] font-semibold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" aria-hidden="true" />
                    LIVE
                  </span>
                  <span className="text-xs font-medium text-slate-200 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10">
                    {featuredStream?.isDemo ? 'Demo Broadcast Preview' : 'Live Ingest'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono-tabular text-slate-200 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                  <span>{(featuredStream?.viewerCount ?? 4820).toLocaleString()} watching</span>
                </div>
              </div>

              {/* Center Play Affordance */}
              <div className="relative z-10 flex items-center justify-center my-auto py-4">
                <button
                  type="button"
                  onClick={() => featuredStream && onWatchStream(featuredStream)}
                  aria-label="Open featured stream player"
                  className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-violet-600 hover:border-violet-400 transition-all cursor-pointer group-hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </button>
              </div>

              {/* Bottom Overlay: Stream Details */}
              <div className="relative z-10 p-5 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-300 mb-1.5">
                    <span>{featuredStream?.category || 'Gaming'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredStream?.creatorName || 'Elena Vance'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{featuredStream?.quality || '1080p60'}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-display font-semibold text-white truncate">
                    {featuredStream?.title || 'Featured Live Broadcast Preview'}
                  </h2>
                </div>
                {featuredStream && (
                  <button
                    type="button"
                    onClick={() => onWatchStream(featuredStream)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Watch Preview
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Streaming KPI Strip */}
        <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-400 mb-1">Active Viewers</p>
            <p className="text-2xl sm:text-3xl font-display font-bold text-white font-mono-tabular">
              {siteSettings.activeViewersCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Live Channels</p>
            <p className="text-2xl sm:text-3xl font-display font-bold text-white font-mono-tabular">
              {siteSettings.liveChannelsCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Broadcasts</p>
            <p className="text-2xl sm:text-3xl font-display font-bold text-white font-mono-tabular">
              {siteSettings.totalBroadcastsCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Streaming Architecture</p>
            <p className="text-base sm:text-lg font-display font-semibold text-violet-300 flex items-center gap-2 mt-1">
              <Radio className="w-4 h-4 shrink-0" />
              <span>WebRTC / SFU Ready</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
