import {
  Brain,
  ChevronDown,
  ChevronUp,
  Compass,
  Heart,
  Send,
  Users,
  X,
  Zap,
  AlertCircle,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { AudioAnalysisResult } from "../services/audioAnalysisService";
import { useAIService } from "@/contexts/DependencyContext";
import { CircuitState } from "@/patterns/CircuitBreaker";
import {
  CapacityProfile,
  HealthEntry,
  ObjectiveObservation,
  ParsedResponse,
  StrategyRecommendation,
} from "../types";
import AILoadingState from "./AILoadingState";
import GentleInquiry from "./GentleInquiry";
import QuickCaptureMenu from "./QuickCaptureMenu";
import RecordVoiceButton from "./RecordVoiceButton";
import StateCheckWizard from "./StateCheckWizard";
import VoiceObservations from "./VoiceObservations";
import { Button } from "./ui/Button";
import { Card, CardDescription } from "./ui/Card";
import { Textarea } from "./ui/Input";

interface Props {
  onEntryAdded: (entry: HealthEntry) => void;
}

type CaptureMode = "menu" | "text" | "voice" | "bio-mirror";

const JournalEntry: React.FC<Props> = ({ onEntryAdded }) => {
  // Capture Mode State
  const [captureMode, setCaptureMode] = useState<CaptureMode>("menu");

  const handleMethodSelect = (method: CaptureMode) => {
    setCaptureMode(method);
  };
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [circuitState, setCircuitState] = useState<CircuitState>(CircuitState.CLOSED);
  const aiService = useAIService();

  // Subscribe to circuit breaker state changes
  useEffect(() => {
    const unsubscribe = aiService.onStateChange(setCircuitState);
    return unsubscribe;
  }, [aiService]);

  // Voice Observations State
  const [voiceObservations, setVoiceObservations] =
    useState<AudioAnalysisResult | null>(null);

  // Photo/Bio-Mirror Observations State
  const [photoObservations, setPhotoObservations] = useState<any>(null);

  // Gentle Inquiry State
  const [gentleInquiry, setGentleInquiry] = useState<any>(null);
  const [inquiryResponse, setInquiryResponse] = useState<string>("");
  const [showInquiry, setShowInquiry] = useState(false);

  const handlePhotoAnalysis = (analysis: any) => {
    setPhotoObservations(analysis);
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
  const [suggestedCapacity, setSuggestedCapacity] =
    useState<Partial<CapacityProfile>>({});

  // Recalculate suggestions when observations change
  React.useEffect(() => {
    if (voiceObservations || photoObservations) {
      const suggestions = getSuggestedCapacity();
      setSuggestedCapacity(suggestions);

      // Update capacity with suggestions if not already set
      if (Object.keys(suggestions).length > 0) {
        setCapacity((prev) => ({
          ...prev,
          ...suggestions,
        }) as CapacityProfile);
      }
    } else {
      setSuggestedCapacity({});
    }
  }, [voiceObservations, photoObservations]);

  // Phase 3: Immediate Strategy Feedback
  const [lastStrategies, setLastStrategies] = useState<
    StrategyRecommendation[]
  >([]);
  const [lastReasoning, setLastReasoning] = useState<string | null>(null);

  const handleTranscript = (
    transcript: string,
    audioBlob?: Blob,
    analysis?: AudioAnalysisResult
  ) => {
    setText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${transcript}` : transcript;
    });

    // Store voice observations if available
    if (analysis) {
      setVoiceObservations(analysis);
    }
  };

  const updateCapacity = (key: keyof CapacityProfile, val: number) => {
    setCapacity((prev) => ({ ...prev, [key]: val }));
  };

  const calculateAverageEnergy = () => {
    const values = Object.values(capacity) as number[];
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const getSuggestedCapacity = (): Partial<CapacityProfile> => {
    const suggestions: Partial<CapacityProfile> = {};

    // Voice analysis suggestions
    if (voiceObservations) {
      const highNoise = voiceObservations.observations.some(
        (obs: any) => obs.category === "noise" && obs.severity === "high"
      );
      if (highNoise) {
        suggestions.sensory = 3;
        suggestions.focus = 4;
      }

      const moderateNoise = voiceObservations.observations.some(
        (obs: any) => obs.category === "noise" && obs.severity === "moderate"
      );
      if (moderateNoise) {
        suggestions.sensory = 5;
      }

      const fastPace = voiceObservations.observations.some(
        (obs: any) =>
          obs.category === "speech-pace" && obs.value.includes("fast")
      );
      if (fastPace) {
        suggestions.executive = 4;
        suggestions.social = 4;
      }

      const highTension = voiceObservations.observations.some(
        (obs: any) => obs.category === "tone" && obs.severity === "high"
      );
      if (highTension) {
        suggestions.emotional = 4;
      }
    }

    // Photo analysis suggestions
    if (photoObservations) {
      if (photoObservations.lightingSeverity === "high") {
        suggestions.sensory = 3;
        suggestions.emotional = 4;
      }

      if (photoObservations.lightingSeverity === "moderate") {
        suggestions.sensory = 5;
      }

      const highTension = photoObservations.observations.some(
        (obs: any) =>
          obs.category === "tension" && obs.value.includes("high")
      );
      if (highTension) {
        suggestions.emotional = 4;
        suggestions.executive = 4;
      }

      const fatigueIndicators = photoObservations.observations.some(
        (obs: any) =>
          obs.category === "fatigue" && obs.severity !== "low"
      );
      if (fatigueIndicators) {
        suggestions.physical = 4;
        suggestions.focus = 4;
      }
    }

    return suggestions;
  };

  const getInformedByContext = (
    field: keyof CapacityProfile
  ): string | null => {
    const reasons: string[] = [];

    // Voice analysis reasons
    if (voiceObservations) {
      if (field === "sensory") {
        const noiseObs = voiceObservations.observations.find(
          (obs: any) => obs.category === "noise"
        );
        if (noiseObs?.severity === "high")
          reasons.push("high noise level detected");
        else if (noiseObs?.severity === "moderate")
          reasons.push("moderate noise detected");
      }
      if (field === "executive") {
        const paceObs = voiceObservations.observations.find(
          (obs: any) => obs.category === "speech-pace"
        );
        if (paceObs) reasons.push("speech pace analysis");
      }
      if (field === "emotional") {
        const toneObs = voiceObservations.observations.find(
          (obs: any) => obs.category === "tone"
        );
        if (toneObs?.severity === "high")
          reasons.push("tension detected in voice tone");
      }
    }

    // Photo analysis reasons
    if (photoObservations) {
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
          "moodScore": 1-5,
          "moodLabel": "...",
          "medications": [{"name": "...", "amount": "...", "unit": "..."}],
          "symptoms": [{"name": "...", "severity": 1-10}],
          "activityTypes": ["#Tag"],
          "strengths": ["..."],
          "strategies": [{"title": "...", "action": "...", "type": "REST"}],
          "summary": "...",
          "analysisReasoning": "...",
          "objectiveObservations": [{"type": "...", "value": "...", "severity": "low|moderate|high"}],
          "gentleInquiry": "... or null"
        }
      `;
      
      const response = await aiService.analyze(prompt);
      
      let parsed: ParsedResponse;
      try {
        const cleanJson = response.content.replace(/```json\n|\n```/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        console.warn("Failed to parse JSON, using fallback", e);
        parsed = {
          moodScore: 3,
          moodLabel: "Neutral",
          medications: [],
          symptoms: [],
          neuroMetrics: {
            environmentalMentions: [],
            socialMentions: [],
            executiveMentions: [],
            physicalMentions: [],
          },
          activityTypes: [],
          strengths: [],
          summary: response.content || "Entry analyzed",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [],
          gentleInquiry: undefined,
        };
      }

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
        objectiveObservations.push({
          type: "visual",
          source: "bio-mirror",
          observations: photoObservations.observations,
          confidence: photoObservations.confidence,
          timestamp: new Date().toISOString(),
        });
      }

      // 3. Add text observations if AI extracted them
      if (
        parsed.objectiveObservations &&
        parsed.objectiveObservations.length > 0
      ) {
        objectiveObservations.push({
          type: "text",
          source: "text-input",
          observations: parsed.objectiveObservations,
          confidence: 0.8,
          timestamp: new Date().toISOString(),
        });
      }

      const newEntry: HealthEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        rawText: text,
        mood: parsed.moodScore,
        moodLabel: parsed.moodLabel,
        medications: parsed.medications.map((m) => ({
          name: m.name,
          dosage: m.amount,
          unit: m.unit,
        })),
        symptoms: parsed.symptoms.map((s) => ({
          name: s.name,
          severity: s.severity,
        })),
        tags: [],
        activityTypes: parsed.activityTypes || [],
        strengths: parsed.strengths || [],
        neuroMetrics: {
          spoonLevel: calculateAverageEnergy(),
          sensoryLoad: 0,
          contextSwitches: 0,
          maskingScore: 0,
          capacity: capacity,
        },
        notes: parsed.summary,
        aiStrategies: parsed.strategies,
        aiReasoning: parsed.analysisReasoning,
        objectiveObservations:
          objectiveObservations.length > 0 ? objectiveObservations : undefined,
      };

      // Handle gentle inquiry - display if provided, otherwise save entry
      if (parsed.gentleInquiry) {
        setGentleInquiry(parsed.gentleInquiry);
        setShowInquiry(true);
        setPendingEntry(newEntry);
      } else {
        onEntryAdded(newEntry);
        resetForm();
      }

      setLastStrategies(parsed.strategies || []);
      setLastReasoning(parsed.analysisReasoning || null);
    } catch (e) {
      console.error("Failed to process entry", e);
      
      if (e && typeof e === 'object' && 'message' in e && 
          (e as Error).message.includes('Circuit breaker is OPEN')) {
        setError('AI service temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to analyze entry. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInquirySubmit = () => {
    if (!inquiryResponse.trim() || !pendingEntry) {
      setShowInquiry(false);
      if (pendingEntry) {
        onEntryAdded(pendingEntry);
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

    onEntryAdded(entryWithInquiry);
    resetForm();
  };

  const handleInquirySkip = () => {
    setShowInquiry(false);
    if (pendingEntry) {
      onEntryAdded(pendingEntry);
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

  const colorStyles: Record<
    string,
    { bg: string; text: string; gradient: string; accent: string }
  > = {
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/50",
      text: "text-blue-600 dark:text-blue-400",
      gradient: "from-blue-400 to-blue-500",
      accent: "accent-blue-500",
    },
    pink: {
      bg: "bg-pink-100 dark:bg-pink-900/50",
      text: "text-pink-600 dark:text-pink-400",
      gradient: "from-pink-400 to-pink-500",
      accent: "accent-pink-500",
    },
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900/50",
      text: "text-purple-600 dark:text-purple-400",
      gradient: "from-purple-400 to-purple-500",
      accent: "accent-purple-500",
    },
    cyan: {
      bg: "bg-cyan-100 dark:bg-cyan-900/50",
      text: "text-cyan-600 dark:text-cyan-400",
      gradient: "from-cyan-400 to-cyan-500",
      accent: "accent-cyan-500",
    },
    indigo: {
      bg: "bg-indigo-100 dark:bg-indigo-900/50",
      text: "text-indigo-600 dark:text-indigo-400",
      gradient: "from-indigo-400 to-indigo-500",
      accent: "accent-indigo-500",
    },
    rose: {
      bg: "bg-rose-100 dark:bg-rose-900/50",
      text: "text-rose-600 dark:text-rose-400",
      gradient: "from-rose-400 to-rose-500",
      accent: "accent-rose-500",
    },
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900/50",
      text: "text-orange-600 dark:text-orange-400",
      gradient: "from-orange-400 to-orange-500",
      accent: "accent-orange-500",
    },
    yellow: {
      bg: "bg-yellow-100 dark:bg-yellow-900/50",
      text: "text-yellow-600 dark:text-yellow-400",
      gradient: "from-yellow-400 to-yellow-500",
      accent: "accent-yellow-500",
    },
  };

  const CapacitySlider = ({
    label,
    icon: Icon,
    value,
    field,
    color,
    suggested,
  }: any) => {
    const styles = colorStyles[color] || colorStyles.blue;
    const informedBy = getInformedByContext(field);
    const isSuggested = suggested !== undefined && value === suggested;

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-full ${styles.bg} ${styles.text}`}
            >
              <Icon size={14} />
            </div>
            <span className="text-sm font-medium text-text-primary">
              {label}
            </span>
            {isSuggested && (
              <span className="text-xs text-primary font-medium">
                (Suggested)
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-text-primary">
            {value}/10
          </span>
        </div>

        {informedBy && (
          <div className="mb-2 text-xs text-primary flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
            <span>💡</span>
            <span>{informedBy}</span>
          </div>
        )}

        <div className="relative h-3 bg-bg-secondary rounded-full overflow-hidden cursor-pointer group">
          <div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${styles.gradient} rounded-full transition-all duration-300`}
            style={{ width: `${value * 10}%` }}
          ></div>
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) =>
              updateCapacity(field, parseInt(e.target.value))
            }
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-lg animate-fadeIn">
      {/* Quick Capture Menu - Mode Selection */}
      {captureMode === "menu" && (
        <QuickCaptureMenu
          onMethodSelect={handleMethodSelect}
          disabled={isProcessing}
        />
      )}

      {/* Bio-Mirror / Photo Mode */}
      {captureMode === "bio-mirror" && (
        <div className="space-y-6">
          <Card>
            <button
              onClick={() => setCaptureMode("menu")}
              className="text-small text-text-tertiary hover:text-text-primary transition-colors"
            >
              ← Back to menu
            </button>
            <div className="mt-4">
              <StateCheckWizard />
            </div>
          </Card>
        </div>
      )}

      {/* Gentle Inquiry Overlay */}
      {showInquiry && gentleInquiry && (
        <Card className="bg-primary/10 border-primary/20">
          <GentleInquiry
            inquiry={gentleInquiry}
            onResponse={(response) => {
              setInquiryResponse(response);
              handleInquirySubmit();
            }}
            onSkip={handleInquirySkip}
            disabled={isProcessing}
          />
        </Card>
      )}

      {/* Strategy Feedback */}
      {lastStrategies.length > 0 && (
        <Card className="bg-gradient-to-r from-accent-positive to-primary text-white border-none shadow-lg shadow-accent-positive/20">
          <button
            onClick={() => setLastStrategies([])}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-4 pr-8">
            <Compass size={24} className="text-white/80" />
            <h3 className="text-h2 font-display font-semibold">
              Today's Insights
            </h3>
          </div>

          {lastReasoning && (
            <p className="text-white/90 text-small mb-4 italic border-l-2 border-white/50 pl-3">
              Pattern detected: {lastReasoning}
            </p>
          )}

          <div className="grid md:grid-cols-3 gap-lg">
            {lastStrategies.map((strat) => (
              <div
                key={strat.id}
                className="bg-white/10 border border-white/20 p-lg rounded-xl backdrop-blur-sm"
              >
                <span className="font-bold text-small text-white block mb-2">
                  {strat.title}
                </span>
                <p className="text-base text-white/90 leading-relaxed">
                  {strat.action}
                </p>
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
              <CardDescription>
                Set your baseline before journaling.
              </CardDescription>
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
                field="focus"
                color="blue"
                suggested={suggestedCapacity.focus}
              />
              <CapacitySlider
                label="Emotional Processing"
                icon={Heart}
                value={capacity.emotional}
                field="emotional"
                color="pink"
                suggested={suggestedCapacity.emotional}
              />
              <CapacitySlider
                label="Social Energy"
                icon={Users}
                value={capacity.social}
                field="social"
                color="purple"
                suggested={suggestedCapacity.social}
              />
              <CapacitySlider
                label="Decision Capacity"
                icon={Zap}
                value={capacity.executive}
                field="executive"
                color="cyan"
                suggested={suggestedCapacity.executive}
              />
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-rose-900 dark:text-rose-200">{error}</p>
            </div>
          </div>
        )}

        {circuitState === CircuitState.OPEN && !error && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
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
              Note your <strong>environment</strong>, <strong>interactions</strong>,
              and <strong>energy levels</strong>.
            </p>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How are you feeling right now? (e.g., 'Overwhelmed by noise', 'In peak focus')"
            className="resize-none"
            rows={4}
          />

          {/* Voice Input */}
          <div className="absolute right-4 bottom-4">
            <RecordVoiceButton
              onTranscript={handleTranscript}
              onAnalysisReady={(analysis) => setVoiceObservations(analysis)}
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
        {text && (
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
        )}
      </Card>
    </div>
  );
};

export default JournalEntry;