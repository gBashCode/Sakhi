import Dexie, { type Table } from 'dexie';

export interface DBPatient {
  id: string;
  name: string;
  age?: string;
  pregnancyMonth?: string;
  symptoms?: string;
  vaccination?: string;
  risk?: 'low' | 'medium' | 'high';
  recommendation?: string;
  createdAt?: number;
  synced: number; // 0 = unsynced, 1 = synced
}

export interface DBVisit {
  id?: number;         // auto-increment PK
  clientId: string;    // UUID assigned offline for dedup
  patientId: string;
  bpSys?: number;      // systolic BP
  riskLevel?: string;  // 'low' | 'medium' | 'high'
  deviceTs: number;    // timestamp from device at entry time
  synced: number;      // 0 = unsynced, 1 = synced
  [key: string]: unknown; // allow arbitrary visit fields
}

export interface DBMeta {
  key: string;
  value: unknown;
}

class SakhiDB extends Dexie {
  patients!: Table<DBPatient, string>;
  visits!: Table<DBVisit, number>;
  meta!: Table<DBMeta, string>;

  constructor() {
    super('SakhiAI');
    this.version(1).stores({
      patients: '++id, name',
      visits:   '++id, clientId, patientId, bpSys, riskLevel, deviceTs, synced',
      meta:     'key',
    });
  }
}

export const db = new SakhiDB();
