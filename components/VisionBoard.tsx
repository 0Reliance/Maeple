
import React, { useState } from 'react';
import { ImagePlus, Wand2, Loader2, Save } from 'lucide-react';
import { generateOrEditImage } from '../services/geminiService';

const VisionBoard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState<string | null>(null);

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
    try {
      // Strip prefix for API
      const base64Data = upload ? upload.split(',')[1] : undefined;
      const result = await generateOrEditImage(prompt, base64Data);
      setGeneratedImage(result);
    } catch (e) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">Visual Therapy</h2>
        <p className="text-purple-100 text-sm mb-6">
          Describe a feeling to generate art, or upload a photo (e.g., your meal) and ask AI to edit/analyze it.
        </p>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 rounded-xl p-2 border border-white/20">
               <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                  id="img-upload" 
               />
               <label htmlFor="img-upload" className="flex items-center justify-center gap-2 h-10 cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-sm">
                  <ImagePlus size={16} />
                  {upload ? "Change Image" : "Upload Reference"}
               </label>
            </div>
          </div>
          
          <div className="relative">
             <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={upload ? "How should we edit this image? (e.g. 'Add a healthy salad next to it')" : "Describe an image... (e.g. 'A calm ocean at sunset, oil painting style')"}
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder:text-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 h-24 resize-none"
             />
             <button
                onClick={handleAction}
                disabled={loading || !prompt}
                className="absolute bottom-3 right-3 bg-white text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
             >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
             </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
          {upload && (
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase mb-2 block">Original</span>
                <img src={upload} alt="Original" className="w-full h-64 object-cover rounded-lg" />
            </div>
          )}
          {generatedImage && (
             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-slate-400 uppercase">Generated Result</span>
                   <a href={generatedImage} download="pozimind-vision.png" className="text-slate-400 hover:text-purple-600">
                     <Save size={16} />
                   </a>
                </div>
                <img src={generatedImage} alt="Generated" className="w-full h-64 object-cover rounded-lg" />
            </div>
          )}
      </div>
    </div>
  );
};

export default VisionBoard;