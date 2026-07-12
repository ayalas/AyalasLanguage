import './tabs.css';
import { useNavigate } from 'react-router-dom';

export interface Tab {
  id: number;
  label: string;
  path: string;
}

export function TabLinksComponent({tabData, activeTab}: {tabData: Tab[], activeTab?: number}) {
  const navigate = useNavigate();

  return (
    <div className="tabs-container">
      {/* Tab Headers */}
      <div className="tab-list" role="tablist">
        {tabData.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => activeTab !== tab.id && navigate(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};