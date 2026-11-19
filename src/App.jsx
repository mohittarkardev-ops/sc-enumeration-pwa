import React, { useState, useEffect } from 'react';
import LockScreen, { APP_ACCESS_CODE_KEY } from './components/LockScreen';
import Header from './components/Header';
import HouseholdEntry from './components/HouseholdEntry';
import HouseholdListView from './components/HouseholdListView';
import LocationSettingsModal from './components/LocationSettingsModal';
import { db, initDefaultSettings } from './db/db';
import { syncPendingData } from './db/supabase';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return (
      localStorage.getItem(APP_ACCESS_CODE_KEY) === 'true' ||
      sessionStorage.getItem(APP_ACCESS_CODE_KEY) === 'true'
    );
  });

  const [activeSection, setActiveSection] = useState('1');
  const [activeView, setActiveView] = useState('form');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  // Household editing state
  const [editingHousehold, setEditingHousehold] = useState(null);
  const [editingMembers, setEditingMembers] = useState([]);

  const handleLockApp = () => {
    localStorage.removeItem(APP_ACCESS_CODE_KEY);
    sessionStorage.removeItem(APP_ACCESS_CODE_KEY);
    setIsUnlocked(false);
  };

  useEffect(() => {
    initDefaultSettings().then((s) => {
      setSettings(s);
      if (s.active_section) setActiveSection(s.active_section);

      // Auto-sync on startup if online: downloads records AND settings entered on other devices
      if (navigator.onLine) {
        syncPendingData()
          .then((res) => {
            if (res && res.updatedSettings) {
              setSettings(res.updatedSettings);
              if (res.updatedSettings.active_section) {
                setActiveSection(res.updatedSettings.active_section);
              }
            }
          })
          .catch((err) => console.warn('Startup sync notice:', err))
          .finally(() => {
            // Only prompt for settings if ward_village_name is STILL empty after cloud sync
            db.settings.get('active_settings').then((latest) => {
              if (!latest?.ward_village_name) {
                setIsSettingsOpen(true);
              }
            });
          });
      } else {
        if (!s.ward_village_name) {
          setIsSettingsOpen(true);
        }
      }
    });

    // Reactive listener for settings & sections updates across the entire app
    const handleSettingsEvent = (e) => {
      if (e.detail) {
        setSettings(e.detail);
        if (e.detail.active_section) setActiveSection(e.detail.active_section);
      } else {
        db.settings.get('active_settings').then((latest) => {
          if (latest) {
            setSettings(latest);
            if (latest.active_section) setActiveSection(latest.active_section);
          }
        });
      }
    };

    window.addEventListener('census_settings_updated', handleSettingsEvent);
    return () => window.removeEventListener('census_settings_updated', handleSettingsEvent);
  }, []);

  const handleSectionChange = async (section) => {
    setActiveSection(section);
    if (settings) {
      await db.settings.update('active_settings', { active_section: section });
      setSettings((prev) => ({ ...prev, active_section: section }));
    }
  };

  const handleSettingsUpdated = (updated) => {
    setSettings(updated);
  };

  const handleEditHouseholdFromList = (household, members) => {
    setEditingHousehold(household);
    setEditingMembers(members);
    setActiveView('form');
  };

  const handleCancelEditing = () => {
    setEditingHousehold(null);
    setEditingMembers([]);
    setActiveView('list');
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Hind'] select-none">
      <Header
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        activeView={activeView}
        onViewChange={(view) => {
          if (view === 'form' && editingHousehold) {
            handleCancelEditing();
          }
          setActiveView(view);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLockApp={handleLockApp}
        villageName={settings?.ward_village_name}
        sections={settings?.sections || [
          { id: '1', name: 'सेक्शन 1' },
          { id: '2', name: 'सेक्शन 2' },
          { id: '3', name: 'सेक्शन 3' }
        ]}
      />

      <main className="flex-1 overflow-x-hidden">
        {activeView === 'form' ? (
          <HouseholdEntry
            activeSection={activeSection}
            settings={settings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            editingHousehold={editingHousehold}
            editingMembers={editingMembers}
            onCancelEditing={handleCancelEditing}
            onHouseholdSaved={() => {
              setEditingHousehold(null);
              setEditingMembers([]);
              setActiveView('list');
            }}
          />
        ) : (
          <HouseholdListView
            activeSection={activeSection}
            onNewEntry={() => {
              handleCancelEditing();
              setActiveView('form');
            }}
            onEditHousehold={handleEditHouseholdFromList}
          />
        )}
      </main>

      <LocationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={handleSettingsUpdated}
      />
    </div>
  );
}
