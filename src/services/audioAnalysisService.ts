import { Observation } from '../types';

/**
 * Audio Analysis Service
 * 
 * Analyzes audio characteristics for objective observations.
 * Reports ONLY objective data - NO subjective emotion labels.
 * 
 * Detects:
 * - Background noise levels
 * - Speech pace (words per minute)
 * - Vocal characteristics (pitch variation, pauses)
 * - Environmental sounds
 * 
 * Does NOT:
 * - Label emotions ("sounds sad", "sounds stressed")
 * - Make assumptions about internal state
 * - Judge user's experience
 */

export interface AudioAnalysisResult {
  observations: Observation[];
  transcript: string;
  confidence: number;
  duration: number; // seconds
}

export interface NoiseAnalysis {
  level: 'low' | 'moderate' | 'high';
  sources: string[]; // ["sirens", "traffic", "typing"]
  dbLevel?: number; // approximate decibel level
}

export interface SpeechAnalysis {
  pace: 'slow' | 'moderate' | 'fast';
  wordsPerMinute: number;
  pauses: 'frequent' | 'normal' | 'rare';
  duration: number; // seconds
}

export interface VocalCharacteristics {
  pitchVariation: 'flat' | 'normal' | 'varied';
  volume: 'low' | 'normal' | 'high';
  clarity: 'mumbled' | 'normal' | 'clear';
}

/**
 * Analyze audio file for objective characteristics
 */
export const analyzeAudio = async (
  audioBlob: Blob,
  transcript?: string
): Promise<AudioAnalysisResult> => {
  // Get audio duration
  const duration = await getAudioDuration(audioBlob);

  // Analyze noise levels
  const noiseAnalysis = await analyzeNoise(audioBlob);

  // If transcript provided, analyze speech patterns
  let speechAnalysis: SpeechAnalysis | null = null;
  let vocalCharacteristics: VocalCharacteristics | null = null;
  
  if (transcript) {
    speechAnalysis = analyzeSpeechPace(transcript, duration);
    vocalCharacteristics = await analyzeVocalCharacteristics(audioBlob);
  }

  // Build observations from analysis
  const observations: Observation[] = [];

  // Noise observation
  observations.push({
    category: 'noise',
    value: noiseAnalysis.level === 'high' 
      ? `${noiseAnalysis.level} background noise (${noiseAnalysis.sources.join(', ')})`
      : `${noiseAnalysis.level} background noise`,
    severity: noiseAnalysis.level === 'high' ? 'high' : noiseAnalysis.level,
    evidence: noiseAnalysis.sources.length > 0
      ? `detected: ${noiseAnalysis.sources.join(', ')}`
      : 'measured in audio',
  });

  // Speech pace observation
  if (speechAnalysis) {
    observations.push({
      category: 'speech-pace',
      value: `${speechAnalysis.pace} pace (${speechAnalysis.wordsPerMinute} words/minute)`,
      severity: speechAnalysis.pace === 'fast' || speechAnalysis.pace === 'slow' ? 'moderate' : 'low',
      evidence: `measured at ${speechAnalysis.wordsPerMinute} words/minute`,
    });
  }

  // Tone observation (vocal characteristics)
  if (vocalCharacteristics) {
    const toneDescription = getToneDescription(vocalCharacteristics);
    observations.push({
      category: 'tone',
      value: toneDescription,
      severity: vocalCharacteristics.pitchVariation === 'flat' ? 'moderate' : 'low',
      evidence: 'detected in voice characteristics',
    });
  }

  // Calculate overall confidence
  const confidence = calculateConfidence(observations, duration);

  return {
    observations,
    transcript: transcript || '',
    confidence,
    duration,
  };
};

/**
 * Get audio duration from blob
 */
const getAudioDuration = (blob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = reject;
    audio.src = URL.createObjectURL(blob);
  });
};

/**
 * Analyze noise levels in audio
 * 
 * This is a simplified implementation. In production, you would use:
 * - Web Audio API with AudioContext for spectral analysis
 * - Machine learning models for noise classification
 * - Third-party services like AWS Transcribe, Google Speech-to-Text
 */
const analyzeNoise = async (audioBlob: Blob): Promise<NoiseAnalysis> => {
  let audioContext: AudioContext | null = null;
  
  try {
    // For now, we'll use a basic Web Audio API approach
    audioContext = new AudioContext({ sampleRate: 48000 });
    const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
    
    // Get channel data
    const channelData = audioBuffer.getChannelData(0);
    
    // Calculate RMS (root mean square) for volume
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / channelData.length);
    
    // Convert to approximate dB
    const dbLevel = 20 * Math.log10(rms);
    
    // Determine noise level
    let level: 'low' | 'moderate' | 'high';
    let sources: string[] = [];
    
    if (dbLevel < -40) {
      level = 'low';
    } else if (dbLevel < -25) {
      level = 'moderate';
    } else {
      level = 'high';
      sources = ['elevated background levels'];
    }
    
    // In production, you'd use ML to detect specific noise sources
    // For now, we'll return generic results
    
    return { level, sources, dbLevel };
  } finally {
    // Always close the AudioContext to prevent memory leaks
    if (audioContext) {
      await audioContext.close();
    }
  }
};

/**
 * Analyze speech pace from transcript
 */
const analyzeSpeechPace = (
  transcript: string,
  duration: number
): SpeechAnalysis => {
  // Count words
  const words = transcript.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Calculate words per minute
  const wordsPerMinute = Math.round((wordCount / duration) * 60);
  
  // Determine pace
  let pace: 'slow' | 'moderate' | 'fast';
  if (wordsPerMinute < 120) {
    pace = 'slow';
  } else if (wordsPerMinute > 160) {
    pace = 'fast';
  } else {
    pace = 'moderate';
  }
  
  // Estimate pauses (based on punctuation)
  const pauseCount = (transcript.match(/[.,!?]/g) || []).length;
  const pauseRatio = pauseCount / Math.max(wordCount, 1);
  
  let pauses: 'frequent' | 'normal' | 'rare';
  if (pauseRatio > 0.15) {
    pauses = 'frequent';
  } else if (pauseRatio < 0.05) {
    pauses = 'rare';
  } else {
    pauses = 'normal';
  }
  
  return { pace, wordsPerMinute, pauses, duration };
};

/**
 * Analyze vocal characteristics
 * 
 * REAL IMPLEMENTATION: Analyzes pitch, volume, and clarity from audio
 */
export const analyzeVocalCharacteristics = async (
  audioBlob: Blob
): Promise<VocalCharacteristics> => {
  let audioContext: AudioContext | null = null;
  
  try {
    // Create audio context
    audioContext = new AudioContext({ sampleRate: 48000 });
    const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
    const channelData = audioBuffer.getChannelData(0);
    
    // 1. Pitch Analysis (Autocorrelation method)
    const pitchData = analyzePitch(channelData, audioContext.sampleRate);
    const pitchVariation = classifyPitchVariation(pitchData);
    
    // 2. Volume Analysis (RMS with sliding window)
    const volumeData = analyzeVolume(channelData);
    const volume = classifyVolume(volumeData);
    
    // 3. Clarity Analysis (Signal-to-Noise Ratio)
    const snrData = analyzeSNR(channelData, volumeData);
    const clarity = classifyClarity(snrData);
    
    return { pitchVariation, volume, clarity };
  } finally {
    // Always close AudioContext to prevent memory leaks
    if (audioContext) {
      await audioContext.close();
    }
  }
};

/**
 * Get tone description from vocal characteristics
 * 
 * This is OBJECTIVE - it describes vocal features, not emotions
 */
const getToneDescription = (characteristics: VocalCharacteristics): string => {
  const parts: string[] = [];
  
  if (characteristics.pitchVariation === 'flat') {
    parts.push('relatively flat pitch');
  } else if (characteristics.pitchVariation === 'varied') {
    parts.push('varied pitch');
  }
  
  if (characteristics.volume === 'low') {
    parts.push('softer volume');
  } else if (characteristics.volume === 'high') {
    parts.push('louder volume');
  }
  
  if (characteristics.clarity === 'mumbled') {
    parts.push('some mumbled sections');
  } else if (characteristics.clarity === 'clear') {
    parts.push('clear enunciation');
  }
  
  return parts.length > 0 ? parts.join(', ') : 'natural vocal characteristics';
};

/**
 * Calculate confidence score for observations
 */
const calculateConfidence = (
  observations: Observation[],
  duration: number
): number => {
  let confidence = 0.5; // Base confidence
  
  // More observations = higher confidence
  confidence += observations.length * 0.1;
  
  // Longer recordings = higher confidence
  if (duration >= 3) {
    confidence += 0.2;
  }
  
  // Cap at 1.0
  return Math.min(confidence, 1.0);
};

/**
 * Analyze pitch using autocorrelation method
 * 
 * This detects the fundamental frequency of the voice
 */
function analyzePitch(samples: Float32Array, sampleRate: number): {
  pitches: number[];
  variation: number;
} {
  const pitches: number[] = [];
  const frameSize = 2048;
  const hopSize = 1024;
  
  // Process audio in overlapping frames
  for (let i = 0; i < samples.length - frameSize; i += hopSize) {
    const frame = samples.slice(i, i + frameSize);
    const pitch = autocorrelationPitch(frame, sampleRate);
    if (pitch > 0) {
      pitches.push(pitch);
    }
  }
  
  // Calculate pitch variation (standard deviation)
  const meanPitch = pitches.length > 0 
    ? pitches.reduce((a, b) => a + b, 0) / pitches.length 
    : 0;
  const variance = pitches.length > 0
    ? pitches.reduce((sum, p) => sum + Math.pow(p - meanPitch, 2), 0) / pitches.length
    : 0;
  
  return { pitches, variation: Math.sqrt(variance) };
}

/**
 * Detect fundamental frequency using autocorrelation
 * 
 * This is a classic pitch detection algorithm
 */
function autocorrelationPitch(samples: Float32Array, sampleRate: number): number {
  const size = samples.length;
  const correlations = new Float32Array(size);
  
  // Calculate autocorrelation
  for (let lag = 0; lag < size; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) {
      sum += samples[i] * samples[i + lag];
    }
    correlations[lag] = sum / (size - lag);
  }
  
  // Find first peak after initial decay
  let peakLag = 0;
  let peakValue = 0;
  const minLag = Math.floor(sampleRate / 500); // Min 500 Hz (typical voice max)
  const maxLag = Math.floor(sampleRate / 50);  // Max 50 Hz (typical voice min)
  
  for (let lag = minLag; lag < Math.min(maxLag, size); lag++) {
    if (correlations[lag] > peakValue) {
      peakValue = correlations[lag];
      peakLag = lag;
    }
  }
  
  // Return frequency or 0 if not found
  return peakLag > 0 ? sampleRate / peakLag : 0;
}

/**
 * Classify pitch variation
 * 
 * Flat voice < 5 variation
 * Normal voice 5-30 variation
 * Varied voice > 30 variation
 */
function classifyPitchVariation(data: { variation: number }): 'flat' | 'normal' | 'varied' {
  if (data.variation < 5) return 'flat';
  if (data.variation > 30) return 'varied';
  return 'normal';
}

/**
 * Analyze volume levels
 * 
 * Calculates RMS (Root Mean Square) and peak volume
 */
function analyzeVolume(samples: Float32Array): { rms: number; peak: number } {
  let sum = 0;
  let peak = 0;
  
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    sum += samples[i] * samples[i];
    if (abs > peak) peak = abs;
  }
  
  const rms = Math.sqrt(sum / samples.length);
  return { rms, peak };
}

/**
 * Classify volume level
 * 
 * Low volume < -30dB
 * Normal volume -30dB to -10dB
 * High volume > -10dB
 */
function classifyVolume(data: { rms: number }): 'low' | 'normal' | 'high' {
  const db = 20 * Math.log10(data.rms);
  if (db < -30) return 'low';
  if (db > -10) return 'high';
  return 'normal';
}

/**
 * Analyze Signal-to-Noise Ratio (SNR)
 * 
 * Higher SNR = clearer speech
 * Lower SNR = more background noise/mumbling
 */
function analyzeSNR(samples: Float32Array, volumeData: { rms: number }): { snr: number } {
  // Signal power
  const signalPower = volumeData.rms * volumeData.rms;
  
  // Estimate noise power from silence gaps (quietest 10% of audio)
  const threshold = volumeData.rms * 0.1;
  let noiseSum = 0;
  let noiseCount = 0;
  
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) < threshold) {
      noiseSum += samples[i] * samples[i];
      noiseCount++;
    }
  }
  
  // Avoid division by zero
  const noisePower = noiseCount > 0 ? noiseSum / noiseCount : signalPower * 0.01;
  const snr = signalPower / noisePower;
  
  // Convert to dB
  return { snr: 10 * Math.log10(snr) };
}

/**
 * Classify speech clarity based on SNR
 * 
 * Mumbled < 5dB SNR
 * Normal 5-20dB SNR
 * Clear > 20dB SNR
 */
function classifyClarity(data: { snr: number }): 'mumbled' | 'normal' | 'clear' {
  if (data.snr < 5) return 'mumbled';
  if (data.snr > 20) return 'clear';
  return 'normal';
}

/**
 * Generate gentle inquiry based on audio analysis
 * 
 * This creates a contextual question based on objective observations
 */
export const generateInquiryFromAudio = (
  analysis: AudioAnalysisResult
): string | null => {
  const highSeverityObs = analysis.observations.filter(obs => obs.severity === 'high');
  
  if (highSeverityObs.length === 0) {
    return null; // No inquiry needed
  }
  
  // Check for high noise
  const noiseObs = highSeverityObs.find(obs => obs.category === 'noise');
  if (noiseObs) {
    return "I noticed there was a lot of background noise in your recording. How is that environment affecting your focus right now?";
  }
  
  // Check for fast speech
  const paceObs = highSeverityObs.find(obs => obs.category === 'speech-pace');
  if (paceObs) {
    return "I noticed you were speaking at a faster pace. Are you feeling rushed or pressed for time?";
  }
  
  // Default inquiry
  return "I noticed some things in your audio that might be affecting you. Mind sharing more about how you're feeling?";
};