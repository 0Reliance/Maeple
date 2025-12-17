
import React from 'react';
import { Shield, FileText, AlertTriangle } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <header className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Legal Information</h1>
        <p className="text-slate-500 dark:text-slate-400">Last Updated: March 2025</p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
        
        {/* Medical Disclaimer */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-bold">Important Disclaimer</h2>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 bg-rose-50 dark:bg-rose-900/20 p-6 rounded-xl border border-rose-100 dark:border-rose-800">
            <p className="font-medium">MAEPLE is a support tool, not a medical device.</p>
            <p>
              The content, insights, and AI-generated suggestions provided by MAEPLE are for informational, educational, and self-discovery purposes only. 
              They do not constitute medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider 
              with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it 
              because of something you have read on MAEPLE.
            </p>
          </div>
        </section>

        {/* Data Privacy & Storage */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
            <Shield size={24} />
            <h2 className="text-xl font-bold">Data Privacy & Storage</h2>
          </div>
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-4">Local-First Architecture</h3>
            <p>
              MAEPLE is designed with a "Local-First" philosophy. By default, all your journal entries, health metrics, and personal data are stored 
              <strong>locally on your device</strong> (using IndexedDB/LocalStorage). This means your data remains in your possession and is not 
              automatically sent to any cloud server.
            </p>
            
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-4">Optional Cloud Sync</h3>
            <p>
              If you choose to enable Cloud Sync features, an encrypted copy of your data will be securely transmitted to our servers to facilitate 
              synchronization across multiple devices. You retain full ownership of your data at all times.
            </p>

            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-4">AI Processing</h3>
            <p>
              To provide intelligent insights, anonymized snippets of your journal entries may be processed by our AI partners (e.g., Google Gemini). 
              We do not use your personal health data to train public AI models.
            </p>
          </div>
        </section>

        <hr className="border-slate-100 dark:border-slate-700" />

        {/* Terms of Service */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <FileText size={24} />
            <h2 className="text-xl font-bold">Terms of Service</h2>
          </div>
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <p>
              Welcome to MAEPLE, provided by <strong>Poziverse</strong> ("Company", "we", "us", "our"). 
              By accessing or using our application, you agree to be bound by these Terms.
            </p>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-4">1. Use of Service</h3>
            <p>
              You agree to use MAEPLE only for lawful purposes. You represent that you are of legal age to form a binding contract.
            </p>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-4">2. AI Technology</h3>
            <p>
              Our service utilizes artificial intelligence (Google Gemini) to process your data. While we strive for accuracy, AI models can produce 
              incorrect or "hallucinated" outputs. You acknowledge that reliance on any AI-generated content is at your own risk.
            </p>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-4">3. Intellectual Property</h3>
            <p>
              All content, features, and functionality of MAEPLE are the exclusive property of Poziverse.
            </p>
          </div>
        </section>

        <hr className="border-slate-100 dark:border-slate-700" />

        {/* Privacy Policy Highlight */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
            <Shield size={24} />
            <h2 className="text-xl font-bold">Privacy Policy</h2>
          </div>
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <p>
              Poziverse is committed to protecting your privacy.
            </p>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-4">Data Storage</h3>
            <p>
              MAEPLE operates with a "Local-First" philosophy. Your journal entries and personal settings are stored locally in your browser's 
              storage. We do not maintain a central database of your private journals.
            </p>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-4">External APIs</h3>
            <p>
              When you use AI features (e.g., parsing a journal entry), your text input is sent to Google's GenAI API for processing and immediately returned.
              When you connect a wearable device, we facilitate the connection directly between your browser and the provider.
            </p>
          </div>
        </section>

        <div className="text-center pt-8 text-sm text-slate-400 dark:text-slate-500">
          &copy; 2025 Poziverse. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default Terms;