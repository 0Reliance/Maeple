import React, { useState, useEffect } from "react";
import {
  ImagePlus,
  Wand2,
  Loader2,
  Save,
  Sparkles,
  Brain,
  Volume2,
  Star,
  AlertCircle,
} from "lucide-react";
import { useVisionService } from "@/contexts/DependencyContext";
import { getEntries } from "../services/storageService";
import { HealthEntry } from "../types";
import { CircuitState } from "@/patterns/CircuitBreaker";
import AILoadingState from "./AILoadingState";

const VisionBoard: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState<string | null>(null);
  const [recentEntry, setRecentEntry] = useState<HealthEntry | null>(null);
  const [error, setError] = useState<string>("");
  const [circuitState, setCircuitState] = useState<CircuitState>(CircuitState.CLOSED);
  const visionService = useVisionService();

  // Subscribe to circuit breaker state changes
  useEffect(() => {
    const unsubscribe = visionService.onStateChange(setCircuitState);
    return unsubscribe;
  }, [visionService]);

  useEffect(() => {
    const entries = getEntries();
    if (entries.length > 0) {
      // Sort by date desc just in case
      const sorted = [...entries].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentEntry(sorted[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpload(reader.result as string);
        setGeneratedImage(null); // Reset generated if new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async () => {
    if (!prompt) return;
    setLoading(true);
    setError("");
    try {
      // Use DI with Circuit Breaker protection
      const base64Data = upload ? upload.split(",")[1] : undefined;
      const result = await visionService.generateImage(prompt, base64Data);
      setGeneratedImage(result);
    } catch (e) {
      console.error("Image generation failed:", e);
      
      if (e && typeof e === 'object' && 'message' in e && 
          (e as Error).message.includes('Circuit breaker is OPEN')) {
        setError('AI service temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const useSmartPrompt = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>

        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Wand2 className="text-pink-200" />
          Visual Therapy
        </h2>
        <p className="text-purple-100 text-base max-w-xl leading-relaxed mb-6">
          Process your emotions visually. Use generative art to externalize
          feelings, visualize safe spaces, or celebrate your strengths.
        </p>

        {recentEntry && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-pink-100 uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Suggested for your current state</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Mood Prompt */}
              <button
                onClick={() =>
                  useSmartPrompt(
                    `An abstract artistic representation of feeling ${recentEntry.moodLabel}, expressive colors`
                  )
                }
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors text-left flex items-center gap-2 border border-white/10"
              >
                <Brain size={12} className="text-teal-200" />
                Visualize "{recentEntry.moodLabel}"
              </button>

              {/* Sensory Prompt */}
              {recentEntry.neuroMetrics.sensoryLoad > 6 && (
                <button
                  onClick={() =>
                    useSmartPrompt(
                      "A calm, quiet sanctuary with soft lighting and nature elements, hyper-realistic"
                    )
                  }
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors text-left flex items-center gap-2 border border-white/10"
                >
                  <Volume2 size={12} className="text-orange-200" />
                  Generate a Sensory Sanctuary
                </button>
              )}

              {/* Strength Prompt */}
              {recentEntry.strengths.length > 0 && (
                <button
                  onClick={() =>
                    useSmartPrompt(
                      `A vibrant, energetic metaphorical illustration of the character strength: ${recentEntry.strengths[0]}`
                    )
                  }
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors text-left flex items-center gap-2 border border-white/10"
                >
                  <Star size={12} className="text-yellow-200" />
                  Celebrate {recentEntry.strengths[0]}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="img-upload"
            />
            <label
              htmlFor="img-upload"
              className="flex items-center justify-center gap-2 h-10 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors text-sm text-slate-600 font-medium"
            >
              <ImagePlus size={16} />
              {upload
                ? "Change Reference Image"
                : "Upload Reference (Optional)"}
            </label>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-xl">
            {loading && (
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <AILoadingState
                  message="Dreaming up your vision..."
                  steps={[
                    "Analyzing prompt...",
                    "Mixing colors...",
                    "Applying style...",
                  ]}
                />
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                upload
                  ? "How should we edit this image? (e.g. 'Add a healthy salad next to it')"
                  : "Describe what you want to visualize... (e.g. 'My mind as a garden recovering from a storm')"
              }
              className="w-full bg-transparent rounded-xl p-4 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-0 h-32 resize-none text-lg"
            />
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleAction}
                disabled={loading || !prompt || circuitState === CircuitState.OPEN}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                  loading || !prompt || circuitState === CircuitState.OPEN
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-200 transform active:scale-95"
                }`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Wand2 size={18} />
                )}
                {loading ? "Dreaming..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {upload && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">
              Original Reference
            </span>
            <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 aspect-square">
              <img
                src={upload}
                alt="Original"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        {generatedImage && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 uppercase tracking-wider">
                  AI Creation
                </span>
              </div>
              <a
                href={generatedImage}
                download="maeple-vision.png"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition-colors font-medium"
              >
                <Save size={16} />
                Save to Device
              </a>
            </div>
            <div className="rounded-xl overflow-hidden shadow-inner bg-slate-900 aspect-video flex items-center justify-center">
              <img
                src={generatedImage}
                alt="Generated"
                className="h-full object-contain"
              />
            </div>

            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <h4 className="text-sm font-bold text-purple-900 mb-1">
                Reflection
              </h4>
              <p className="text-sm text-purple-700">
                How does looking at this image make you feel? Consider saving it
                to look at when you need a reminder of this state.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-rose-900 dark:text-rose-200">{error}</p>
          </div>
        </div>
      )}

      {circuitState === CircuitState.OPEN && !error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              AI service is temporarily unavailable. Please wait a moment before trying again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionBoard;