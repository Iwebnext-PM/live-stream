import { StreamProviderType, StreamQuality } from '../types/streaming';

export type StreamingSessionState =
  | 'idle'
  | 'preview_ready'
  | 'demo_broadcasting'
  | 'credentials_required'
  | 'connected_live';

export interface StreamingProviderConfig {
  providerType: StreamProviderType;
  endpointUrl?: string;
  tokenOrAppId?: string;
  streamKey?: string;
  quality: StreamQuality;
}

export interface ProviderCapabilityInfo {
  id: StreamProviderType;
  label: string;
  requiresCredentials: boolean;
  credentialFields: Array<{
    key: 'endpointUrl' | 'tokenOrAppId' | 'streamKey';
    label: string;
    placeholder: string;
  }>;
  description: string;
}

export const STREAMING_PROVIDERS: ProviderCapabilityInfo[] = [
  {
    id: 'demo',
    label: 'Demo Mode (Local Browser Preview)',
    requiresCredentials: false,
    credentialFields: [],
    description:
      'Runs local camera and microphone capture via WebRTC MediaDevices and optionally publishes a clearly labeled Demo Broadcast card to Firestore.',
  },
  {
    id: 'livekit',
    label: 'LiveKit SFU (External Backend Required)',
    requiresCredentials: true,
    credentialFields: [
      {
        key: 'endpointUrl',
        label: 'LiveKit WebSocket Server URL',
        placeholder: 'wss://your-project.livekit.cloud',
      },
      {
        key: 'tokenOrAppId',
        label: 'Server-Signed Participant Token Endpoint',
        placeholder: '/api/livekit/token',
      },
    ],
    description:
      'Connects to a LiveKit SFU room for multi-viewer ultra-low-latency WebRTC distribution. Requires LiveKit server URL and token endpoint.',
  },
  {
    id: 'agora',
    label: 'Agora RTC (External Backend Required)',
    requiresCredentials: true,
    credentialFields: [
      {
        key: 'tokenOrAppId',
        label: 'Agora App ID',
        placeholder: 'Enter Agora App ID',
      },
      {
        key: 'endpointUrl',
        label: 'Agora Token Service URL',
        placeholder: '/api/agora/token',
      },
    ],
    description:
      'Uses Agora SD-RTN edge channels for global interactive video broadcasting. Requires an Agora App ID and token generator.',
  },
  {
    id: 'webrtc',
    label: 'Custom WebRTC / WHIP Ingest (External Backend Required)',
    requiresCredentials: true,
    credentialFields: [
      {
        key: 'endpointUrl',
        label: 'WHIP Ingest Endpoint URL',
        placeholder: 'https://ingest.example.com/whip/live',
      },
      {
        key: 'streamKey',
        label: 'Bearer Stream Key',
        placeholder: 'sk_live_...',
      },
    ],
    description:
      'Publishes an RTCPeerConnection SDP offer over HTTP POST using the standard WHIP protocol to Cloudflare Stream, MediaMTX, or custom SFU.',
  },
];

export interface StreamingAdapter {
  readonly providerType: StreamProviderType;
  validateConfig(config: StreamingProviderConfig): { valid: boolean; reason?: string };
  startBroadcast(
    stream: MediaStream,
    config: StreamingProviderConfig
  ): Promise<{ state: StreamingSessionState; message: string }>;
  stopBroadcast(): Promise<void>;
}

class DemoLocalStreamingAdapter implements StreamingAdapter {
  readonly providerType: StreamProviderType = 'demo';

  validateConfig(): { valid: boolean; reason?: string } {
    return { valid: true };
  }

  async startBroadcast(
    mediaStream: MediaStream,
    config: StreamingProviderConfig
  ): Promise<{ state: StreamingSessionState; message: string }> {
    const hasVideo = mediaStream.getVideoTracks().length > 0;
    const hasAudio = mediaStream.getAudioTracks().length > 0;
    if (!hasVideo && !hasAudio) {
      return {
        state: 'idle',
        message: 'Connect a camera or microphone before starting Demo Mode.',
      };
    }
    return {
      state: 'demo_broadcasting',
      message: `Demo Mode active (${config.quality}). Local MediaStream preview is running; no external media SFU is connected.`,
    };
  }

  async stopBroadcast(): Promise<void> {
    return;
  }
}

class ExternalProviderAdapter implements StreamingAdapter {
  readonly providerType: StreamProviderType;

  constructor(providerType: StreamProviderType) {
    this.providerType = providerType;
  }

  validateConfig(config: StreamingProviderConfig): { valid: boolean; reason?: string } {
    if (this.providerType === 'livekit') {
      if (!config.endpointUrl?.trim() || !config.tokenOrAppId?.trim()) {
        return {
          valid: false,
          reason:
            'LiveKit Server URL and Token Endpoint are required. Switch to Demo Mode to test locally without LiveKit credentials.',
        };
      }
      if (!config.endpointUrl.startsWith('wss://') && !config.endpointUrl.startsWith('ws://')) {
        return {
          valid: false,
          reason: 'LiveKit WebSocket URL must start with wss:// or ws://.',
        };
      }
      return { valid: true };
    }

    if (this.providerType === 'agora') {
      if (!config.tokenOrAppId?.trim() || !config.endpointUrl?.trim()) {
        return {
          valid: false,
          reason:
            'Agora App ID and Token Service URL are required. Switch to Demo Mode to test locally without Agora credentials.',
        };
      }
      return { valid: true };
    }

    if (this.providerType === 'webrtc') {
      if (!config.endpointUrl?.trim()) {
        return {
          valid: false,
          reason:
            'A WHIP ingest endpoint URL is required to send WebRTC SDP offers. Switch to Demo Mode for local preview.',
        };
      }
      return { valid: true };
    }

    return { valid: false, reason: 'Unsupported provider configuration.' };
  }

  async startBroadcast(
    _mediaStream: MediaStream,
    config: StreamingProviderConfig
  ): Promise<{ state: StreamingSessionState; message: string }> {
    const check = this.validateConfig(config);
    if (!check.valid) {
      return {
        state: 'credentials_required',
        message: check.reason || 'Backend streaming credentials required.',
      };
    }

    // Attempt real WHIP handshake if WHIP endpoint is provided; otherwise explain SDK integration point
    if (this.providerType === 'webrtc' && config.endpointUrl) {
      try {
        const pc = new RTCPeerConnection();
        _mediaStream.getTracks().forEach((track) => pc.addTrack(track, _mediaStream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const res = await fetch(config.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
            ...(config.streamKey ? { Authorization: `Bearer ${config.streamKey}` } : {}),
          },
          body: offer.sdp ?? '',
        });
        if (!res.ok) {
          pc.close();
          return {
            state: 'credentials_required',
            message: `WHIP endpoint responded with HTTP ${res.status}. Verify your ingest server and bearer stream key.`,
          };
        }
        const answerSdp = await res.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
        return {
          state: 'connected_live',
          message: 'Connected via WebRTC WHIP ingest.',
        };
      } catch (err) {
        return {
          state: 'credentials_required',
          message: `Could not reach WHIP ingest endpoint (${err instanceof Error ? err.message : 'network error'}). Local preview remains active.`,
        };
      }
    }

    return {
      state: 'credentials_required',
      message: `${this.providerType.toUpperCase()} credentials saved, but a server-side token signer is required to establish a live SFU room. Use Demo Mode for local preview.`,
    };
  }

  async stopBroadcast(): Promise<void> {
    return;
  }
}

export function createStreamingAdapter(providerType: StreamProviderType): StreamingAdapter {
  if (providerType === 'demo') {
    return new DemoLocalStreamingAdapter();
  }
  return new ExternalProviderAdapter(providerType);
}
