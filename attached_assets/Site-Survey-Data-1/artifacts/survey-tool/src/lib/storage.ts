import type { SurveySession } from "../types/survey";
import { deletePhotos, getAllPhotoIds } from "./indexeddb";

const SESSIONS_KEY = "elecsurvey_sessions";
const CURRENT_KEY = "elecsurvey_current";

type SerializableSession = Omit<SurveySession, "equipment"> & {
  equipment: Array<Omit<SurveySession["equipment"][0], "photos"> & {
    photos: Array<Omit<SurveySession["equipment"][0]["photos"][0], "preview">>;
  }>;
};

export function saveSessions(sessions: SurveySession[]): void {
  const serializable: SerializableSession[] = sessions.map(session => ({
    ...session,
    equipment: session.equipment.map(eq => ({
      ...eq,
      photos: eq.photos.map(p => ({
        id: p.id,
        label: p.label,
        originalName: p.originalName,
        sequentialName: p.sequentialName,
        fileType: p.fileType,
        fileSize: p.fileSize,
        preview: "",
      })),
    })),
  }));
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(serializable));
  } catch {
    console.warn("localStorage quota exceeded, some data may not be saved");
  }
}

export function loadSessions(): SurveySession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SurveySession[];
  } catch {
    return [];
  }
}

export function saveCurrentIndex(index: number): void {
  localStorage.setItem(CURRENT_KEY, String(index));
}

export function loadCurrentIndex(): number {
  const raw = localStorage.getItem(CURRENT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export async function cleanupOrphanedPhotos(sessions: SurveySession[]): Promise<void> {
  const allStoredIds = await getAllPhotoIds();
  const usedIds = new Set<string>();
  for (const session of sessions) {
    for (const eq of session.equipment) {
      for (const photo of eq.photos) usedIds.add(photo.id);
    }
  }
  const orphaned = allStoredIds.filter(id => !usedIds.has(id));
  if (orphaned.length > 0) await deletePhotos(orphaned);
}
