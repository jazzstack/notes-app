import { useAppStore } from '../store/appStore';
import { useNotesStore } from '../store/notesStore';
import { usePluginsStore } from '../store/pluginsStore';
import { useSyncStore } from '../store/syncStore';
import { useTheme } from '@notes-app/ui';
import { Icons } from '@notes-app/ui';
import { useState, useEffect } from 'react';

export function SettingsPage() {
  const { settings, updateSettings } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { vaultPath, vaultInitialized, selectVault } = useNotesStore();
  const plugins = usePluginsStore((state) => state.plugins);
  const enabledPlugins = usePluginsStore((state) => state.enabledPlugins);
  const enablePlugin = usePluginsStore((state) => state.enablePlugin);
  const disablePlugin = usePluginsStore((state) => state.disablePlugin);
  const { status, config, initialize, configure, sync, setConfig } = useSyncStore();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [customCSS, setCustomCSS] = useState('');

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (config.supabaseUrl) setSupabaseUrl(config.supabaseUrl);
    if (config.supabaseAnonKey) setSupabaseKey(config.supabaseAnonKey);
  }, [config]);

  const handleConfigureSync = () => {
    if (supabaseUrl && supabaseKey) {
      configure(supabaseUrl, supabaseKey);
    }
  };

  const handleSyncNow = async () => {
    await sync();
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleSelectVault = async () => {
    await selectVault();
  };

  return (
    <div className="settings-container">
      <div className="settings-page">
        <header className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-description">
          Customize your notes app experience
        </p>
      </header>

      <section className="settings-section">
        <h2 className="settings-section-title">Vault</h2>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-label">Vault Folder</div>
            <div className="settings-item-description">
              {vaultPath ? vaultPath : 'No vault selected'}
            </div>
          </div>
          <div className="settings-item-control">
            <button className="btn btn-secondary" onClick={handleSelectVault}>
              <Icons.FolderOpen />
              {vaultInitialized ? 'Change Vault' : 'Select Vault'}
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Appearance</h2>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-label">Theme</div>
            <div className="settings-item-description">
              Choose your preferred color scheme
            </div>
          </div>
          <div className="settings-item-control">
            <div className="theme-selector">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <div className="theme-preview theme-preview-light" />
                <div className="theme-preview-label">Light</div>
              </button>
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="theme-preview theme-preview-dark" />
                <div className="theme-preview-label">Dark</div>
              </button>
              <button
                className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                onClick={() => handleThemeChange('system')}
              >
                <div className="theme-preview" style={{
                  background: 'linear-gradient(135deg, #ffffff 50%, #0f0f0f 50%)',
                }} />
                <div className="theme-preview-label">System</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Editor</h2>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-label">Font Size</div>
            <div className="settings-item-description">
              Adjust the editor text size
            </div>
          </div>
          <div className="settings-item-control">
            <input
              type="range"
              min="12"
              max="24"
              value={settings.editorFontSize}
              onChange={(e) => updateSettings({ editorFontSize: parseInt(e.target.value) })}
              style={{ width: '120px' }}
            />
            <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-sm)', minWidth: '40px' }}>
              {settings.editorFontSize}px
            </span>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-label">Font Family</div>
            <div className="settings-item-description">
              Choose your preferred editor font
            </div>
          </div>
          <div className="settings-item-control">
            <select
              className="select"
              value={settings.editorFontFamily}
              onChange={(e) => updateSettings({ editorFontFamily: e.target.value })}
              style={{ width: '160px' }}
            >
              <option value="Inter">Inter</option>
              <option value="Fira Code">Fira Code</option>
              <option value="Georgia">Georgia</option>
              <option value="system-ui">System UI</option>
            </select>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Plugins</h2>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-label">Plugin System</div>
            <div className="settings-item-description">
              Extend app functionality with plugins
            </div>
          </div>
        </div>

        {plugins.length === 0 ? (
          <div className="settings-item">
            <div className="settings-item-description" style={{ padding: 'var(--space-3)', color: 'var(--color-text-tertiary)' }}>
              No plugins installed
            </div>
          </div>
        ) : (
          plugins.map((plugin) => (
            <div key={plugin.id} className="settings-item">
              <div className="settings-item-content">
                <div className="settings-item-label">{plugin.name}</div>
                <div className="settings-item-description">
                  {plugin.description} (v{plugin.version})
                </div>
              </div>
              <div className="settings-item-control">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={enabledPlugins.has(plugin.id)}
                    onChange={async (e) => {
                      if (e.target.checked) {
                        await enablePlugin(plugin.id);
                      } else {
                        await disablePlugin(plugin.id);
                      }
                    }}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Sync</h2>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-label">Status</div>
            <div className="settings-item-description">
              {status.state === 'syncing' && 'Syncing...'}
              {status.state === 'idle' && `Last synced: ${status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never'}`}
              {status.state === 'error' && `Error: ${status.error || 'Unknown error'}`}
              {status.state === 'offline' && 'Offline'}
              {status.pendingChanges > 0 && ` (${status.pendingChanges} pending changes)`}
            </div>
          </div>
          <div className="settings-item-control">
            <button 
              className="btn btn-secondary" 
              onClick={handleSyncNow}
              disabled={status.state === 'syncing'}
            >
              <Icons.Save />
              Sync Now
            </button>
          </div>
        </div>

        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className="settings-item-content" style={{ marginBottom: 'var(--space-3)' }}>
            <div className="settings-item-label">Supabase Configuration</div>
            <div className="settings-item-description">
              Configure your Supabase project for cloud sync
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <input
              type="text"
              className="input"
              placeholder="Supabase URL (e.g., https://xxxxx.supabase.co)"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
            <input
              type="password"
              className="input"
              placeholder="Supabase anon key"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={handleConfigureSync}
            disabled={!supabaseUrl || !supabaseKey}
          >
            Configure Sync
          </button>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-label">End-to-End Encryption</div>
            <div className="settings-item-description">
              Encrypt notes before syncing to cloud
            </div>
          </div>
          <div className="settings-item-control">
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.encryptionEnabled}
                onChange={(e) => setConfig({ encryptionEnabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-label">Auto Sync</div>
            <div className="settings-item-description">
              Automatically sync changes
            </div>
          </div>
          <div className="settings-item-control">
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.autoSync}
                onChange={(e) => setConfig({ autoSync: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Custom CSS</h2>

        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className="settings-item-content" style={{ marginBottom: 'var(--space-3)' }}>
            <div className="settings-item-label">Custom Styles</div>
            <div className="settings-item-description">
              Add custom CSS to customize the app appearance
            </div>
          </div>
          <textarea
            className="custom-css-editor"
            value={customCSS}
            onChange={(e) => setCustomCSS(e.target.value)}
            placeholder="/* Example:
.app-layout {
  --color-accent: #8b5cf6;
}
*/"
            rows={8}
          />
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Keyboard Shortcuts</h2>

        <div className="keyboard-shortcuts">
          <div className="shortcut-item">
            <span className="shortcut-action">New Note</span>
            <div className="shortcut-keys">
              <span className="shortcut-key">⌘</span>
              <span className="shortcut-key">N</span>
            </div>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-action">Save</span>
            <div className="shortcut-keys">
              <span className="shortcut-key">⌘</span>
              <span className="shortcut-key">S</span>
            </div>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-action">Search / Command Palette</span>
            <div className="shortcut-keys">
              <span className="shortcut-key">⌘</span>
              <span className="shortcut-key">K</span>
            </div>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-action">Toggle Sidebar</span>
            <div className="shortcut-keys">
              <span className="shortcut-key">⌘</span>
              <span className="shortcut-key">\</span>
            </div>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-action">Toggle Right Panel</span>
            <div className="shortcut-keys">
              <span className="shortcut-key">⌘</span>
              <span className="shortcut-key">;</span>
            </div>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-action">Sync Notes</span>
            <div className="shortcut-keys">
              <span className="shortcut-key">⌘</span>
              <span className="shortcut-key">Shift</span>
              <span className="shortcut-key">S</span>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="about-section">
          <Icons.FileText className="about-logo" style={{ width: '48px', height: '48px' }} />
          <div className="about-name">Notes App</div>
          <div className="about-version">Version 0.1.0</div>
          <div className="about-links">
            <a href="#" className="about-link">Documentation</a>
            <a href="#" className="about-link">GitHub</a>
            <a href="#" className="about-link">Report Issue</a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
