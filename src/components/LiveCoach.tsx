import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, AlertCircle, Sparkles } from "lucide-react";
import { useAIService } from "@/contexts/DependencyContext";
import { useAppStore } from "../stores";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { CircuitState } from "@/patterns/CircuitBreaker";
import { safeParseAIResponse } from "../utils/safeParse";

const VoiceIntake: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [circuitState, setCircuitState] = useState<CircuitState>(CircuitState.CLOSED);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const { addEntry } = useAppStore();
  const navigate = useNavigate();
  const aiService = useAIService();

  // Subscribe to circuit breaker state changes
  useEffect(() => {
    const unsubscribe = aiService.onStateChange(setCircuitState);
    return unsubscribe;
  }, [aiService]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Wait for the final data chunk
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        processAudio(blob);
        
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert Blob to Base64 using promise wrapper (avoids FileReader callback race)
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read audio blob"));
        reader.readAsDataURL(blob);
      });

      const base64Audio = base64data.split(',')[1]; // Remove data URL prefix

      const prompt = `
          You are Mae, a supportive AI companion. 
          Listen to this audio journal entry.
          1. Transcribe the key points.
          2. Analyze the user's mood, capacity, and needs.
          3. Extract structured data:
             - Mood Score (1-5)
             - Medications taken
             - Symptoms
             - Activity Types
             - Neuro-Metrics (Sensory Load, Masking, etc.)
          4. Return the result as a valid JSON object matching this schema:
          {
            "summary": "...",
            "moodScore": 1-5,
            "moodLabel": "...",
            "medications": [{"name": "...", "amount": "..."}],
            "symptoms": [{"name": "...", "severity": 1-10}],
            "neuroMetrics": {"sensoryLoad": 1-10, "contextSwitches": 0},
            "activityTypes": ["#Tag"],
            "strengths": ["..."],
            "strategies": [{"title": "...", "action": "...", "type": "REST"}]
          }
        `;

      // Use DI with Circuit Breaker protection
      const response = await aiService.analyzeAudio(
        base64Audio,
        blob.type || 'audio/webm',
        prompt
      );

      if (response && response.content) {
        const { data, error } = safeParseAIResponse(response.content, {
          context: 'LiveCoach',
          stripMarkdown: true,
        });
          
        let parsedData;
        if (error) {
          console.warn("Failed to parse JSON, using raw text", error);
          parsedData = { summary: response.content };
        } else {
          parsedData = data!;
        }

        // Save Entry
        await addEntry({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          rawText: parsedData.summary || "Audio Entry",
          mood: parsedData.moodScore || 3,
          moodLabel: parsedData.moodLabel || "Neutral",
          medications: parsedData.medications || [],
          symptoms: parsedData.symptoms || [],
          tags: ['voice-intake', ...(parsedData.activityTypes || [])],
          activityTypes: parsedData.activityTypes || [],
          strengths: parsedData.strengths || [],
          neuroMetrics: {
            spoonLevel: 5, // Default
            capacity: {
              focus: 5, social: 5, structure: 5, emotional: 5, physical: 5, sensory: 5, executive: 5
            },
            ...parsedData.neuroMetrics
          },
          notes: "Transcribed from Voice Intake"
        });

        // Navigate to Journal
        navigate('/');
      } else {
        throw new Error("No response from AI");
      }
    } catch (err) {
      console.error("Processing failed:", err);
      
      // Handle circuit breaker errors
      if (err && typeof err === 'object' && 'message' in err && 
          (err as Error).message.includes('Circuit breaker is OPEN')) {
        setError('AI service temporarily unavailable. Please try again later.');
      } else {
        setError("Failed to process audio. Please try again.");
      }
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl text-white shadow-2xl relative overflow-hidden min-h-[24rem]">
      {/* Background Animation */}
      <div className={`absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-1000 ${isRecording ? "opacity-40" : "opacity-10"}`}>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-400 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      </div>

      <div className="relative z-10 text-center space-y-6 w-full max-w-md">
        <div className="flex flex-row items-center gap-3 md:flex-col md:space-y-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50/50 text-teal-400 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="md:hidden" />
            <Sparkles size={24} className="hidden md:block" />
          </div>
          <div className="flex-1 md:flex-none text-left md:text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Mae Live Companion
            </h2>
            <p className="text-sm md:text-base text-indigo-200 leading-relaxed">
              Real-time, voice-first reflection. Share your thoughts, feelings, or just ramble. Mae will listen and organize it for you.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 py-8">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-indigo-400/30 border-t-teal-400 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-teal-400 animate-pulse" size={32} />
                </div>
              </div>
              <p className="text-indigo-200 animate-pulse">Analyzing your patterns...</p>
            </div>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={circuitState === CircuitState.OPEN || isProcessing}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-xl ring-4 
                ${isRecording 
                  ? "bg-rose-500 hover:bg-rose-600 ring-rose-500/30 animate-pulse" 
                  : "bg-indigo-600 hover:bg-indigo-500 ring-indigo-500/30"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={40} />}
            </button>
          )}

          {isRecording && (
            <div className="text-3xl font-mono font-bold text-white tracking-wider">
              {formatTime(duration)}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/50 rounded-lg p-3 flex items-center gap-2 text-sm text-rose-200">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        {circuitState === CircuitState.OPEN && !error && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-200">
            <AlertCircle size={16} />
            AI service is temporarily unavailable. Please wait a moment.
          </div>
        )}

        <div className="text-xs text-indigo-300/60 max-w-xs mx-auto">
          Powered by Gemini Multimodal AI. Your audio is processed securely and not stored permanently.
        </div>
      </div>
    </div>
  );
};

export default VoiceIntake;