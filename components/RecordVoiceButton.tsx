import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, AlertCircle, Loader2 } from 'lucide-react';

interface RecordVoiceButtonProps {
  /** Callback when a sentence is transcribed */
  onTranscript: (text: string) => void;
  /** Disable interaction (e.g. while processing) */
  isDisabled?: boolean;
}

/**
 * RecordVoiceButton
 * 
 * A component that wraps the Web Speech API to provide one-tap voice dictation.
 * Features a visual pulsing animation when recording and handles browser compatibility.
 */
const RecordVoiceButton: React.FC<RecordVoiceButtonProps> = ({ onTranscript, isDisabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Browser compatibility check
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
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

      recognition.onerror = (event: any) => {
        // Ignore 'no-speech' errors as they just mean silence
        if (event.error !== 'no-speech') {
          console.error("Speech recognition error", event.error);
          setError("Mic Error");
        }
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError("Not Supported");
    }

    return () => {
      if (recognitionRef.current) {
        try {
            recognitionRef.current.abort();
        } catch (e) {
            // Ignore abort errors
        }
      }
    };
  }, [onTranscript]);

  const toggleRecording = () => {
    if (!recognitionRef.current || isDisabled) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setError(null);
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition start failed", e);
      }
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

      {/* Error Tooltip */}
      {error && (
        <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {error}
        </div>
      )}

      <button
        onClick={toggleRecording}
        disabled={isDisabled}
        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isListening 
            ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 scale-110' 
            : error 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:ring-indigo-500'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={isListening ? "Stop Recording" : "Start Voice Recording"}
        title={isListening ? "Stop Recording" : "Tap to Speak"}
      >
        {isListening ? (
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