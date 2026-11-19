import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HouseholdEntry from './components/HouseholdEntry';
import HouseholdListView from './components/HouseholdListView';
import LocationSettingsModal from './components/LocationSettingsModal';
import { db, initDefaultSettings } from './db/db';

export default function App() {
  const [activeSection, setActiveSection] = useState('1');
  const [activeView, setActiveView] = useState('form');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  // Household editing state
  const [editingHousehold, setEditingHousehold] = useState(null);
  const [editingMembers, setEditingMembers] = useState([]);

  useEffect(() => {
    initDefaultSettings().then((s) => {
      setSettings(s);
      if (s.active_section) setActiveSection(s.active_section);
      if (!s.ward_village_name) {
        setIsSettingsOpen(true);
      }
    });
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
  };

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
        villageName={settings?.ward_village_name}
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
