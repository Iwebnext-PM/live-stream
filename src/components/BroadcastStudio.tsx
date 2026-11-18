import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  MessageSquare,
  Mic,
  MicOff,
  Radio,
  Send,
  Settings2,
  Square,
  Users,
} from 'lucide-react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { usePlatform } from '../context/PlatformContext';
import { clampString, db, sanitizeDocId, sanitizeTags } from '../services/firebase';
import {
  STREAMING_PROVIDERS,
  StreamingSessionState,
  createStreamingAdapter,
} from '../services/streamingAdapter';
import { ChatMessage, StreamProviderType, StreamQuality } from '../types/streaming';

interface BroadcastStudioProps {
  onBackHome: () => void;
}

export function BroadcastStudio({ onBackHome }: BroadcastStudioProps) {
  const { user, categories, signInWithGoogle, saveStream } = usePlatform();

  // MediaDevices & Permissions State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [requestingMedia, setRequestingMedia] = useState(false);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [micLevel, setMicLevel] = useState(0);

  // Stream Config & Adapter State
  const [streamTitle, setStreamTitle] = useState('Live Creator Session — Studio Preview');
  const [streamCategory, setStreamCategory] = useState(categories[0]?.name || 'Technology');
  const [streamTags, setStreamTags] = useState('Live, Studio, Interactive');
  const [quality, setQuality] = useState<StreamQuality>('1080p60');
  const [providerType, setProviderType] = useState<StreamProviderType>('demo');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [tokenOrAppId, setTokenOrAppId] = useState('');
  const [streamKey, setStreamKey] = useState('');

  const [sessionState, setSessionState] = useState<StreamingSessionState>('idle');
  const [sessionMessage, setSessionMessage] = useState<string>(
    'Grant camera & microphone access to preview your broadcast feed.'
  );
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewerCount, setViewerCount] = useState(1);

  // Studio Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  // Attach MediaStream to <video> element
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Clean up media tracks & audio analyser on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [mediaStream]);

  // Elapsed timer when broadcasting in Demo or Live mode
  useEffect(() => {
    if (sessionState !== 'demo_broadcasting' && sessionState !== 'connected_live') {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionState]);

  // Listen to real-time chat when a Demo stream listing is published to Firestore
  useEffect(() => {
    if (!activeStreamId) return;
    const q = query(
      collection(db, 'streams', activeStreamId, 'chat'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setChatMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) })));
    });
    return () => unsub();
  }, [activeStreamId]);

  const startAudioMeter = (stream: MediaStream) => {
    try {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setMicLevel(0);
    }
  };

  const requestCameraAndMic = async (vId?: string, aId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError(
        'Browser MediaDevices API is unavailable in this context. Ensure HTTPS or camera permissions are enabled.'
      );
      return;
    }

    setRequestingMedia(true);
    setPermissionError(null);

    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: vId ? { deviceId: { exact: vId } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: aId ? { deviceId: { exact: aId } } : true,
      });

      setMediaStream(stream);
      setVideoEnabled(true);
      setAudioEnabled(true);
      setSessionState('preview_ready');
      setSessionMessage('Local camera & microphone preview active. Ready for Demo Mode or external SFU connection.');
      startAudioMeter(stream);

      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
      setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Camera or microphone permission was denied.';
      setPermissionError(
        `Permission error: ${msg}. Please allow camera and microphone access in your browser bar.`
      );
      setSessionState('idle');
    } finally {
      setRequestingMedia(false);
    }
  };

  const toggleVideoTrack = () => {
    if (!mediaStream) return;
    mediaStream.getVideoTracks().forEach((track) => {
      track.enabled = !videoEnabled;
    });
    setVideoEnabled((prev) => !prev);
  };

  const toggleAudioTrack = () => {
    if (!mediaStream) return;
    mediaStream.getAudioTracks().forEach((track) => {
      track.enabled = !audioEnabled;
    });
    setAudioEnabled((prev) => !prev);
  };

  const handleStartBroadcast = async () => {
    if (!mediaStream) {
      setPermissionError('Connect your camera and microphone before starting a broadcast.');
      return;
    }
    if (!streamTitle.trim()) {
      setPermissionError('Enter a stream title before starting.');
      return;
    }

    const adapter = createStreamingAdapter(providerType);
    const result = await adapter.startBroadcast(mediaStream, {
      providerType,
      endpointUrl,
      tokenOrAppId,
      streamKey,
      quality,
    });

    setSessionState(result.state);
    setSessionMessage(result.message);

    if (
      (result.state === 'demo_broadcasting' || result.state === 'connected_live') &&
      user
    ) {
      try {
        const publishedId = await saveStream({
          title: streamTitle,
          description:
            result.state === 'demo_broadcasting'
              ? 'Live creator Demo Broadcast initiated from the GoToLive Broadcast Studio.'
              : 'Live WebRTC stream published from the GoToLive Broadcast Studio.',
          category: streamCategory,
          tags: sanitizeTags(streamTags.split(','), 6, 30),
          viewerCount: 1,
          isLive: true,
          isDemo: result.state === 'demo_broadcasting',
          quality,
          providerType,
        });
        setActiveStreamId(publishedId);
        setViewerCount(1);
      } catch (err) {
        console.warn('Could not publish stream listing:', err);
      }
    }
  };

  const handleStopBroadcast = async () => {
    const adapter = createStreamingAdapter(providerType);
    await adapter.stopBroadcast();
    setSessionState(mediaStream ? 'preview_ready' : 'idle');
    setSessionMessage('Broadcast stopped. Local studio preview remains ready.');
    if (activeStreamId && user) {
      try {
        await saveStream(
          {
            title: streamTitle,
            category: streamCategory,
            isLive: false,
            isDemo: providerType === 'demo',
            quality,
            providerType,
          },
          activeStreamId
        );
      } catch {
        // Ignore non-fatal cleanup error
      }
    }
    setActiveStreamId(null);
  };

  const handleSendStudioChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = clampString(chatInput, 400);
    if (!trimmed) return;

    if (!user) {
      await signInWithGoogle();
      return;
    }

    if (!activeStreamId) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          streamId: 'local-preview',
          authorUid: user.uid,
          authorName: user.displayName || 'Host',
          text: trimmed,
        },
      ]);
      setChatInput('');
      return;
    }

    const msgId = sanitizeDocId(`msg-${Date.now()}`);
    await setDoc(doc(db, 'streams', activeStreamId, 'chat', msgId), {
      streamId: activeStreamId,
      authorUid: user.uid,
      authorName: clampString(user.displayName || 'Host', 80),
      text: trimmed,
      createdAt: serverTimestamp(),
    });
    setChatInput('');
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const selectedProviderMeta = STREAMING_PROVIDERS.find((p) => p.id === providerType)!;
  const isBroadcasting =
    sessionState === 'demo_broadcasting' || sessionState === 'connected_live';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#060913] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Studio Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0C1120] border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Streams
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
                Broadcast Studio
              </h1>
              <p className="text-xs text-slate-400">
                Camera/microphone capture, Demo Mode preview, and LiveKit / Agora / WHIP integration hooks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="px-4 py-2 rounded-lg bg-[#0C1120] border border-white/15 text-xs font-semibold text-white hover:border-violet-400 transition-colors cursor-pointer"
              >
                Sign in with Google to Publish Listing
              </button>
            ) : (
              <span className="text-xs text-slate-300 bg-[#0C1120] border border-white/10 px-3 py-1.5 rounded-lg">
                Host: <strong className="text-white">{user.displayName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <div
          className={`mb-6 px-4 py-3 rounded-xl border text-xs sm:text-sm flex items-start sm:items-center justify-between gap-4 ${
            sessionState === 'credentials_required'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : sessionState === 'demo_broadcasting'
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-100'
                : sessionState === 'connected_live'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100'
                  : 'bg-[#0C1120] border-white/10 text-slate-300'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {sessionState === 'credentials_required' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <Radio className="w-4 h-4 text-violet-400 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <span>{sessionMessage}</span>
          </div>

          {isBroadcasting && (
            <div className="flex items-center gap-4 font-mono-tabular text-xs shrink-0">
              <span>{formatDuration(elapsedSeconds)}</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-violet-300" />
                {viewerCount}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Columns: Preview Stage + Settings */}
          <div className="lg:col-span-8 space-y-6">
            {/* Video Preview Canvas */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0C1120] border border-white/10 flex flex-col items-center justify-center">
              {mediaStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${videoEnabled ? 'opacity-100' : 'opacity-20'}`}
                />
              ) : (
                <div className="text-center p-6 max-w-md">
                  <Camera className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                  <h2 className="text-lg font-display font-semibold text-white mb-2">
                    Connect Camera & Microphone
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mb-5">
                    Preview your video frame and microphone audio levels directly in your browser before going live.
                  </p>
                  <button
                    type="button"
                    onClick={() => requestCameraAndMic()}
                    disabled={requestingMedia}
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-semibold transition-all cursor-pointer"
                  >
                    {requestingMedia ? 'Requesting Access...' : 'Enable Camera & Mic'}
                  </button>
                </div>
              )}

              {/* Live Overlay HUD */}
              {mediaStream && (
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wider uppercase ${
                        sessionState === 'connected_live'
                          ? 'bg-rose-600 text-white'
                          : sessionState === 'demo_broadcasting'
                            ? 'bg-violet-600 text-white'
                            : 'bg-black/70 text-slate-200 border border-white/15'
                      }`}
                    >
                      {sessionState === 'connected_live'
                        ? 'LIVE'
                        : sessionState === 'demo_broadcasting'
                          ? 'DEMO BROADCAST'
                          : 'LOCAL PREVIEW'}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-black/70 text-[11px] font-mono-tabular text-slate-300 border border-white/10">
                      {quality}
                    </span>
                  </div>

                  {/* Audio Level Meter */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/70 border border-white/10">
                    <Mic className="w-3.5 h-3.5 text-violet-400" />
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-75"
                        style={{ width: `${audioEnabled ? micLevel : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Controls Toolbar */}
              {mediaStream && (
                <div className="absolute bottom-3 inset-x-3 flex flex-wrap items-center justify-between gap-3 bg-black/75 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleVideoTrack}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        videoEnabled
                          ? 'bg-white/10 text-white hover:bg-white/15'
                          : 'bg-rose-600/80 text-white'
                      }`}
                    >
                      {videoEnabled ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
                      {videoEnabled ? 'Cam On' : 'Cam Off'}
                    </button>
                    <button
                      type="button"
                      onClick={toggleAudioTrack}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        audioEnabled
                          ? 'bg-white/10 text-white hover:bg-white/15'
                          : 'bg-rose-600/80 text-white'
                      }`}
                    >
                      {audioEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      {audioEnabled ? 'Mic On' : 'Muted'}
                    </button>
                  </div>

                  {!isBroadcasting ? (
                    <button
                      type="button"
                      onClick={handleStartBroadcast}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      {providerType === 'demo' ? 'Start Demo Broadcast' : 'Connect & Go Live'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopBroadcast}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Stop Stream
                    </button>
                  )}
                </div>
              )}
            </div>

            {permissionError && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs sm:text-sm text-rose-200 flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{permissionError}</span>
              </div>
            )}

            {/* Stream Configuration & Provider Architecture Panel */}
            <div className="p-6 rounded-2xl bg-[#0C1120] border border-white/10 space-y-6">
              <div className="flex items-center gap-2 text-sm font-display font-semibold text-white">
                <Settings2 className="w-4 h-4 text-violet-400" />
                <span>Stream Settings & Streaming Infrastructure</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Stream Title
                  </label>
                  <input
                    type="text"
                    maxLength={140}
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={streamCategory}
                    onChange={(e) => setStreamCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white focus:outline-none focus:border-violet-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={streamTags}
                    onChange={(e) => setStreamTags(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Quality
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as StreamQuality)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#060913] border border-white/10 text-sm text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="1080p60">1080p60 HD</option>
                    <option value="720p60">720p60</option>
                    <option value="480p">480p Standard</option>
                    <option value="Auto">Auto Adaptive</option>
                  </select>
                </div>

                {videoDevices.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Camera Input
                    </label>
                    <select
                      value={selectedVideoId}
                      onChange={(e) => {
                        setSelectedVideoId(e.target.value);
                        requestCameraAndMic(e.target.value, selectedAudioId);
                      }}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#060913] border border-white/10 text-xs text-white"
                    >
                      {videoDevices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {audioDevices.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Microphone Input
                    </label>
                    <select
                      value={selectedAudioId}
                      onChange={(e) => {
                        setSelectedAudioId(e.target.value);
                        requestCameraAndMic(selectedVideoId, e.target.value);
                      }}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#060913] border border-white/10 text-xs text-white"
                    >
                      {audioDevices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Microphone ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Streaming Provider Adapter Selector */}
              <div className="pt-4 border-t border-white/10">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Streaming Backend Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                  {STREAMING_PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProviderType(p.id)}
                      className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                        providerType === p.id
                          ? 'bg-violet-600/15 border-violet-500 text-white'
                          : 'bg-[#060913] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold">{p.label}</span>
                        {providerType === p.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>
                    </button>
                  ))}
                </div>

                {selectedProviderMeta.requiresCredentials && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#060913] border border-amber-500/25">
                    {selectedProviderMeta.credentialFields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          {field.label}
                        </label>
                        <input
                          type={field.key === 'streamKey' ? 'password' : 'text'}
                          value={
                            field.key === 'endpointUrl'
                              ? endpointUrl
                              : field.key === 'tokenOrAppId'
                                ? tokenOrAppId
                                : streamKey
                          }
                          onChange={(e) => {
                            if (field.key === 'endpointUrl') setEndpointUrl(e.target.value);
                            if (field.key === 'tokenOrAppId') setTokenOrAppId(e.target.value);
                            if (field.key === 'streamKey') setStreamKey(e.target.value);
                          }}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 rounded-lg bg-[#0C1120] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Studio Live Chat */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0C1120] border border-white/10 flex flex-col h-[520px] lg:h-auto">
            <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <span>Studio Chat Monitor</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {activeStreamId ? 'Firestore Synced' : 'Local Preview'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  Messages from viewers will appear here when your Demo Broadcast or Live stream starts.
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="text-xs leading-relaxed">
                    <span className="font-semibold text-violet-300 mr-2">{msg.authorName}:</span>
                    <span className="text-slate-200">{msg.text}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendStudioChat} className="p-3 border-t border-white/10 bg-[#060913]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  maxLength={400}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={user ? 'Send host announcement...' : 'Sign in to post chat...'}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0C1120] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
