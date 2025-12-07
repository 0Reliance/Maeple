/**
 * MAEPLE Supabase Storage Service
 * 
 * Provides cloud storage operations for all MAEPLE data types.
 * Works alongside local storage for a hybrid offline-first approach.
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { HealthEntry, UserSettings, StateCheck, FacialBaseline, WearableDataPoint } from '../types';

// ============================================
// AUTH HELPERS
// ============================================

export const getCurrentUserId = async (): Promise<string | null> => {
  const client = getSupabaseClient();
  if (!client) return null;
  
  const { data: { user } } = await client.auth.getUser();
  return user?.id || null;
};

export const isAuthenticated = async (): Promise<boolean> => {
  const userId = await getCurrentUserId();
  return !!userId;
};

// ============================================
// HEALTH ENTRIES
// ============================================

export const cloudSaveEntry = async (entry: HealthEntry): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await client
    .from('health_entries')
    .upsert({
      id: entry.id,
      user_id: userId,
      timestamp: entry.timestamp,
      raw_text: entry.rawText,
      mood: entry.mood,
      mood_label: entry.moodLabel,
      medications: entry.medications,
      symptoms: entry.symptoms,
      tags: entry.tags,
      activity_types: entry.activityTypes,
      strengths: entry.strengths,
      neuro_metrics: entry.neuroMetrics,
      sleep: entry.sleep,
      notes: entry.notes,
      ai_strategies: entry.aiStrategies,
      ai_reasoning: entry.aiReasoning,
      synced_at: new Date().toISOString(),
    });

  if (error) throw error;
};

export const cloudGetEntries = async (limit = 100): Promise<HealthEntry[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('health_entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    rawText: row.raw_text,
    mood: row.mood,
    moodLabel: row.mood_label,
    medications: row.medications || [],
    symptoms: row.symptoms || [],
    tags: row.tags || [],
    activityTypes: row.activity_types || [],
    strengths: row.strengths || [],
    neuroMetrics: row.neuro_metrics,
    sleep: row.sleep,
    notes: row.notes,
    aiStrategies: row.ai_strategies || [],
    aiReasoning: row.ai_reasoning,
  }));
};

export const cloudDeleteEntry = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await client
    .from('health_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
};

// ============================================
// USER SETTINGS
// ============================================

export const cloudSaveSettings = async (settings: UserSettings): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await client
    .from('user_settings')
    .upsert({
      user_id: userId,
      cycle_start_date: settings.cycleStartDate,
      avg_cycle_length: settings.avgCycleLength,
      safety_contact: settings.safetyContact,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) throw error;
};

export const cloudGetSettings = async (): Promise<UserSettings | null> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  if (!data) return null;

  return {
    cycleStartDate: data.cycle_start_date,
    avgCycleLength: data.avg_cycle_length,
    safetyContact: data.safety_contact,
  };
};

// ============================================
// STATE CHECKS
// ============================================

export const cloudSaveStateCheck = async (
  check: StateCheck,
  cipher?: string,
  iv?: string
): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await client
    .from('state_checks')
    .upsert({
      id: check.id,
      user_id: userId,
      timestamp: check.timestamp,
      analysis_cipher: cipher,
      iv: iv,
      user_note: check.userNote,
      has_image: !!check.imageBase64,
      synced_at: new Date().toISOString(),
    });

  if (error) throw error;
};

export const cloudGetStateChecks = async (limit = 100): Promise<Array<{
  id: string;
  timestamp: string;
  analysisCipher?: string;
  iv?: string;
  userNote?: string;
}>> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('state_checks')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    analysisCipher: row.analysis_cipher,
    iv: row.iv,
    userNote: row.user_note,
  }));
};

// ============================================
// FACIAL BASELINE
// ============================================

export const cloudSaveBaseline = async (baseline: FacialBaseline): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await client
    .from('facial_baselines')
    .upsert({
      id: baseline.id,
      user_id: userId,
      timestamp: baseline.timestamp,
      neutral_tension: baseline.neutralTension,
      neutral_fatigue: baseline.neutralFatigue,
      neutral_masking: baseline.neutralMasking,
      synced_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) throw error;
};

export const cloudGetBaseline = async (): Promise<FacialBaseline | null> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('facial_baselines')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    id: data.id,
    timestamp: data.timestamp,
    neutralTension: data.neutral_tension,
    neutralFatigue: data.neutral_fatigue,
    neutralMasking: data.neutral_masking,
  };
};

// ============================================
// WEARABLE DATA
// ============================================

export const cloudSaveWearableData = async (data: WearableDataPoint): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await client
    .from('wearable_data')
    .upsert({
      id: data.id,
      user_id: userId,
      date: data.date,
      provider: data.provider,
      synced_at: data.syncedAt,
      metrics: data.metrics,
    }, {
      onConflict: 'user_id,date,provider',
    });

  if (error) throw error;
};

export const cloudGetWearableData = async (days = 30): Promise<WearableDataPoint[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from('wearable_data')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    date: row.date,
    provider: row.provider,
    syncedAt: row.synced_at,
    metrics: row.metrics,
  }));
};

// ============================================
// SYNC METADATA
// ============================================

export interface SyncMetadata {
  lastSyncAt: string | null;
  entriesSynced: number;
  stateChecksSynced: number;
  syncStatus: 'never' | 'syncing' | 'synced' | 'error';
}

export const cloudGetSyncMetadata = async (): Promise<SyncMetadata | null> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('sync_metadata')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    lastSyncAt: data.last_sync_at,
    entriesSynced: data.entries_synced,
    stateChecksSynced: data.state_checks_synced,
    syncStatus: data.sync_status,
  };
};

export const cloudUpdateSyncMetadata = async (metadata: Partial<SyncMetadata>): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { error } = await client
    .from('sync_metadata')
    .upsert({
      user_id: userId,
      last_sync_at: metadata.lastSyncAt,
      entries_synced: metadata.entriesSynced,
      state_checks_synced: metadata.stateChecksSynced,
      sync_status: metadata.syncStatus,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) throw error;
};

// ============================================
// BULK OPERATIONS
// ============================================

export const cloudBulkSaveEntries = async (entries: HealthEntry[]): Promise<number> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const rows = entries.map(entry => ({
    id: entry.id,
    user_id: userId,
    timestamp: entry.timestamp,
    raw_text: entry.rawText,
    mood: entry.mood,
    mood_label: entry.moodLabel,
    medications: entry.medications,
    symptoms: entry.symptoms,
    tags: entry.tags,
    activity_types: entry.activityTypes,
    strengths: entry.strengths,
    neuro_metrics: entry.neuroMetrics,
    sleep: entry.sleep,
    notes: entry.notes,
    ai_strategies: entry.aiStrategies,
    ai_reasoning: entry.aiReasoning,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from('health_entries')
    .upsert(rows);

  if (error) throw error;
  
  return entries.length;
};

export { isSupabaseConfigured };
