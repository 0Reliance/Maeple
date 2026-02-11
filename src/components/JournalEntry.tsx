import { useAIService } from "@/contexts/DependencyContext";
import { CircuitState } from "@/patterns/CircuitBreaker";
import {
  AlertCircle,
  Brain,
  ChevronDown,
  ChevronUp,
  Compass,
  Heart,
  Send,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { faceAnalysisToObservation, useObservations } from "../contexts/ObservationContext";
import { AudioAnalysisResult } from "../services/audioAnalysisService";
import { useCorrelationAnalysis } from "../services/correlationService";
import { useDraft } from "../services/draftService";
import {
  CapacityProfile,
  FacialAnalysis,
  GentleInquiry as GentleInquiryType,
  HealthEntry,
  ObjectiveObservation,
  ParsedResponse,
  StrategyRecommendation,
} from "../types";
import { isValidGentleInquiry, validateFacialAnalysis } from "../utils/dataValidation";
import { normalizeObjectiveObservations } from "../utils/observationNormalizer";
import { safeParseAIResponse } from "../utils/safeParse";
import AILoadingState from "./AILoadingState";
import CapacitySlider from "./CapacitySlider";
import GentleInquiry from "./GentleInquiry";
import RecordVoiceButton from "./RecordVoiceButton";
import VoiceObservations from "./VoiceObservations";
import { Button } from "./ui/Button";
import { Card, CardDescription } from "./ui/Card";
import { Textarea } from "./ui/Input";

interface Props {
  onEntryAdded: (entry: HealthEntry) => Promise<void>;
}

const JournalEntry: React.FC<Props> = ({ onEntryAdded }) => {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [circuitState, setCircuitState] = useState<CircuitState>(CircuitState.CLOSED);
  const aiService = useAIService();

  // Draft Service for auto-save
  const { draft, markDirty, save: saveDraft } = useDraft();
  const draftLoadedRef = useRef(false);

  // Correlation Service for pattern analysis
  const { analyze: analyzeCorrelation } = useCorrelationAnalysis();

  // Observation Context for unified data flow
  const { observations, add: addObservation, correlate: correlateObservation } = useObservations();

  // Subscribe to circuit breaker state changes
  useEffect(() => {
    const unsubscribe = aiService.onStateChange(setCircuitState);
    return unsubscribe;
  }, [aiService]);

  // Voice Observations State
  const [voiceObservations, setVoiceObservations] = useState<AudioAnalysisResult | null>(null);

  // Photo/Bio-Mirror Observations State
  const [photoObservations, setPhotoObservations] = useState<FacialAnalysis | null>(null);

  // Gentle Inquiry State
  const [gentleInquiry, setGentleInquiry] = useState<GentleInquiryType | null>(null);
  const [inquiryResponse, setInquiryResponse] = useState<string>("");
  const [showInquiry, setShowInquiry] = useState(false);

  const handlePhotoAnalysis = (analysis: unknown) => {
    const validated = validateFacialAnalysis(analysis);
    setPhotoObservations(validated);
    // Add to ObservationContext for correlation
    if (validated) {
      addObservation(faceAnalysisToObservation(validated));
    }
  };

  // Phase 1: Energy Capacity
  const [showCapacity, setShowCapacity] = useState(true);
  const [capacity, setCapacity] = useState<CapacityProfile>({
    focus: 7,
    social: 5,
    structure: 4,
    emotional: 6,
    physical: 5,
    sensory: 6,
    executive: 5,
  });
  const [suggestedCapacity, setSuggestedCapacity] = useState<Partial<CapacityProfile>>({});

  const updateCapacity = (key: keyof CapacityProfile, val: number) => {
    setCapacity(prev => ({ ...prev, [key]: val }));
  };

  const calculateAverageEnergy = () => {
    const values = Object.values(capacity) as number[];
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  // Load draft on mount (once) - must be after capacity state is defined
  useEffect(() => {
    if (draft?.data && !draftLoadedRef.current) {
      draftLoadedRef.current = true;
      const draftData = draft.data as Partial<HealthEntry>;
      if (draftData.notes) {
        setText(draftData.notes);
      }
      if (draftData.neuroMetrics?.capacity) {
        setCapacity(draftData.neuroMetrics.capacity);
      }
    }
  }, [draft]);

  // Auto-save draft when content changes (debounced via markDirty)
  useEffect(() => {
    if (text.length > 0) {
      markDirty({
        notes: text,
        neuroMetrics: {
          spoonLevel: calculateAverageEnergy(),
          sensoryLoad: 0,
          contextSwitches: 0,
          capacity,
        },
      });
    }
  }, [text, capacity, markDirty]);

  // Recalculate suggestions when observations change
  React.useEffect(() => {
    if (voiceObservations || photoObservations) {
      const suggestions = getSuggestedCapacity();
      setSuggestedCapacity(suggestions);

      // Update capacity with suggestions if not already set
      if (Object.keys(suggestions).length > 0) {
        setCapacity(
          prev =>
            ({
              ...prev,
              ...suggestions,
            }) as CapacityProfile
        );
      }
    } else {
      setSuggestedCapacity({});
    }
  }, [voiceObservations, photoObservations]);

  // Phase 3: Immediate Strategy Feedback
  const [lastStrategies, setLastStrategies] = useState<StrategyRecommendation[]>([]);
  const [lastReasoning, setLastReasoning] = useState<string | null>(null);

  const handleTranscript = (
    transcript: string,
    audioBlob?: Blob,
    analysis?: AudioAnalysisResult
  ) => {
    setText(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${transcript}` : transcript;
    });

    // Store voice observations if available
    if (analysis) {
      setVoiceObservations(analysis);
    }
  };

  const getSuggestedCapacity = (
    extraObservations?: any[]
  ): Partial<CapacityProfile> => {
    const suggestions: Partial<CapacityProfile> = {};

    // 1. Unified observation processing
    const allObservations = [
      ...(voiceObservations?.observations || []),
      ...(photoObservations?.observations || []),
      ...(extraObservations || []),
    ];

    if (allObservations.length > 0) {
      const highNoise = allObservations.some(
        (obs: any) => obs.category === "noise" && obs.severity === "high"
      );
      if (highNoise) {
        suggestions.sensory = 3;
        suggestions.focus = 4;
      }

      const moderateNoise = allObservations.some(
        (obs: any) => obs.category === "noise" && obs.severity === "moderate"
      );
      if (moderateNoise) {
        suggestions.sensory = Math.min(suggestions.sensory || 10, 5);
      }

      const fastPace = allObservations.some(
        (obs: any) => obs.category === "speech-pace" && obs.value?.includes("fast")
      );
      if (fastPace) {
        suggestions.executive = 4;
        suggestions.social = 4;
      }

      const highTension = allObservations.some(
        (obs: any) =>
          (obs.category === "tone" || obs.category === "tension") &&
          (obs.severity === "high" || obs.value?.includes("high"))
      );
      if (highTension) {
        suggestions.emotional = 4;
        suggestions.executive = Math.min(suggestions.executive || 10, 4);
      }

      const fatigueIndicators = allObservations.some(
        (obs: any) => obs.category === "fatigue" && obs.severity !== "low"
      );
      if (fatigueIndicators) {
        suggestions.physical = 4;
        suggestions.focus = Math.min(suggestions.focus || 10, 4);
      }

      const highLighting = allObservations.some(
        (obs: any) => obs.category === "lighting" && obs.severity === "high"
      );
      if (highLighting) {
        suggestions.sensory = Math.min(suggestions.sensory || 10, 3);
        suggestions.emotional = Math.min(suggestions.emotional || 10, 4);
      }
    }

    return suggestions;
  };

  const getInformedByContext = (field: keyof CapacityProfile): string | null => {
    const reasons: string[] = [];

    // Voice analysis reasons
    if (voiceObservations?.observations) {
      if (field === "sensory") {
        const noiseObs = voiceObservations.observations.find(
          (obs: any) => obs.category === "noise"
        );
        if (noiseObs?.severity === "high") reasons.push("high noise level detected");
        else if (noiseObs?.severity === "moderate") reasons.push("moderate noise detected");
      }
      if (field === "executive") {
        const paceObs = voiceObservations.observations.find(
          (obs: any) => obs.category === "speech-pace"
        );
        if (paceObs) reasons.push("speech pace analysis");
      }
      if (field === "emotional") {
        const toneObs = voiceObservations.observations.find((obs: any) => obs.category === "tone");
        if (toneObs?.severity === "high") reasons.push("tension detected in voice tone");
      }
    }

    // Photo analysis reasons
    if (photoObservations?.observations) {
      if (field === "sensory") {
        reasons.push("lighting conditions observed");
      }
      if (field === "emotional") {
        const tensionObs = photoObservations.observations.find(
          (obs: any) => obs.category === "tension"
        );
        if (tensionObs) reasons.push("facial tension detected");
      }
      if (field === "physical") {
        const fatigueObs = photoObservations.observations.find(
          (obs: any) => obs.category === "fatigue"
        );
        if (fatigueObs) reasons.push("fatigue indicators detected");
      }
    }

    return reasons.length > 0 ? `Informed by: ${reasons.join(", ")}` : null;
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setLastStrategies([]);
    setLastReasoning(null);
    setError("");

    try {
      // Use DI with Circuit Breaker protection
      const prompt = `
        Analyze this journal entry and extract structured data.
        
        Current energy levels: ${JSON.stringify(capacity)}
        
        Text: ${text}
        
        Return a JSON object matching this schema:
        {
          "moodScore": 1-10,
          "moodLabel": "...",
          "medications": [{"name": "...", "amount": "...", "unit": "..."}],
          "symptoms": [{"name": "...", "severity": 1-10}],
          "activityTypes": ["#Tag"],
          "strengths": ["..."],
          "strategies": [{"title": "...", "action": "...", "type": "REST"}],
          "summary": "...",
          "analysisReasoning": "...",
          "objectiveObservations": [
            {
              "category": "lighting",  // ONE category from: lighting, noise, tension, fatigue, speech-pace, tone
              "value": "detailed description of what was observed",
              "severity": "low",  // or "moderate" or "high"
              "evidence": "specific evidence from the text supporting this observation"
            }
          ],
          "gentleInquiry": "... or null"
        }
        
        IMPORTANT: objectiveObservations should be an array of objects. Each object must have EXACTLY ONE category value (not an array). Each observation should describe ONE specific thing you detected.
      `;

      const response = await aiService.analyze(prompt);

      const { data, error } = safeParseAIResponse<ParsedResponse>(response.content, {
        context: 'JournalEntry',
        stripMarkdown: true,
      });
      
      let parsed: ParsedResponse;
      if (error) {
        console.warn("Failed to parse AI response, using fallback", error);
        parsed = {
          moodScore: 5,
          moodLabel: "Neutral",
          medications: [],
          symptoms: [],
          activityTypes: [],
          strengths: [],
          strategies: [],
          summary: "Entry analyzed",
          analysisReasoning: "",
          objectiveObservations: [],
          neuroMetrics: {
            environmentalMentions: [],
            socialMentions: [],
            executiveMentions: [],
            physicalMentions: [],
          },
        } as ParsedResponse;
      } else {
        const parsedCandidate = data ?? ({} as ParsedResponse);
        // Normalize objectiveObservations to handle messy AI output
        const normalizedObservations = normalizeObjectiveObservations(
          parsedCandidate.objectiveObservations
        );
        // Construct the parsed response with normalized observations
        parsed = {
          ...parsedCandidate,
          objectiveObservations: normalizedObservations,
          // Ensure other fields have defaults
          moodScore: parsedCandidate.moodScore ?? 5,
          moodLabel: parsedCandidate.moodLabel ?? "Neutral",
          medications: parsedCandidate.medications ?? [],
          symptoms: parsedCandidate.symptoms ?? [],
          activityTypes: parsedCandidate.activityTypes ?? [],
          strengths: parsedCandidate.strengths ?? [],
          strategies: Array.isArray(parsedCandidate.strategies) ? parsedCandidate.strategies : [],
          summary: parsedCandidate.summary ?? "Entry analyzed",
          analysisReasoning: parsedCandidate.analysisReasoning ?? "",
        } as ParsedResponse;
      }
      
      // Log strategies for debugging
      console.log('[JournalEntry] Setting lastStrategies:', {
        isArray: Array.isArray(parsed.strategies),
        length: parsed.strategies?.length,
        value: parsed.strategies
      });

      // Build objective observations array
      const objectiveObservations: ObjectiveObservation[] = [];

      // 1. Add voice observations if available
      if (voiceObservations) {
        objectiveObservations.push({
          type: "audio",
          source: "voice",
          observations: voiceObservations.observations,
          confidence: voiceObservations.confidence,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Add photo observations if available
      if (photoObservations) {
        const convertedObservation = faceAnalysisToObservation(photoObservations);
        objectiveObservations.push(convertedObservation);
      }

      // 3. Add text observations if AI extracted them
      if (parsed.objectiveObservations && parsed.objectiveObservations.length > 0) {
        objectiveObservations.push({
          type: "text",
          source: "text-input",
          observations: parsed.objectiveObservations,
          confidence: 0.8,
          timestamp: new Date().toISOString(),
        });
      }

      // 4. Update capacity based on AI detected observations
      const aiSuggestions = getSuggestedCapacity(parsed.objectiveObservations);
      const updatedCapacity: CapacityProfile = { ...capacity };
      
      // Apply suggestions only for valid keys
      (Object.keys(aiSuggestions) as Array<keyof CapacityProfile>).forEach(key => {
        const value = aiSuggestions[key];
        if (value !== undefined) {
          updatedCapacity[key] = value;
        }
      });

      // Update local state so UI reflects the suggestions
      if (Object.keys(aiSuggestions).length > 0) {
        setCapacity(updatedCapacity);
      }

      const newEntry: HealthEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        rawText: text,
        mood: parsed.moodScore,
        moodLabel: parsed.moodLabel,
        medications: (parsed.medications || []).map(m => ({
          name: m.name,
          dosage: m.amount || '',
          unit: m.unit || '',
        })),
        symptoms: (parsed.symptoms || []).map(s => ({
          name: s.name,
          severity: s.severity || 5,
        })),
        tags: [],
        activityTypes: parsed.activityTypes || [],
        strengths: parsed.strengths || [],
        neuroMetrics: {
          spoonLevel: Math.round(
            (Object.values(updatedCapacity) as number[]).reduce((a, b) => a + b, 0) /
              Object.values(updatedCapacity).length
          ),
          sensoryLoad: 0,
          contextSwitches: 0,
          capacity: updatedCapacity,
        },
        notes: parsed.summary,
        aiStrategies: parsed.strategies,
        aiReasoning: parsed.analysisReasoning,
        objectiveObservations: objectiveObservations.length > 0 ? objectiveObservations : undefined,
      };

      // Run correlation analysis on entry save
      const correlation = analyzeCorrelation(newEntry, observations);
      if (correlation.insights.length > 0) {
        // Attach correlation insights to entry
        (newEntry as any).correlationInsights = correlation.insights;
        (newEntry as any).correlationScore = correlation.score;
        (newEntry as any).maskingDetected = correlation.masking.detected;
      }

      // Handle gentle inquiry - display if valid (has observations), otherwise save entry
      const hasValidInquiry = isValidGentleInquiry(parsed.gentleInquiry);

      // Log for debugging
      if (parsed.gentleInquiry) {
        console.log('[JournalEntry] gentleInquiry received:', {
          hasInquiry: !!parsed.gentleInquiry,
          basedOnLength: parsed.gentleInquiry.basedOn?.length || 0,
          basedOnContent: parsed.gentleInquiry.basedOn,
          willShow: hasValidInquiry,
          question: parsed.gentleInquiry.question,
          isValid: hasValidInquiry
        });
      }

      if (hasValidInquiry) {
        setGentleInquiry(parsed.gentleInquiry || null);
        setShowInquiry(true);
        setPendingEntry(newEntry);
      } else {
        try {
          await onEntryAdded(newEntry);
          // Clear draft only after confirmed save success
          saveDraft({ notes: "" });
          resetForm();
        } catch (saveError) {
          console.error('[JournalEntry] Failed to save entry:', saveError);
          setError('Failed to save your entry. Your data is still in the form — please try again.');
          return;
        }
      }

      // Ensure strategies is always an array before setting state
      const strategiesToSet = Array.isArray(parsed.strategies) ? parsed.strategies : [];
      console.log('[JournalEntry] Setting state strategies:', {
        isArray: Array.isArray(strategiesToSet),
        length: strategiesToSet.length
      });
      setLastStrategies(strategiesToSet);
      setLastReasoning(parsed.analysisReasoning || null);
    } catch (e) {
      console.error("Failed to process entry", e);

      if (
        e &&
        typeof e === "object" &&
        "message" in e &&
        (e as Error).message.includes("Circuit breaker is OPEN")
      ) {
        setError("AI service temporarily unavailable. Please try again later.");
      } else {
        setError("Failed to analyze entry. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInquirySubmit = async () => {
    if (!inquiryResponse.trim() || !pendingEntry) {
      setShowInquiry(false);
      if (pendingEntry) {
        try {
          await onEntryAdded(pendingEntry);
          // Clear draft only after confirmed save success
          saveDraft({ notes: "" });
        } catch (saveError) {
          console.error('[JournalEntry] Failed to save entry after inquiry skip:', saveError);
          setError('Failed to save your entry. Please try again.');
          return;
        }
      }
      resetForm();
      return;
    }

    const entryWithInquiry: HealthEntry = {
      ...pendingEntry,
      notes: inquiryResponse.trim()
        ? `${pendingEntry.notes}\n\nInquiry Response: ${inquiryResponse}`
        : pendingEntry.notes,
    };

    try {
      await onEntryAdded(entryWithInquiry);
      // Clear draft only after confirmed save success
      saveDraft({ notes: "" });
      resetForm();
    } catch (saveError) {
      console.error('[JournalEntry] Failed to save entry with inquiry:', saveError);
      setError('Failed to save your entry. Please try again.');
      return;
    }
  };

  const handleInquirySkip = async () => {
    setShowInquiry(false);
    if (pendingEntry) {
      try {
        await onEntryAdded(pendingEntry);
        // Clear draft only after confirmed save success
        saveDraft({ notes: "" });
      } catch (saveError) {
        console.error('[JournalEntry] Failed to save entry on inquiry skip:', saveError);
        setError('Failed to save your entry. Please try again.');
        return;
      }
    }
    resetForm();
  };

  const resetForm = () => {
    setText("");
    setCapacity({
      focus: 7,
      social: 5,
      structure: 4,
      emotional: 6,
      physical: 5,
      sensory: 6,
      executive: 5,
    });
    setVoiceObservations(null);
    setPhotoObservations(null);
    setGentleInquiry(null);
    setInquiryResponse("");
    setShowInquiry(false);
    setPendingEntry(null);
  };

  const [pendingEntry, setPendingEntry] = useState<HealthEntry | null>(null);

  return (
    <div className="space-y-lg animate-fadeIn">
      {/* Gentle Inquiry Overlay */}
      {showInquiry && gentleInquiry && (
        <Card className="bg-primary/10 border-primary/20">
          <GentleInquiry
            inquiry={gentleInquiry}
            onResponse={response => {
              setInquiryResponse(response);
              handleInquirySubmit();
            }}
            onSkip={handleInquirySkip}
            disabled={isProcessing}
          />
        </Card>
      )}

      {/* Strategy Feedback */}
      {lastStrategies?.length > 0 && (
        <Card className="bg-gradient-to-r from-accent-positive to-primary text-white border-none shadow-lg shadow-accent-positive/20">
          <button
            onClick={() => setLastStrategies([])}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-4 pr-8">
            <Compass size={24} className="text-white/80" />
            <h3 className="text-h2 font-display font-semibold">Today's Insights</h3>
          </div>

          {lastReasoning && (
            <p className="text-white/90 text-small mb-4 italic border-l-2 border-white/50 pl-3">
              Pattern detected: {lastReasoning}
            </p>
          )}

          <div className="grid md:grid-cols-3 gap-lg">
            {lastStrategies?.map(strat => (
              <div
                key={strat.id}
                className="bg-white/10 border border-white/20 p-lg rounded-xl backdrop-blur-sm"
              >
                <span className="font-bold text-small text-white block mb-2">{strat.title}</span>
                <p className="text-base text-white/90 leading-relaxed">{strat.action}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Input Card */}
      <Card>
        {isProcessing && (
          <div className="absolute inset-0 bg-bg-primary/90 backdrop-blur-sm z-20 flex items-center justify-center rounded-card">
            <AILoadingState
              message="Analyzing your entry..."
              steps={[
                "Parsing context...",
                "Checking energy levels...",
                "Generating strategies...",
              ]}
            />
          </div>
        )}

        {/* Energy Capacity Section */}
        <div className="mb-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-h2 font-display font-semibold text-text-primary">
                Energy Check-in
              </h3>
              <CardDescription>Set your baseline before journaling.</CardDescription>
            </div>
            <button
              onClick={() => setShowCapacity(!showCapacity)}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
            >
              {showCapacity ? (
                <ChevronUp size={20} className="text-text-tertiary" />
              ) : (
                <ChevronDown size={20} className="text-text-tertiary" />
              )}
            </button>
          </div>

          {showCapacity && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-xl gap-y-2 animate-fadeIn">
              <CapacitySlider
                label="Deep Focus"
                icon={Brain}
                value={capacity.focus}
                color="blue"
                suggested={suggestedCapacity.focus}
                informedBy={getInformedByContext("focus")}
                onValueChange={(v) => updateCapacity("focus", v)}
              />
              <CapacitySlider
                label="Emotional Processing"
                icon={Heart}
                value={capacity.emotional}
                color="pink"
                suggested={suggestedCapacity.emotional}
                informedBy={getInformedByContext("emotional")}
                onValueChange={(v) => updateCapacity("emotional", v)}
              />
              <CapacitySlider
                label="Social Energy"
                icon={Users}
                value={capacity.social}
                color="purple"
                suggested={suggestedCapacity.social}
                informedBy={getInformedByContext("social")}
                onValueChange={(v) => updateCapacity("social", v)}
              />
              <CapacitySlider
                label="Decision Capacity"
                icon={Zap}
                value={capacity.executive}
                color="cyan"
                suggested={suggestedCapacity.executive}
                informedBy={getInformedByContext("executive")}
                onValueChange={(v) => updateCapacity("executive", v)}
              />
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm text-rose-900 dark:text-rose-200">{error}</p>
            </div>
          </div>
        )}

        {circuitState === CircuitState.OPEN && !error && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                AI service is temporarily unavailable. Please wait a moment before trying again.
              </p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="relative group">
          <div className="mb-3 px-2">
            <p className="text-micro font-bold uppercase tracking-wider text-text-secondary mb-1">
              Capture Your Moment
            </p>
            <p className="text-small text-text-secondary">
              Track: <strong>Physical sensations</strong> (tension, fatigue, alertness), <strong>emotional state</strong> (mood, stress level), <strong>environment</strong> (noise, lighting, location), <strong>social interactions</strong> (who you're with, quality of interaction), <strong>food & drink intake</strong>, and <strong>activities</strong> (what you're doing).
            </p>
          </div>

          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Describe your current state... (e.g., 'Feeling mentally foggy after lunch, sitting in a noisy café, just had coffee and a sandwich, talking with a colleague about the project')"
            className="resize-none"
            rows={4}
          />

          {/* Voice Input */}
          <div className="absolute right-4 bottom-4">
            <RecordVoiceButton
              onTranscript={handleTranscript}
              onAnalysisReady={analysis => setVoiceObservations(analysis)}
              isDisabled={isProcessing}
            />
          </div>

          {/* Voice Observations Display */}
          {voiceObservations && (
            <div className="mt-6">
              <VoiceObservations
                analysis={voiceObservations}
                onContinue={() => setVoiceObservations(null)}
                onSkip={() => setVoiceObservations(null)}
              />
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="mt-4 flex justify-end animate-fadeIn gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || circuitState === CircuitState.OPEN}
            size="md"
            rightIcon={<Send size={16} />}
          >
            Save Entry
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default JournalEntry;
