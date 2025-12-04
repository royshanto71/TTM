'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { getSettings, updateSetting } from '@/lib/settingsHelpers';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    app_name: '',
    app_logo_text: '',
    app_tagline: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const data = await getSettings();
      setSettings({
        app_name: data.app_name || 'TMS',
        app_logo_text: data.app_logo_text || 'TMS',
        app_tagline: data.app_tagline || 'Tuition Management System',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');

    try {
      const updates = [
        updateSetting('app_name', settings.app_name),
        updateSetting('app_logo_text', settings.app_logo_text),
        updateSetting('app_tagline', settings.app_tagline),
      ];

      await Promise.all(updates);
      setSaveMessage('Settings saved successfully!');
      
      // Reload page after 1 second to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Customize your application</p>
        </div>

        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-indigo-500/10">
              <SettingsIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">App Branding</h2>
              <p className="text-gray-400">
                Customize the name, logo, and tagline displayed throughout the application
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <Input
              label="App Name"
              type="text"
              required
              value={settings.app_name}
              onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
              placeholder="e.g., TMS"
            />

            <Input
              label="Logo Text"
              type="text"
              required
              value={settings.app_logo_text}
              onChange={(e) => setSettings({ ...settings, app_logo_text: e.target.value })}
              placeholder="e.g., TMS"
            />

            <Input
              label="App Tagline"
              type="text"
              required
              value={settings.app_tagline}
              onChange={(e) => setSettings({ ...settings, app_tagline: e.target.value })}
              placeholder="e.g., Tuition Management System"
            />

            {saveMessage && (
              <div
                className={`p-4 rounded-lg ${
                  saveMessage.includes('success')
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {saveMessage}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Preview Card */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Preview</h2>
          <div className="space-y-4">
            <div className="glass rounded-lg p-6 text-center">
              <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                {settings.app_logo_text}
              </h1>
              <p className="text-sm text-gray-400">{settings.app_tagline}</p>
            </div>
            <p className="text-xs text-gray-500 text-center">
              This is how your branding will appear throughout the app
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
