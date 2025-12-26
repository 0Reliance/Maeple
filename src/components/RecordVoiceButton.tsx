import { AlertCircle, Loader2, Mic, Square } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { AudioAnalysisResult } from '../services/audioAnalysisService';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    MediaRecorder?: typeof MediaRecorder;
  }
}

interface RecordVoiceButtonProps {
  /** Callback when a sentence is transcribed */
  onTranscript: (text: string, audioBlob?: Blob, analysis?: AudioAnalysisResult) => void;
  /** Callback when audio analysis is ready (for showing observations) */
  onAnalysisReady?: (analysis: AudioAnalysisResult) => void;
  /** Disable interaction (e.g. while processing) */
  isDisabled?: boolean;
}

/**
 * RecordVoiceButton
 * 
 * Enhanced component that:
 * 1. Captures audio using MediaRecorder API
 * 2. Transcribes using Web Speech API
 * 3. Analyzes audio for objective observations (noise, pace, tone)
 * 4. Returns transcript, audio blob, and analysis
 * 
 * Phase 2 Enhancement: Integrated audio analysis service
 */
const RecordVoiceButton: React.FC<RecordVoiceButtonProps> = ({
  onTranscript,
  onAnalysisReady,
  isDisabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const onTranscriptCallback = onTranscript;

  useEffect(() => {
    // Browser compatibility check
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const MediaRecorderClass = window.MediaRecorder;

    if (!SpeechRecognitionClass || !MediaRecorderClass) {
      setError("Not Supported");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false; // Capture one distinct thought/sentence at a time for better accuracy
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      // Ignore 'no-speech' errors as they just mean silence
      if (event.error !== 'no-speech') {
        console.error("Speech recognition error", event.error);
        setError("Mic Error");
      }
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscriptCallback(finalTranscript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      cleanupRecording();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }
    };
  }, [onTranscriptCallback, onAnalysisReady]);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("No Mic Access");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Recognition start failed", e);
        }
      }

      // Start MediaRecorder for audio capture
      const MediaRecorderClass = window.MediaRecorder;
      if (MediaRecorderClass) {
        const mediaRecorder = new MediaRecorderClass(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Create audio blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Analyze audio
          setIsAnalyzing(true);
          try {
            // Get transcript from recognition
            const transcript = ''; // Will be captured via onresult
            
            // Analyze audio
            const { analyzeAudio } = await import('../services/audioAnalysisService');
            const analysis = await analyzeAudio(audioBlob, transcript);
            
            // Notify parent of analysis
            if (onAnalysisReady) {
              onAnalysisReady(analysis);
            }
            
            // Notify parent of complete result
            onTranscriptCallback(transcript, audioBlob, analysis);
          } catch (e) {
            console.error("Audio analysis failed", e);
            // Still return transcript even if analysis fails
            onTranscriptCallback('', audioBlob);
          } finally {
            setIsAnalyzing(false);
          }
        };

        mediaRecorder.start();
      }
    } catch (e) {
      console.error("Microphone access error", e);
      setError("Mic Access Denied");
    }
  };

  const stopRecording = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const cleanupRecording = () => {
    stopRecording();
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    mediaStreamRef.current = null;
  };

  const toggleRecording = async () => {
    if (isDisabled || isAnalyzing) return;

    try {
      setError(null);

      if (isListening) {
        stopRecording();
      } else {
        await startRecording();
      }
    } catch (e) {
      console.warn("Recording toggle failed", e);
    }
  };

  if (error === "Not Supported") {
    return null; // Hide button if API not available
  }

  return (
    <div className="relative inline-flex items-center justify-center group">
      {/* Visual Pulse Effect */}
      {isListening && (
        <>
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
          <span className="absolute inline-flex h-[140%] w-[140%] rounded-full border border-red-500 opacity-20 animate-pulse"></span>
        </>
      )}

      {/* Analyzing Indicator */}
      {isAnalyzing && (
        <div className="absolute -top-8 flex items-center gap-2 bg-slate-800 text-white text-xs px-3 py-1 rounded whitespace-nowrap animate-pulse">
          <Loader2 size={12} className="animate-spin" />
          Analyzing...
        </div>
      )}

      {/* Error Tooltip */}
      {error && !isAnalyzing && (
        <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {error}
        </div>
      )}

      <button
        onClick={toggleRecording}
        disabled={isDisabled || isAnalyzing}
        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isListening 
            ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 scale-110' 
            : isAnalyzing
            ? 'bg-indigo-500 text-white cursor-wait'
            : error 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:ring-indigo-500'
        } ${(isDisabled || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={isListening ? "Stop Recording" : "Start Voice Recording"}
        title={
          isAnalyzing 
            ? "Analyzing audio..." 
            : isListening 
              ? "Stop Recording" 
              : "Tap to Speak"
        }
      >
        {isAnalyzing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isListening ? (
          <Square size={16} fill="currentColor" />
        ) : error ? (
          <AlertCircle size={20} />
        ) : (
          <Mic size={22} />
        )}
      </button>
    </div>
  );
};

export default RecordVoiceButton;
