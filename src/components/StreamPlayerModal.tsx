import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Maximize2,
  MessageSquare,
  Pause,
  Play,
  Send,
  Share2,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
} from 'firebase/firestore';
import { usePlatform } from '../context/PlatformContext';
import { OperationType, clampString, db, handleFirestoreError, sanitizeDocId } from '../services/firebase';
import { ChatMessage, StreamItem, StreamQuality } from '../types/streaming';
import { SmartImage } from './SmartImage';

interface StreamPlayerModalProps {
  stream: StreamItem | null;
  onClose: () => void;
  onOpenCreatorProfile: (creatorId: string) => void;
}

const DEMO_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'demo-msg-1',
    streamId: 'demo',
    authorUid: 'demo-user-1',
    authorName: 'Jordan K.',
    text: 'Audio balance and bitrate look razor sharp on 1080p60.',
  },
  {
    id: 'demo-msg-2',
    streamId: 'demo',
    authorUid: 'demo-user-2',
    authorName: 'Priya S.',
    text: 'Can you share your lighting setup after this segment?',
  },
];

export function StreamPlayerModal({
  stream,
  onClose,
  onOpenCreatorProfile,
}: StreamPlayerModalProps) {
  const { user, userProfile, signInWithGoogle, toggleFollowCreator, creators } = usePlatform();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [quality, setQuality] = useState<StreamQuality>(stream?.quality || '1080p60');
  const [copiedShare, setCopiedShare] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatNotice, setChatNotice] = useState<string | null>(null);

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!stream) return;
    setQuality(stream.quality);
    setIsPlaying(true);
    setChatNotice(null);

    const q = query(
      collection(db, 'streams', stream.id, 'chat'),
      orderBy('createdAt', 'asc'),
      limit(60)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setChatMessages(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) }))
          );
        } else {
          setChatMessages(DEMO_CHAT_MESSAGES);
        }
      },
      (err) => {
        console.warn('Chat listener fallback:', err.message);
        setChatMessages(DEMO_CHAT_MESSAGES);
      }
    );

    return () => unsub();
  }, [stream]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = isMuted;
    vid.volume = volume / 100;
    if (isPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isPlaying, isMuted, volume]);

  if (!stream) return null;

  const creator = creators.find((c) => c.id === stream.creatorId);
  const isFollowing = userProfile?.followedCreatorIds?.includes(stream.creatorId) ?? false;

  const handleFullscreen = () => {
    if (playerContainerRef.current?.requestFullscreen) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?stream=${encodeURIComponent(stream.id)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = clampString(chatInput, 400);
    if (!trimmed) return;

    if (!user) {
      await signInWithGoogle();
      return;
    }

    setSendingChat(true);
    setChatNotice(null);
    const msgId = sanitizeDocId(`msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

    try {
      await setDoc(doc(db, 'streams', stream.id, 'chat', msgId), {
        streamId: stream.id,
        authorUid: user.uid,
        authorName: clampString(user.displayName || 'Viewer', 80),
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      setChatInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('Missing or insufficient permissions')) {
        setChatNotice(
          'Demo stream chat persistence requires this stream to be seeded to Firestore by an admin first.'
        );
      } else {
        handleFirestoreError(err, OperationType.CREATE, `streams/${stream.id}/chat/${msgId}`);
      }
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Watching ${stream.title}`}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6"
    >
      <div className="w-full max-w-6xl bg-[#0C1120] border border-white/15 rounded-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-white/10 bg-[#060913]">
          <div className="flex items-center gap-3 min-w-0">
            {stream.isLive && (
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold tracking-wider uppercase shrink-0">
                LIVE
              </span>
            )}
            <span className="text-xs font-medium text-slate-300 bg-white/5 px-2.5 py-0.5 rounded border border-white/10 shrink-0">
              {stream.isDemo ? 'Demo Broadcast Preview' : `${stream.providerType.toUpperCase()} Live`}
            </span>
            <h3 className="text-sm sm:text-base font-display font-semibold text-white truncate">
              {stream.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close video player"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Split: Video Player + Live Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left: Video Viewport & Stream Info */}
          <div className="lg:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10">
            <div
              ref={playerContainerRef}
              className="relative aspect-video bg-black flex items-center justify-center overflow-hidden"
            >
              {stream.videoPreviewUrl ? (
                <video
                  ref={videoRef}
                  src={stream.videoPreviewUrl}
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <SmartImage
                  src={stream.thumbnailUrl}
                  alt={stream.title}
                  fallbackTitle={stream.title}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isPlaying ? 'opacity-100' : 'opacity-60'
                  }`}
                />
              )}

              {/* Subtle Demo Playback HUD */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded bg-black/70 text-[11px] font-mono-tabular text-slate-200 border border-white/10">
                  {stream.isDemo
                    ? 'DEMO STREAM PLAYBACK · NO EXTERNAL RTMP/SFU ACTIVE'
                    : `LIVE · ${quality}`}
                </span>
                <span className="px-2.5 py-1 rounded bg-black/70 text-[11px] font-mono-tabular text-slate-200 border border-white/10 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                  {stream.viewerCount.toLocaleString()}
                </span>
              </div>

              {!isPlaying && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  aria-label="Resume playback"
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-violet-600/90 text-white flex items-center justify-center hover:bg-violet-500 transition-colors cursor-pointer"
                >
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </button>
              )}

              {/* Player Controls Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    aria-label={isPlaying ? 'Pause stream' : 'Play stream'}
                    className="p-1.5 rounded text-white hover:bg-white/10 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMuted((m) => !m)}
                      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                      className="p-1.5 rounded text-white hover:bg-white/10 cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        if (Number(e.target.value) > 0) setIsMuted(false);
                      }}
                      aria-label="Volume"
                      className="w-20 accent-violet-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as StreamQuality)}
                    aria-label="Select stream quality"
                    className="bg-black/70 border border-white/15 rounded px-2 py-1 text-xs font-mono-tabular text-slate-200 focus:outline-none focus:border-violet-400 cursor-pointer"
                  >
                    <option value="1080p60">1080p60</option>
                    <option value="720p60">720p60</option>
                    <option value="480p">480p</option>
                    <option value="Auto">Auto</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleFullscreen}
                    aria-label="Toggle fullscreen"
                    className="p-1.5 rounded text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Channel Action Row */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0C1120]">
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenCreatorProfile(stream.creatorId)}
                  className="shrink-0 cursor-pointer"
                >
                  <SmartImage
                    src={stream.creatorAvatarUrl || creator?.avatarUrl}
                    alt={stream.creatorName}
                    fallbackTitle={stream.creatorName}
                    className="w-11 h-11 rounded-full object-cover border border-white/15"
                  />
                </button>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenCreatorProfile(stream.creatorId)}
                    className="text-sm font-display font-semibold text-white hover:text-violet-300 transition-colors cursor-pointer truncate block"
                  >
                    {stream.creatorName}
                  </button>
                  <p className="text-xs text-slate-400 truncate">
                    {stream.category} · {(creator?.followersCount ?? 12400).toLocaleString()} followers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleFollowCreator(stream.creatorId)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isFollowing
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                      : 'bg-violet-600 text-white hover:bg-violet-500'
                  }`}
                >
                  {isFollowing ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-200 bg-[#131B31] border border-white/10 hover:border-white/25 transition-colors cursor-pointer"
                >
                  {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copiedShare ? 'Link Copied' : 'Share'}
                </button>
              </div>
            </div>

            {stream.description && (
              <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                {stream.description}
              </div>
            )}
          </div>

          {/* Right: Real-Time Live Chat */}
          <div className="lg:col-span-4 flex flex-col bg-[#080C17] h-[360px] lg:h-auto lg:max-h-[75vh]">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <span>Live Stream Chat</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {stream.isDemo ? 'Firestore + Demo' : 'Real-Time'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-xs leading-relaxed">
                  <span className="font-semibold text-violet-300 mr-2">{msg.authorName}:</span>
                  <span className="text-slate-200">{msg.text}</span>
                </div>
              ))}
            </div>

            {chatNotice && (
              <div className="mx-4 mb-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                {chatNotice}
              </div>
            )}

            <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 bg-[#060913]">
              {user ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    maxLength={400}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message to chat..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0C1120] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !chatInput.trim()}
                    aria-label="Send chat message"
                    className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="w-full py-2 px-3 rounded-lg bg-[#0C1120] hover:bg-[#131B31] border border-white/15 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                >
                  Sign in with Google to join live chat
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
