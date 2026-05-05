import { get, set, del, keys, entries } from 'idb-keyval';

export interface Project {
  id: string;
  name: string;
  surveyName: string;
  location: string;
  client: string;
  date: string;
  createdAt: number;
  updatedAt: number;
}

export type EquipmentType =
  | 'SWITCHGEAR'
  | 'SWITCHBOARD'
  | 'PANEL'
  | 'TRANSFORMER'
  | 'DISCONNECT_SWITCH'
  | 'ENCLOSED_CIRCUIT_BREAKER'
  | 'MOTOR_CONTROL_CENTER'
  | 'VARIABLE_FREQUENCY_DRIVE'
  | 'MOTOR'
  | 'GENERATOR'
  | 'AUTOMATIC_TRANSFER_SWITCH'
  | 'UNINTERRUPTIBLE_POWER_SUPPLY'
  | 'UNKNOWN_EQUIPMENT';

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  SWITCHGEAR: 'Switchgear',
  SWITCHBOARD: 'Switchboard',
  PANEL: 'Panel',
  TRANSFORMER: 'Transformer',
  DISCONNECT_SWITCH: 'Disconnect Switch',
  ENCLOSED_CIRCUIT_BREAKER: 'Enclosed Circuit Breaker',
  MOTOR_CONTROL_CENTER: 'Motor Control Center',
  VARIABLE_FREQUENCY_DRIVE: 'Variable Frequency Drive',
  MOTOR: 'Motor',
  GENERATOR: 'Generator',
  AUTOMATIC_TRANSFER_SWITCH: 'Automatic Transfer Switch',
  UNINTERRUPTIBLE_POWER_SUPPLY: 'Uninterruptible Power Supply',
  UNKNOWN_EQUIPMENT: 'Unknown Equipment',
};

export interface EquipmentEntry {
  id: string;
  projectId: string;
  type: EquipmentType;
  data: Record<string, string>;
  photos: string[];
  createdAt: number;
  updatedAt: number;
}

export class DuplicateEquipmentNameError extends Error {
  constructor(name: string) {
    super(`Equipment name "${name}" already exists in this project.`);
    this.name = 'DuplicateEquipmentNameError';
  }
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const PROJECT_PREFIX = 'project_';
const ENTRY_PREFIX = 'entry_';
const PHOTO_PREFIX = 'photo_';

function normalizeEquipmentName(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

async function assertUniqueEquipmentName(
  projectId: string,
  data: Record<string, string>,
  excludeEntryId?: string
): Promise<void> {
  const incomingName = normalizeEquipmentName(data.name);
  if (!incomingName) return;

  const allEntries = await getEntriesByProject(projectId);
  const duplicate = allEntries.find(
    (entry) => entry.id !== excludeEntryId && normalizeEquipmentName(entry.data.name) === incomingName
  );

  if (duplicate) {
    throw new DuplicateEquipmentNameError(data.name.trim());
  }
}

export async function createProject(p: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const project: Project = {
    ...p,
    id: genId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await set(PROJECT_PREFIX + project.id, project);
  return project;
}

export async function getProjects(): Promise<Project[]> {
  const allKeys = await keys();
  const projectKeys = allKeys.filter((k) => String(k).startsWith(PROJECT_PREFIX));
  const projects: Project[] = [];
  for (const k of projectKeys) {
    const p = await get(k);
    if (p) projects.push(p as Project);
  }
  return projects.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getProject(id: string): Promise<Project | undefined> {
  return get(PROJECT_PREFIX + id);
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const p = await getProject(id);
  if (!p) return;
  await set(PROJECT_PREFIX + id, { ...p, ...updates, updatedAt: Date.now() });
}

export async function deleteProject(id: string): Promise<void> {
  const allEntries = await getEntriesByProject(id);
  for (const entry of allEntries) {
    for (const photoId of entry.photos) {
      await del(PHOTO_PREFIX + photoId);
    }
    await del(ENTRY_PREFIX + entry.id);
  }
  await del(PROJECT_PREFIX + id);
}

export async function createEntry(
  projectId: string,
  type: EquipmentType,
  data: Record<string, string>,
  photoBlobs: Blob[],
  options?: { skipUniqueCheck?: boolean }
): Promise<EquipmentEntry> {
  if (!options?.skipUniqueCheck) {
    await assertUniqueEquipmentName(projectId, data);
  }

  const photoIds: string[] = [];
  for (const blob of photoBlobs) {
    const pid = genId();
    await set(PHOTO_PREFIX + pid, blob);
    photoIds.push(pid);
  }
  const entry: EquipmentEntry = {
    id: genId(),
    projectId,
    type,
    data,
    photos: photoIds,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await set(ENTRY_PREFIX + entry.id, entry);
  return entry;
}

export async function getEntriesByProject(projectId: string): Promise<EquipmentEntry[]> {
  const allKeys = await keys();
  const entryKeys = allKeys.filter((k) => String(k).startsWith(ENTRY_PREFIX));
  const result: EquipmentEntry[] = [];
  for (const k of entryKeys) {
    const e = await get(k);
    if (e && (e as EquipmentEntry).projectId === projectId) {
      result.push(e as EquipmentEntry);
    }
  }
  return result.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getEntry(id: string): Promise<EquipmentEntry | undefined> {
  return get(ENTRY_PREFIX + id);
}

export async function updateEntry(id: string, data: Record<string, string>, newPhotos?: Blob[]): Promise<void> {
  const e = await getEntry(id);
  if (!e) return;
  await assertUniqueEquipmentName(e.projectId, data, id);
  const photoIds = [...e.photos];
  if (newPhotos) {
    for (const blob of newPhotos) {
      const pid = genId();
      await set(PHOTO_PREFIX + pid, blob);
      photoIds.push(pid);
    }
  }
  await set(ENTRY_PREFIX + id, { ...e, data, photos: photoIds, updatedAt: Date.now() });
}

export async function deleteEntry(id: string): Promise<void> {
  const e = await getEntry(id);
  if (!e) return;
  for (const pid of e.photos) {
    await del(PHOTO_PREFIX + pid);
  }
  await del(ENTRY_PREFIX + id);
}

export async function deletePhoto(entryId: string, photoId: string): Promise<void> {
  const e = await getEntry(entryId);
  if (!e) return;
  await del(PHOTO_PREFIX + photoId);
  const photos = e.photos.filter((p) => p !== photoId);
  await set(ENTRY_PREFIX + entryId, { ...e, photos, updatedAt: Date.now() });
}

export async function getPhoto(photoId: string): Promise<Blob | undefined> {
  return get(PHOTO_PREFIX + photoId);
}

export async function getProjectStats(projectId: string): Promise<Record<EquipmentType, number>> {
  const allEntries = await getEntriesByProject(projectId);
  const stats: Record<string, number> = {};
  for (const t of Object.keys(EQUIPMENT_LABELS)) {
    stats[t] = 0;
  }
  for (const e of allEntries) {
    stats[e.type] = (stats[e.type] || 0) + 1;
  }
  return stats as Record<EquipmentType, number>;
}
