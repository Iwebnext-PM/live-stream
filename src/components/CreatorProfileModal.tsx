import React from 'react';
import { BadgeCheck, Check, Play, UserPlus, Users, X } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { StreamItem } from '../types/streaming';
import { SmartImage } from './SmartImage';

interface CreatorProfileModalProps {
  creatorId: string | null;
  onClose: () => void;
  onWatchStream: (stream: StreamItem) => void;
}

export function CreatorProfileModal({
  creatorId,
  onClose,
  onWatchStream,
}: CreatorProfileModalProps) {
  const { creators, streams, userProfile, toggleFollowCreator } = usePlatform();

  if (!creatorId) return null;

  const creator = creators.find((c) => c.id === creatorId);
  if (!creator) return null;

  const creatorStreams = streams.filter((s) => s.creatorId === creator.id);
  const isFollowing = userProfile?.followedCreatorIds?.includes(creator.id) ?? false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${creator.name} creator profile`}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-3xl bg-[#0C1120] border border-white/15 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Banner */}
        <div className="relative h-32 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] border-b border-white/10 px-6 flex items-start justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close creator profile"
            className="p-2 rounded-lg bg-black/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
          {/* Avatar + Follow CTA */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-4">
              <SmartImage
                src={creator.avatarUrl}
                alt={creator.name}
                fallbackTitle={creator.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-[#0C1120] bg-[#131B31]"
              />
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                    {creator.name}
                  </h2>
                  {creator.isVerified && (
                    <BadgeCheck className="w-5 h-5 text-blue-400 shrink-0" aria-label="Verified Creator" />
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  @{creator.handle} · {creator.primaryCategory}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <p className="text-xs text-slate-400">Followers</p>
                <p className="text-base font-display font-bold text-white font-mono-tabular">
                  {creator.followersCount.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleFollowCreator(creator.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isFollowing
                    ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
                }`}
              >
                {isFollowing ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? 'Following' : 'Follow Channel'}
              </button>
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-slate-300 leading-relaxed mb-8">{creator.bio}</p>

          {/* Creator's Broadcasts */}
          <div>
            <h3 className="text-sm font-display font-semibold text-white mb-4">
              Channel Broadcasts ({creatorStreams.length})
            </h3>
            {creatorStreams.length === 0 ? (
              <div className="rounded-xl bg-[#060913] border border-white/10 p-6 text-center text-xs text-slate-400">
                No active broadcasts listed on this channel right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {creatorStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="rounded-xl bg-[#060913] border border-white/10 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative aspect-video">
                      <SmartImage
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        fallbackTitle={stream.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {stream.isLive && (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold uppercase">
                            LIVE
                          </span>
                        )}
                        {stream.isDemo && (
                          <span className="px-2 py-0.5 rounded bg-black/70 text-slate-200 text-[10px] border border-white/15">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-xs font-mono-tabular text-white">
                        <Users className="w-3.5 h-3.5 text-violet-400" />
                        {stream.viewerCount.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{stream.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {stream.category} · {stream.quality}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onWatchStream(stream);
                        }}
                        className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors shrink-0 cursor-pointer"
                        aria-label={`Watch ${stream.title}`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
