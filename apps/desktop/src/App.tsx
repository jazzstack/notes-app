import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { NotePage } from './pages/NotePage';
import { SettingsPage } from './pages/SettingsPage';
import { GraphPage } from './pages/GraphPage';
import { PluginViewManager } from './plugins/viewManager';

export default function App() {
  return (
    <PluginViewManager>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="note/:id" element={<NotePage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </PluginViewManager>
  );
}
