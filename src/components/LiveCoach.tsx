import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, X, Activity, Save } from "lucide-react";
import { aiRouter } from "../services/ai/router";
import { canUseAudio } from "../services/ai";
import { AILiveSession } from "../services/ai/types";
import TypingIndicator from "./TypingIndicator";
import { useAppStore } from "../stores";
import { v4 as uuidv4 } from "uuid";

const LiveCoach: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [statusNote, setStatusNote] = useState<string>(
    "Tap the mic, allow access, and start talking."
  );
  const audioCapable = canUseAudio();
  const { addEntry } = useAppStore();
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<Promise<AILiveSession> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<{role: string, text: string}[]>([]); // Ref to keep track for cleanup

  // Sync ref with state
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Helper to convert float32 audio to PCM16
  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
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

  const setupSpeechRecognition = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        if (text && text.trim()) {
          setTranscript(prev => [...prev, { role: 'user', text: text.trim() }]);
        }
      };
      
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const startSession = async () => {
    if (!audioCapable) {
      setStatus("error");
      setStatusNote(
        "Audio provider not configured. Add a Gemini key in Settings → AI Providers."
      );
      return;
    }

    setStatus("connecting");
    setStatusNote("Requesting microphone and starting Mae Live...");
    setTranscript([]);
    setIsSaving(false);

    try {
      // Setup Audio Contexts
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      await Promise.all([
        audioContextRef.current.resume?.(),
        inputCtx.resume?.(),
      ]);

      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start Speech Recognition for Transcript
      setupSpeechRecognition();

      // Connect via Router
      const sessionPromise = aiRouter.connectLive({
        systemInstruction: `You are 'Mae', a kind and trustworthy neuro-affirming support companion (your "Crispy Co-Pilot") from MAEPLE (Mental And Emotional Pattern Literacy Engine), part of the Poziverse.
          
          Your Goal: Help users identify their patterns of 'Boom and Bust' cycles, sensory overload, and masking burnout.
          
          Tone: Calm, validation-first, curiosity-driven, positive but grounded, research-backed.
          
          Key Concepts to Use:
          - "Bandwidth" (Capacity): Ask "How is your bandwidth looking today?"
          - "Load": Ask "Was the environment loud or bright?"
          - "Masking Noise": Validate the effort it takes to fit in.
          - "Strengths": Remind them of their hyperfocus, empathy, or creativity.
          
          IMPORTANT: You are a support tool, not a doctor. Do not give medical advice. Focus on environmental adjustments, pacing strategies, and self-advocacy.`,
        voice: "Kore",
        callbacks: {
          onOpen: () => {
            setStatus("connected");
            setStatusNote("Listening... speak naturally. Tap X to end.");
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
              let binary = "";
              const bytes = new Uint8Array(pcm16.buffer);
              const len = bytes.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);

              sessionPromise.then((session) => {
                session.sendAudio(base64);
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onAudioData: (audioBytes: Uint8Array) => {
            if (audioContextRef.current) {
              const ctx = audioContextRef.current;

              // Decode PCM data manually since it's raw
              const dataInt16 = new Int16Array(audioBytes.buffer);
              const float32 = new Float32Array(dataInt16.length);
              for (let i = 0; i < dataInt16.length; i++) {
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
          onTextData: (text) => {
            if (text && text.trim()) {
              setTranscript(prev => [...prev, { role: 'assistant', text: text.trim() }]);
            }
          },
          onClose: () => {
            cleanup();
          },
          onError: (err) => {
            console.error("Live session error:", err);
            setStatus("error");
            setStatusNote("Connection error. Please try again.");
            cleanup();
          },
        },
      });

      sessionRef.current = sessionPromise;
      await sessionPromise;
    } catch (error) {
      console.error("Failed to start live session:", error);
      setStatus("error");
      setStatusNote("Failed to connect. Check your internet or API key.");
    }
  };

  const cleanup = () => {
    setIsActive(false);
    setStatus("idle");
    setStatusNote("Ready to chat.");

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
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
  };

  const saveSession = async () => {
    if (transcript.length === 0) return;
    
    setIsSaving(true);
    try {
      const content = transcript
        .map(t => `${t.role === 'user' ? 'You' : 'Mae'}: ${t.text}`)
        .join('\n\n');

      const { addEntry } = useAppStore.getState();
      
      // Create a valid HealthEntry object
      addEntry({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        rawText: `🎙️ **Live Session Transcript**\n\n${content}`,
        mood: 5, // Neutral default
        moodLabel: "Neutral",
        medications: [],
        symptoms: [],
        tags: ['voice-session', 'mae-live'],
        activityTypes: [],
        strengths: [],
        neuroMetrics: {
          spoonLevel: 5,
          sensoryLoad: 0,
          contextSwitches: 0,
          capacity: {
            focus: 5,
            social: 5,
            structure: 5,
            emotional: 5,
            physical: 5,
            sensory: 5,
            executive: 5
          }
        },
        notes: "Auto-saved from Mae Live session"
      });

      setStatusNote("Session saved to journal!");
      setTimeout(() => setStatusNote("Ready to chat."), 3000);
      setTranscript([]);
    } catch (error) {
      console.error('Failed to save session:', error);
      setStatusNote("Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl text-white shadow-2xl relative overflow-hidden min-h-[24rem]">
      {/* Background Animation */}
      <div
        className={`absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-1000 ${
          isActive ? "opacity-40" : "opacity-10"
        }`}
      >
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-400 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      </div>

      <div className="relative z-10 text-center space-y-6 w-full max-w-md">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Mae Live Coach</h2>
          <p className="text-indigo-200">
            Talk to Mae about your patterns and capacity.
          </p>
          <p className="text-xs text-indigo-100/80">
            Provider: Gemini Live. Allow mic; if no audio, check your Gemini
            key.
          </p>
        </div>

        {/* Transcript Area */}
        {transcript.length > 0 && (
          <div className="bg-black/20 rounded-xl p-4 h-48 overflow-y-auto text-left space-y-2 text-sm scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-transparent">
            {transcript.map((t, i) => (
              <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  t.role === 'user' 
                    ? 'bg-indigo-600/80 text-white' 
                    : 'bg-teal-600/80 text-white'
                }`}>
                  <span className="text-xs opacity-70 block mb-0.5">{t.role === 'user' ? 'You' : 'Mae'}</span>
                  {t.text}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <div className="relative inline-flex">
            {status === "connecting" && (
              <div className="absolute inset-0 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin"></div>
            )}

            <button
              onClick={isActive ? cleanup : startSession}
              disabled={status === "connecting" || !audioCapable}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-xl
                      ${
                        isActive
                          ? "bg-red-500 hover:bg-red-600 ring-4 ring-red-500/30"
                          : "bg-teal-500 hover:bg-teal-600 ring-4 ring-teal-500/30"
                      }
                      `}
            >
              {isActive ? <X size={32} /> : <Mic size={32} />}
            </button>
          </div>

          {!isActive && transcript.length > 0 && (
            <button
              onClick={saveSession}
              disabled={isSaving}
              className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-all shadow-lg ring-2 ring-indigo-400/30"
              title="Save to Journal"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={24} />
              )}
            </button>
          )}
        </div>

        <div className="h-8 flex items-center justify-center gap-2">
          {status === "connecting" && (
            <TypingIndicator
              className="bg-transparent p-0"
              color="bg-indigo-300"
            />
          )}
          {isActive && (
            <div className="flex items-center gap-1">
              <Activity size={16} className="text-teal-400 animate-pulse" />
              <span className="text-sm font-medium text-teal-100">
                Listening & Analyzing...
              </span>
            </div>
          )}
          {status === "error" && (
            <span className="text-sm text-red-300">
              Connection Failed. Try again.
            </span>
          )}
          {statusNote && status !== "connected" && (
            <span className="text-xs text-indigo-100 text-center block">
              {statusNote}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveCoach;
