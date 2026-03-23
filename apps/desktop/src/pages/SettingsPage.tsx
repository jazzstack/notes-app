import { useAppStore } from '../store/appStore';
import { useNotesStore } from '../store/notesStore';
import { useTheme } from '@notes-app/ui';
import { Icons } from '@notes-app/ui';
import { useState } from 'react';

export function SettingsPage() {
  const { settings, updateSettings } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { vaultPath, vaultInitialized, selectVault } = useNotesStore();
  const [customCSS, setCustomCSS] = useState('');

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleSelectVault = async () => {
    await selectVault();
  };

  return (
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
        <h2 className="settings-section-title">Sync</h2>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-label">Enable Sync</div>
            <div className="settings-item-description">
              Sync your notes across devices
            </div>
          </div>
          <div className="settings-item-control">
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.syncEnabled}
                onChange={(e) => updateSettings({ syncEnabled: e.target.checked })}
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
  );
}
