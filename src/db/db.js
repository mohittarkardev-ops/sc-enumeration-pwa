import Dexie from 'dexie';

export const db = new Dexie('CensusEnumerationDB');

db.version(1).stores({
  settings: 'id',
  households: 'local_id, village_section, building_no, census_house_no, household_no, sync_status, status, created_at',
  members: 'local_id, household_local_id, serial_no, sync_status, created_at'
});

// Default initial settings configured for Mathura, UP
export const initDefaultSettings = async () => {
  const current = await db.settings.get('active_settings');
  if (!current) {
    const defaultSettings = {
      id: 'active_settings',
      enumerator_id: 'ENUM-001',
      enumerator_name: 'प्रगणक',
      state_name: 'उत्तर प्रदेश (Uttar Pradesh)',
      district_name: 'मथुरा (Mathura)',
      tehsil_block: 'मथुरा (Mathura)',
      ward_village_name: '',
      village_code: '',
      enumeration_block_no: '001',
      active_section: '1',
      last_building_no: '001',
      last_census_house_no: '001',
      last_household_no: '001'
    };
    await db.settings.put(defaultSettings);
    return defaultSettings;
  }
  return current;
};
