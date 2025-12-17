/**
 * AI Provider Settings Component
 * 
 * UI for configuring AI providers and API keys
 */

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  Server,
  Sparkles,
  Search,
  Mic,
  Image,
} from 'lucide-react';
import {
  AIProviderType,
  AIProviderConfig,
  AICapability,
  AI_PROVIDERS,
} from '../services/ai/types';
import { aiSettingsService } from '../services/ai/settingsService';

interface ProviderCardProps {
  providerId: AIProviderType;
  config?: AIProviderConfig;
  onSave: (config: AIProviderConfig) => Promise<void>;
  onRemove: (providerId: AIProviderType) => Promise<void>;
}

const CapabilityIcon: React.FC<{ capability: AICapability }> = ({ capability }) => {
  switch (capability) {
    case 'text': return <Bot size={14} />;
    case 'vision': return <Eye size={14} />;
    case 'image_gen': return <Image size={14} />;
    case 'search': return <Search size={14} />;
    case 'audio': return <Mic size={14} />;
    default: return <Sparkles size={14} />;
  }
};

const CapabilityBadge: React.FC<{ capability: AICapability }> = ({ capability }) => {
  const names: Record<AICapability, string> = {
    'text': 'Text',
    'vision': 'Vision',
    'image_gen': 'Image Gen',
    'search': 'Search',
    'audio': 'Audio',
  };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs">
      <CapabilityIcon capability={capability} />
      {names[capability] || capability}
    </span>
  );
};

const ProviderCard: React.FC<ProviderCardProps> = ({
  providerId,
  config,
  onSave,
  onRemove,
}) => {
  const providerInfo = AI_PROVIDERS[providerId];
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEnabled, setIsEnabled] = useState(config?.enabled ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isConfigured = !!config?.enabled && !!config?.apiKey;
  const needsApiKey = !providerInfo.isLocal;
  const needsBaseUrl = providerId === 'ollama';

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await onSave({
        providerId,
        enabled: isEnabled,
        apiKey: needsApiKey ? apiKey : undefined,
        baseUrl: needsBaseUrl ? baseUrl : undefined,
      });
      setSaveMessage('Saved!');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      setSaveMessage('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (confirm(`Remove ${providerInfo.name} configuration? This will delete your API key.`)) {
      await onRemove(providerId);
      setApiKey('');
      setIsEnabled(false);
    }
  };

  const getProviderIcon = () => {
    if (providerInfo.isLocal) return <Server size={24} />;
    return <Globe size={24} />;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isConfigured ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            {getProviderIcon()}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">{providerInfo.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{providerInfo.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConfigured && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check size={14} />
              Configured
            </span>
          )}
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4">
          {/* Capabilities */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              Capabilities
            </label>
            <div className="flex flex-wrap gap-2">
              {providerInfo.capabilities.map((cap) => (
                <CapabilityBadge key={cap} capability={cap} />
              ))}
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Enable Provider</label>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEnabled(!isEnabled); }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white dark:bg-slate-200 rounded-full transition-transform ${
                  isEnabled ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* API Key Input */}
          {needsApiKey && (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${providerInfo.name} API key`}
                  className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 focus:outline-none font-mono text-sm text-slate-800 dark:text-slate-200"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowApiKey(!showApiKey); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {providerInfo.docsUrl && (
                <a
                  href={providerInfo.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  Get API key →
                </a>
              )}
            </div>
          )}

          {/* Base URL Input (Ollama) */}
          {needsBaseUrl && (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 focus:outline-none font-mono text-sm text-slate-800 dark:text-slate-200"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Save Message */}
          {saveMessage && (
            <div className={`p-3 rounded-xl flex items-center gap-2 ${
              saveMessage === 'Saved!' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {saveMessage === 'Saved!' ? <Check size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-medium">{saveMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              disabled={isSaving || (needsApiKey && !apiKey && isEnabled)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save
            </button>
            {isConfigured && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-medium transition-colors ml-auto"
              >
                <Trash2 size={16} />
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AIProviderSettings: React.FC = () => {
  const [settings, setSettings] = useState(aiSettingsService.getSettings());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      await aiSettingsService.initialize();
      setSettings(aiSettingsService.getSettings());
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  const handleSaveProvider = async (config: AIProviderConfig) => {
    await aiSettingsService.updateProvider(config);
    setSettings(aiSettingsService.getSettings());
  };

  const handleRemoveProvider = async (providerId: AIProviderType) => {
    await aiSettingsService.removeProvider(providerId);
    setSettings(aiSettingsService.getSettings());
  };

  const configuredProviders = settings.providers.filter((p) => p.enabled);
  const unconfiguredProviderIds = (Object.keys(AI_PROVIDERS) as AIProviderType[]).filter(
    (id) => !configuredProviders.find((p) => p.providerId === id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bot className="text-indigo-500" size={20} />
            AI Providers
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure AI providers for intelligent analysis
          </p>
        </div>
        {!aiSettingsService.hasAnyProvider() && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">No AI configured</span>
          </div>
        )}
      </div>

      {/* Configured Providers */}
      {configuredProviders.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase">Configured</h4>
          {configuredProviders.map((config) => (
            <ProviderCard
              key={config.providerId}
              providerId={config.providerId}
              config={config}
              onSave={handleSaveProvider}
              onRemove={handleRemoveProvider}
            />
          ))}
        </div>
      )}

      {/* Available Providers */}
      {unconfiguredProviderIds.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase">Available Providers</h4>
          {unconfiguredProviderIds.map((providerId) => (
            <ProviderCard
              key={providerId}
              providerId={providerId}
              config={settings.providers.find((p) => p.providerId === providerId)}
              onSave={handleSaveProvider}
              onRemove={handleRemoveProvider}
            />
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-indigo-50 p-4 rounded-xl">
        <h4 className="font-bold text-indigo-800 text-sm">How it works</h4>
        <ul className="text-sm text-indigo-700 mt-2 space-y-1">
          <li>• Configure one or more AI providers</li>
          <li>• Journal analysis uses configured AI for insights</li>
          <li>• All API keys are encrypted locally</li>
          <li>• The app works without AI, but features are limited</li>
          <li>• Ollama runs locally - no API key needed!</li>
        </ul>
      </div>
    </div>
  );
};

export default AIProviderSettings;
