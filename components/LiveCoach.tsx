
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, X, Activity } from 'lucide-react';
import { getAIClient } from '../services/geminiService';
import { canUseAudio } from '../services/ai';
import { Modality, LiveServerMessage, Session } from '@google/genai';

const LiveCoach: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [statusNote, setStatusNote] = useState<string>('Tap the mic, allow access, and start talking.');
  const audioCapable = canUseAudio();
  
  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<Promise<Session> | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Helper to convert float32 audio to PCM16
  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  };

  const base64ToUint8Array = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const startSession = async () => {
    if (!audioCapable) {
      setStatus('error');
      setStatusNote('Audio provider not configured. Add a Gemini key in Settings → AI Providers.');
      return;
    }

    setStatus('connecting');
    setStatusNote('Requesting microphone and starting Mae Live...');
    try {
      const ai = getAIClient();
      if (!ai) {
        setStatus('error');
        setStatusNote('Gemini key missing. Add VITE_GEMINI_API_KEY or configure in Settings → AI Providers.');
        return;
      }
      
      // Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      await Promise.all([audioContextRef.current.resume?.(), inputCtx.resume?.()]);
      
      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are 'Mae', a kind and trustworthy clinical companion from MAEPLE (Mental And Emotional Pattern Literacy Engine), part of the Poziverse.
          
          Your Goal: Help users identify their patterns of 'Boom and Bust' cycles, sensory overload, and masking burnout.
          
          Tone: Calm, validation-first, curiosity-driven, positive but grounded, clinically sound.
          
          Key Concepts to Use:
          - "Spoons" (Energy Capacity): Ask "How are your spoons looking today?"
          - "Sensory Load": Ask "Was the environment loud or bright?"
          - "Masking": Validate the effort it takes to fit in.
          - "Strengths": Remind them of their hyperfocus, empathy, or creativity.
          
          Do not give generic medical advice. Focus on environmental adjustments and pacing strategies.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        },
        callbacks: {
          onopen: () => {
            // ...existing code...
            setStatus('connected');
            setStatusNote('Listening... speak naturally. Tap X to end.');
            setIsActive(true);
            
            // Start streaming input audio
            const source = inputCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = floatTo16BitPCM(inputData);
              
              // Encode to base64
              let binary = '';
              const bytes = new Uint8Array(pcm16.buffer);
              const len = bytes.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);

              sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64
                    }
                });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
               const ctx = audioContextRef.current;
               const audioBytes = base64ToUint8Array(audioData);
               
               // Decode PCM data manually since it's raw
               const dataInt16 = new Int16Array(audioBytes.buffer);
               const float32 = new Float32Array(dataInt16.length);
               for(let i=0; i<dataInt16.length; i++) {
                   float32[i] = dataInt16[i] / 32768.0;
               }
               
               const buffer = ctx.createBuffer(1, float32.length, 24000);
               buffer.getChannelData(0).set(float32);

               const source = ctx.createBufferSource();
               source.buffer = buffer;
               source.connect(ctx.destination);
               
               // Schedule playback
               const currentTime = ctx.currentTime;
               if (nextStartTimeRef.current < currentTime) {
                   nextStartTimeRef.current = currentTime;
               }
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += buffer.duration;
            }
          },
          onclose: () => {
            // ...existing code...
            cleanup();
          },
          onerror: (err) => {
            console.error("Session error", err);
            setStatus('error');
            setStatusNote('Could not connect to Mae Live. Check your key and try again.');
            cleanup();
          }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to start live session", e);
      setStatus('error');
      setStatusNote('Mic permission granted, but live session failed. Verify API key and network.');
      cleanup();
    }
  };

  const cleanup = () => {
    setIsActive(false);
    setStatus('idle');
    
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    // We can't explicitly close the session object easily in this SDK version from the promise, 
    // but stopping the stream handles the client side.
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl text-white shadow-2xl relative overflow-hidden h-96">
        {/* Background Animation */}
        <div className={`absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-40' : 'opacity-10'}`}>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-400 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        </div>

        <div className="relative z-10 text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Mae Live Coach</h2>
              <p className="text-indigo-200">Talk to Mae about your patterns and capacity.</p>
              <p className="text-xs text-indigo-100/80">Provider: Gemini Live. Allow mic; if no audio, check your Gemini key.</p>
            </div>

            <div className="relative inline-flex">
                 {status === 'connecting' && (
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin"></div>
                 )}
                 
                 <button 
                  onClick={isActive ? cleanup : startSession}
                  disabled={status === 'connecting' || !audioCapable}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-xl
                    ${isActive 
                      ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-500/30' 
                      : 'bg-teal-500 hover:bg-teal-600 ring-4 ring-teal-500/30'
                        }
                    `}
                 >
                    {isActive ? <X size={40} /> : <Mic size={40} />}
                 </button>
            </div>

            <div className="h-8 flex items-center justify-center gap-2">
                {isActive && (
                    <div className="flex items-center gap-1">
                        <Activity size={16} className="text-teal-400 animate-pulse" />
                        <span className="text-sm font-medium text-teal-100">Analyzing Patterns...</span>
                    </div>
                )}
                {status === 'error' && (
                    <span className="text-sm text-red-300">Connection Failed. Try again.</span>
                )}
              {statusNote && status !== 'connected' && (
                <span className="text-xs text-indigo-100 text-center block">{statusNote}</span>
              )}
            </div>
        </div>
    </div>
  );
};

export default LiveCoach;
