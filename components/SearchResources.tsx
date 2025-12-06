import React, { useState } from 'react';
import { Search, Globe, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { searchHealthInfo, isAIConfigured } from '../services/geminiService';

const SearchResources: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{text: string | null, grounding?: Array<{text: string}>} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await searchHealthInfo(query);
      if (data === null) {
        setError('AI search not configured. Go to Settings to add an API key.');
        setResults(null);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error(err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">Health Knowledge Base</h2>
        <p className="text-blue-100 mb-6 text-sm">Powered by Google Search Grounding for up-to-date medical info.</p>
        
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search side effects, symptoms, or health news..."
            className="w-full pl-12 pr-4 py-3 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-400/30"
          />
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 bg-blue-700 hover:bg-blue-800 text-white p-1.5 rounded-lg transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-amber-600" size={20} />
          <p className="text-amber-800">{error}</p>
        </div>
      )}

      {results && results.text && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
           <div className="prose prose-slate max-w-none mb-6">
             <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{results.text}</p>
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
                           <div className="text-xs text-slate-400 truncate">{chunk.web.uri}</div>
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
