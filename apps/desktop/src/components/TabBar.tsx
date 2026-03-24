import { useTabsStore, Tab } from '../store/tabsStore';
import { Icons } from '@notes-app/ui';

interface TabBarProps {
  onTabClose: (noteId: string) => void;
}

export function TabBar({ onTabClose }: TabBarProps) {
  const { tabs, setActiveTab } = useTabsStore();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            onActivate={() => setActiveTab(tab.noteId)}
            onClose={() => onTabClose(tab.noteId)}
          />
        ))}
      </div>
    </div>
  );
}

interface TabItemProps {
  tab: Tab;
  onActivate: () => void;
  onClose: () => void;
}

function TabItem({ tab, onActivate, onClose }: TabItemProps) {
  return (
    <div
      className={`tab-item ${tab.isActive ? 'active' : ''}`}
      onClick={onActivate}
    >
      <span className="tab-title">{tab.title || 'Untitled'}</span>
      <button
        className="tab-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <Icons.X style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}
