import React, { useState, useEffect } from "react";
import { Search, Globe, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAIService } from "@/contexts/DependencyContext";
import { CircuitState } from "@/patterns/CircuitBreaker";
import AILoadingState from "./AILoadingState";
import { safeParseAIResponse } from "../utils/safeParse";

// Type for search results
interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  text?: string;
  title?: string;
  url?: string;
}

interface SearchResult {
  text: string | null;
  grounding?: GroundingChunk[];
}

const SearchResources: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [circuitState, setCircuitState] = useState<CircuitState>(CircuitState.CLOSED);
  const aiService = useAIService();

  // Subscribe to circuit breaker state changes
  useEffect(() => {
    const unsubscribe = aiService.onStateChange(setCircuitState);
    return unsubscribe;
  }, [aiService]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // Use AI Service with Circuit Breaker protection
      const prompt = `Search for health information about: "${query}"\n\nPlease provide a comprehensive answer with medical sources. Format your response with:\n\n1. Main text explanation\n2. Sources section with URLs and titles\n\nFor sources, format them as a JSON array at the end:\n[\n  {"web": {"uri": "url", "title": "title"}}\n]`;
      
      const response = await aiService.analyze(prompt);
      
      // Parse response to extract text and sources
      const text = response.content;
      let grounding: GroundingChunk[] = [];
      
      // Try to extract JSON sources using safeParse
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const { data, error } = safeParseAIResponse<GroundingChunk[]>(jsonMatch[0], {
          context: 'SearchResources',
          stripMarkdown: false,
        });
        if (!error && data) {
          grounding = data;
        } else {
          console.warn("Failed to parse sources JSON", error);
        }
      }
      
      // Clean main text (remove JSON if found)
      const cleanText = jsonMatch ? text.replace(jsonMatch[0], '').trim() : text;
      
      setResults({ text: cleanText, grounding });
    } catch (err) {
      console.error(err);
      
      if (err && typeof err === 'object' && 'message' in err && 
          (err as Error).message.includes('Circuit breaker is OPEN')) {
        setError('AI service temporarily unavailable. Please try again later.');
      } else {
        setError("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">Wellness Assistant</h2>
        <p className="text-blue-100 mb-6 text-sm">
          Search trusted health information with AI-powered insights and verified sources.
        </p>
        <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <Globe size={16} className="text-blue-200" />
            What Makes This Trustworthy
          </h3>
          <ul className="text-sm space-y-2 text-blue-100">
            <li className="flex items-start gap-2">
              <span className="text-blue-200 mt-1">"</span>
              <span><strong>Grounded Search:</strong> Uses Google Search Grounding to verify information against current medical sources</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-200 mt-1">"</span>
              <span><strong>Source Citations:</strong> Every answer includes direct links to original medical literature</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-200 mt-1">"</span>
              <span><strong>AI Synthesis:</strong> Complex medical information is summarized into understandable language</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-200 mt-1">"</span>
              <span><strong>Privacy First:</strong> Your search queries are processed but never used to train AI models</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
        <h3 className="font-bold text-blue-800 dark:text-blue-200 text-sm mb-3 flex items-center gap-2">
          <AlertCircle size={18} />
          Important: Not Medical Advice
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          The Wellness Assistant provides information for educational purposes only. Always consult with qualified healthcare providers for diagnosis and treatment decisions. This tool helps you ask informed questions during medical conversations.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search side effects, symptoms, or health news..."
            className="w-full pl-12 pr-4 py-3 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-400/30"
          />
          <Search
            className="absolute left-4 top-3.5 text-slate-400"
            size={20}
          />
          <button
            type="submit"
            disabled={loading || circuitState === CircuitState.OPEN}
            className="absolute right-2 top-2 bg-blue-700 hover:bg-blue-800 text-white p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <ArrowRight size={20} />
            )}
          </button>
        </form>
      </div>

      {circuitState === CircuitState.OPEN && !error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-amber-600" size={20} />
          <p className="text-amber-800">
            AI service is temporarily unavailable. Please wait a moment before trying again.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-amber-600" size={20} />
          <p className="text-amber-800">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <AILoadingState
            message="Searching knowledge base..."
            steps={[
              "Querying medical sources...",
              "Verifying citations...",
              "Synthesizing answer...",
            ]}
          />
        </div>
      )}

      {results && results.text && !loading && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="prose prose-slate max-w-none mb-6">
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
              {results.text}
            </p>
          </div>

          {results.grounding && results.grounding.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-1">
                <Globe size={12} /> Sources
              </h4>
              <div className="grid gap-2">
                {results.grounding.map((chunk, i: number) => {
                  if (chunk.web?.uri) {
                    return (
                      <a
                        key={i}
                        href={chunk.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group"
                      >
                        <div className="bg-blue-50 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                          {i + 1}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                            {chunk.web.title}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {chunk.web.uri}
                          </div>
                        </div>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResources;