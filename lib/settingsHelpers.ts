import { supabase } from './supabase';

interface SettingsMap {
  [key: string]: string;
}

// Get all settings as a key-value map
export async function getSettings(): Promise<SettingsMap> {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');

  if (error) {
    console.error('Error fetching settings:', error);
    return {};
  }

  const settingsMap: SettingsMap = {};
  data?.forEach((setting) => {
    settingsMap[setting.key] = setting.value;
  });

  return settingsMap;
}

// Get a specific setting value
export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }

  return data?.value || null;
}

// Update or create a setting
export async function updateSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { 
      onConflict: 'key' 
    });

  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }

  return true;
}

// Convenience functions for common settings
export async function getAppName(): Promise<string> {
  return await getSetting('app_name') || 'TMS';
}

export async function getLogoText(): Promise<string> {
  return await getSetting('app_logo_text') || 'TMS';
}

export async function getTagline(): Promise<string> {
  return await getSetting('app_tagline') || 'Tuition Management System';
}

export async function updateAppName(name: string): Promise<boolean> {
  return await updateSetting('app_name', name);
}

export async function updateLogoText(text: string): Promise<boolean> {
  return await updateSetting('app_logo_text', text);
}

export async function updateTagline(tagline: string): Promise<boolean> {
  return await updateSetting('app_tagline', tagline);
}
