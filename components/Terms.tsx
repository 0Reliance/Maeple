
import React from 'react';
import { Shield, FileText, AlertTriangle } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <header className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Legal Information</h1>
        <p className="text-slate-500">Last Updated: March 2025</p>
      </header>

      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-8">
        
        {/* Medical Disclaimer */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-bold">Medical Disclaimer</h2>
          </div>
          <div className="prose prose-slate max-w-none text-slate-600 bg-rose-50 p-6 rounded-xl border border-rose-100">
            <p className="font-medium">POZIMIND is not a medical device.</p>
            <p>
              The content, insights, and AI-generated suggestions provided by POZIMIND are for informational and self-reflection purposes only. 
              They do not constitute medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider 
              with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it 
              because of something you have read on POZIMIND.
            </p>
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* Terms of Service */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-indigo-600">
            <FileText size={24} />
            <h2 className="text-xl font-bold">Terms of Service</h2>
          </div>
          <div className="space-y-4 text-slate-600">
            <p>
              Welcome to POZIMIND, provided by <strong>Poziverse</strong> ("Company", "we", "us", "our"). 
              By accessing or using our application, you agree to be bound by these Terms.
            </p>
            <h3 className="font-bold text-slate-800 mt-4">1. Use of Service</h3>
            <p>
              You agree to use POZIMIND only for lawful purposes. You represent that you are of legal age to form a binding contract.
            </p>
            <h3 className="font-bold text-slate-800 mt-4">2. AI Technology</h3>
            <p>
              Our service utilizes artificial intelligence (Google Gemini) to process your data. While we strive for accuracy, AI models can produce 
              incorrect or "hallucinated" outputs. You acknowledge that reliance on any AI-generated content is at your own risk.
            </p>
            <h3 className="font-bold text-slate-800 mt-4">3. Intellectual Property</h3>
            <p>
              All content, features, and functionality of POZIMIND are the exclusive property of Poziverse.
            </p>
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* Privacy Policy Highlight */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-teal-600">
            <Shield size={24} />
            <h2 className="text-xl font-bold">Privacy Policy</h2>
          </div>
          <div className="space-y-4 text-slate-600">
            <p>
              Poziverse is committed to protecting your privacy.
            </p>
            <h3 className="font-bold text-slate-800 mt-4">Data Storage</h3>
            <p>
              POZIMIND operates with a "Local-First" philosophy. Your journal entries and personal settings are stored locally in your browser's 
              storage. We do not maintain a central database of your private journals.
            </p>
            <h3 className="font-bold text-slate-800 mt-4">External APIs</h3>
            <p>
              When you use AI features (e.g., parsing a journal entry), your text input is sent to Google's GenAI API for processing and immediately returned.
              When you connect a wearable device, we facilitate the connection directly between your browser and the provider.
            </p>
          </div>
        </section>

        <div className="text-center pt-8 text-sm text-slate-400">
          &copy; 2025 Poziverse. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default Terms;