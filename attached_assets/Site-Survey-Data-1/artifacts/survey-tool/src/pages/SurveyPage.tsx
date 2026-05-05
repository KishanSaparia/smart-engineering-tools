import { useState, useEffect, useCallback } from "react";
import type { SurveySession, SurveyHeader, EquipmentData } from "../types/survey";
import { EquipmentForm } from "../components/EquipmentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { saveSessions, loadSessions, saveCurrentIndex, loadCurrentIndex } from "../lib/storage";
import { exportToExcel, exportPhotosAsZip } from "../lib/excel-export";
import { EQUIPMENT_LABELS, EQUIPMENT_ABBREV, EQUIPMENT_TYPES } from "../lib/equipment-config";
import { deletePhotos } from "../lib/indexeddb";
import type { EquipmentType } from "../types/survey";

const DEFAULT_HEADER: SurveyHeader = {
  date: new Date().toISOString().slice(0, 10),
  surveyorName: "",
  projectName: "",
  projectNumber: "",
  client: "",
  location: "",
  notes: "",
};

function createNewSession(): SurveySession {
  return {
    id: crypto.randomUUID(),
    header: { ...DEFAULT_HEADER, date: new Date().toISOString().slice(0, 10) },
    equipment: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const TYPE_COLORS: Record<string, string> = {
  switchgear: "bg-blue-100 text-blue-800 border-blue-200",
  switchboard: "bg-indigo-100 text-indigo-800 border-indigo-200",
  panelboard: "bg-violet-100 text-violet-800 border-violet-200",
  distributionswitch: "bg-purple-100 text-purple-800 border-purple-200",
  mcc: "bg-sky-100 text-sky-800 border-sky-200",
  vfd: "bg-cyan-100 text-cyan-800 border-cyan-200",
  transformer: "bg-teal-100 text-teal-800 border-teal-200",
  generator: "bg-green-100 text-green-800 border-green-200",
  ats: "bg-amber-100 text-amber-800 border-amber-200",
  ups: "bg-orange-100 text-orange-800 border-orange-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export function SurveyPage() {
  const [sessions, setSessions] = useState<SurveySession[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [view, setView] = useState<"header" | "equipment" | "summary">("header");
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentData | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [exportingZip, setExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMsg, setExportMsg] = useState("");
  const [saved, setSaved] = useState(false);
  const [filterType, setFilterType] = useState<EquipmentType | "all">("all");

  useEffect(() => {
    const stored = loadSessions();
    const idx = loadCurrentIndex();
    if (stored.length > 0) {
      setSessions(stored);
      setCurrentIdx(Math.min(idx, stored.length - 1));
    } else {
      const fresh = createNewSession();
      setSessions([fresh]);
      setCurrentIdx(0);
    }
  }, []);

  const currentSession = sessions[currentIdx];

  const persist = useCallback((updated: SurveySession[]) => {
    setSessions(updated);
    saveSessions(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const updateHeader = (field: keyof SurveyHeader, value: string) => {
    const updated = sessions.map((s, i) =>
      i !== currentIdx ? s : { ...s, header: { ...s.header, [field]: value }, updatedAt: new Date().toISOString() }
    );
    persist(updated);
  };

  const handleSaveEquipment = (data: EquipmentData) => {
    let updated: SurveySession[];
    if (editingIdx !== null) {
      updated = sessions.map((s, i) =>
        i !== currentIdx ? s : {
          ...s,
          equipment: s.equipment.map((eq, j) => j === editingIdx ? data : eq),
          updatedAt: new Date().toISOString(),
        }
      );
    } else {
      updated = sessions.map((s, i) =>
        i !== currentIdx ? s : {
          ...s,
          equipment: [...s.equipment, data],
          updatedAt: new Date().toISOString(),
        }
      );
    }
    persist(updated);
    setShowForm(false);
    setEditingEquipment(null);
    setEditingIdx(null);
    setView("equipment");
  };

  const handleDeleteEquipment = async (idx: number) => {
    const eq = currentSession.equipment[idx];
    const photoIds = eq.photos.map(p => p.id);
    await deletePhotos(photoIds);
    const updated = sessions.map((s, i) =>
      i !== currentIdx ? s : {
        ...s,
        equipment: s.equipment.filter((_, j) => j !== idx),
        updatedAt: new Date().toISOString(),
      }
    );
    persist(updated);
  };

  const handleEditEquipment = (eq: EquipmentData, idx: number) => {
    setEditingEquipment(eq);
    setEditingIdx(idx);
    setShowForm(true);
  };

  const handleNewProject = () => {
    const fresh = createNewSession();
    const updated = [...sessions, fresh];
    setSessions(updated);
    const newIdx = updated.length - 1;
    setCurrentIdx(newIdx);
    saveCurrentIndex(newIdx);
    saveSessions(updated);
    setView("header");
    setShowForm(false);
    setFilterType("all");
  };

  const handleExportExcel = async () => {
    await exportToExcel(currentSession);
  };

  const handleExportZip = async () => {
    setExportingZip(true);
    setExportProgress(0);
    await exportPhotosAsZip(currentSession, (pct, msg) => {
      setExportProgress(pct);
      setExportMsg(msg);
    });
    setExportingZip(false);
  };

  const filteredEquipment = currentSession?.equipment.filter(
    eq => filterType === "all" || eq.type === filterType
  ) || [];

  const equipmentCounts = currentSession?.equipment.reduce((acc, eq) => {
    acc[eq.type] = (acc[eq.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalPhotos = currentSession?.equipment.reduce((s, eq) => s + eq.photos.length, 0) || 0;

  if (!currentSession) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-base">
                ⚡
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-foreground text-sm leading-none">ElecSurvey Pro</h1>
                  {saved && <span className="text-xs text-green-600 font-medium animate-pulse">✓ Saved</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {currentSession.header.projectName || "New Project"}
                  {currentSession.header.projectNumber ? ` · ${currentSession.header.projectNumber}` : ""}
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              {(["header", "equipment", "summary"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); if (v !== "equipment") setShowForm(false); }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {v === "header" ? "Project Info" : v === "equipment" ? `Equipment (${currentSession.equipment.length})` : "Export"}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleNewProject}
                className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
              >
                + New Project
              </button>
              {sessions.length > 1 && (
                <select
                  className="text-xs border border-border rounded-md px-2 py-1.5 bg-card text-foreground max-w-44"
                  value={currentIdx}
                  onChange={e => {
                    const idx = parseInt(e.target.value);
                    setCurrentIdx(idx);
                    saveCurrentIndex(idx);
                    setShowForm(false);
                    setFilterType("all");
                  }}
                >
                  {sessions.map((s, i) => (
                    <option key={s.id} value={i}>
                      {s.header.projectName || `Project ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">

        {/* PROJECT INFO */}
        {view === "header" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Project Information</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Enter project details before collecting equipment data.</p>
              </div>
              <Button onClick={() => setView("equipment")} disabled={!currentSession.header.projectName.trim()}>
                Start Survey →
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {([
                    { label: "Project Name", field: "projectName", required: true, placeholder: "e.g. ACME Factory Expansion" },
                    { label: "Project Number", field: "projectNumber", placeholder: "e.g. PRJ-2025-001" },
                    { label: "Client / Owner", field: "client", placeholder: "e.g. ACME Industries" },
                    { label: "Site Location", field: "location", placeholder: "e.g. Plant B, Level 2" },
                  ] as { label: string; field: keyof SurveyHeader; required?: boolean; placeholder: string }[]).map(({ label, field, required, placeholder }) => (
                    <div key={field} className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {label}{required && <span className="text-destructive ml-0.5">*</span>}
                      </Label>
                      <Input
                        value={currentSession.header[field]}
                        onChange={e => updateHeader(field, e.target.value)}
                        placeholder={placeholder}
                        className="h-9 text-sm"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Survey Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Survey Date</Label>
                    <Input type="date" value={currentSession.header.date} onChange={e => updateHeader("date", e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Surveyor Name</Label>
                    <Input value={currentSession.header.surveyorName} onChange={e => updateHeader("surveyorName", e.target.value)} placeholder="e.g. John Smith, PE" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</Label>
                    <Textarea
                      value={currentSession.header.notes}
                      onChange={e => updateHeader("notes", e.target.value)}
                      placeholder="Project scope, access restrictions, safety notes..."
                      rows={4}
                      className="text-sm resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* EQUIPMENT LIST */}
        {view === "equipment" && !showForm && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Equipment Survey</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {currentSession.header.projectName || "No project name"} · {currentSession.equipment.length} equipment · {totalPhotos} photos
                </p>
              </div>
              <Button onClick={() => { setEditingEquipment(null); setEditingIdx(null); setShowForm(true); }}>
                + Add Equipment
              </Button>
            </div>

            {currentSession.equipment.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${filterType === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                >
                  All ({currentSession.equipment.length})
                </button>
                {Object.entries(equipmentCounts).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type as EquipmentType)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${filterType === type ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                  >
                    {EQUIPMENT_ABBREV[type as EquipmentType] || type} ({count})
                  </button>
                ))}
              </div>
            )}

            {filteredEquipment.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="text-6xl">📋</div>
                <div>
                  <p className="font-semibold text-foreground">No equipment recorded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first piece of equipment to begin the survey.</p>
                </div>
                <Button onClick={() => { setEditingEquipment(null); setEditingIdx(null); setShowForm(true); }}>
                  + Add First Equipment
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEquipment.map((eq) => {
                  const globalIdx = currentSession.equipment.indexOf(eq);
                  const typeInfo = EQUIPMENT_TYPES.find(t => t.type === eq.type);
                  const colorClass = TYPE_COLORS[eq.type] || TYPE_COLORS.other;
                  return (
                    <Card key={eq.id} className="group hover:shadow-md transition-shadow border border-border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${colorClass}`}>
                                {EQUIPMENT_ABBREV[eq.type]}
                              </span>
                              {eq.condition && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  eq.condition === "Good" || eq.condition === "Excellent" ? "text-green-700 bg-green-50" :
                                  eq.condition === "Fair" ? "text-amber-700 bg-amber-50" :
                                  eq.condition === "Poor" || eq.condition === "Critical" ? "text-red-700 bg-red-50" :
                                  "text-muted-foreground bg-muted"
                                }`}>
                                  {eq.condition}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-foreground mt-1.5 text-sm leading-tight">
                              {eq.equipmentName || <span className="text-muted-foreground italic">No name</span>}
                            </h3>
                            {eq.location && <p className="text-xs text-muted-foreground mt-0.5 truncate">📍 {eq.location}</p>}
                          </div>
                          <span className="text-xl shrink-0">{typeInfo?.icon}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          {eq.manufacturer && (
                            <div className="text-xs text-muted-foreground truncate">
                              <span className="font-medium text-foreground/70">Mfr:</span> {eq.manufacturer}
                            </div>
                          )}
                          {eq.tagNumber && (
                            <div className="text-xs text-muted-foreground truncate">
                              <span className="font-medium text-foreground/70">Tag:</span> {eq.tagNumber}
                            </div>
                          )}
                          {eq.fedFrom && (
                            <div className="text-xs text-muted-foreground truncate col-span-2">
                              <span className="font-medium text-foreground/70">Fed From:</span> {eq.fedFrom}
                            </div>
                          )}
                        </div>

                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {eq.photos.length > 0 ? `📸 ${eq.photos.length} photo${eq.photos.length !== 1 ? "s" : ""}` : "No photos"}
                          </span>
                          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditEquipment(eq, globalIdx)} className="text-xs text-primary hover:underline font-medium">
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${eq.equipmentName || "this equipment"}"?`)) {
                                  void handleDeleteEquipment(globalIdx);
                                }
                              }}
                              className="text-xs text-destructive hover:underline font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* EQUIPMENT FORM */}
        {view === "equipment" && showForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {editingEquipment ? "Edit Equipment" : "Add Equipment"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowForm(false); setEditingEquipment(null); setEditingIdx(null); }}
              >
                ✕ Cancel
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <EquipmentForm
                  initialData={editingEquipment || undefined}
                  onSave={handleSaveEquipment}
                  onCancel={() => { setShowForm(false); setEditingEquipment(null); setEditingIdx(null); }}
                  editMode={!!editingEquipment}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* EXPORT / SUMMARY */}
        {view === "summary" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Export Survey Data</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Generate an Excel report and photo archive from your collected data.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Survey Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{currentSession.equipment.length}</div>
                      <div className="text-xs text-muted-foreground mt-1">Equipment Items</div>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{totalPhotos}</div>
                      <div className="text-xs text-muted-foreground mt-1">Total Photos</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {Object.entries(equipmentCounts).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${TYPE_COLORS[type] || TYPE_COLORS.other}`}>
                            {EQUIPMENT_ABBREV[type as EquipmentType]}
                          </span>
                          <span className="text-xs text-muted-foreground">{EQUIPMENT_LABELS[type as EquipmentType]}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{count}</span>
                      </div>
                    ))}
                    {currentSession.equipment.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No equipment recorded yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Download Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border p-4 space-y-3 hover:bg-accent/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Excel Report (.xlsx)</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Separate sheets per equipment type. Column headers match form fields exactly. Includes survey info summary sheet.
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleExportExcel} disabled={currentSession.equipment.length === 0} className="w-full">
                      Download Excel Report
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border p-4 space-y-3 hover:bg-accent/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🗜️</span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Photos Archive (.zip)</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Structure: <code className="font-mono text-[10px] bg-muted px-1 rounded">Project/Photos/TYPE/EquipName/EquipName_01.jpg</code>
                        </p>
                      </div>
                    </div>
                    {exportingZip && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{exportMsg}</span>
                          <span>{exportProgress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={handleExportZip}
                      disabled={totalPhotos === 0 || exportingZip}
                      variant="outline"
                      className="w-full"
                    >
                      {exportingZip ? "Packaging..." : `Download Photos ZIP (${totalPhotos} photos)`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {([
                    { label: "Project Name", value: currentSession.header.projectName },
                    { label: "Project Number", value: currentSession.header.projectNumber },
                    { label: "Client", value: currentSession.header.client },
                    { label: "Date", value: currentSession.header.date },
                    { label: "Surveyor", value: currentSession.header.surveyorName },
                    { label: "Location", value: currentSession.header.location },
                  ] as { label: string; value: string }[]).map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground font-medium">{label}</dt>
                      <dd className="font-semibold text-foreground mt-0.5">{value || "—"}</dd>
                    </div>
                  ))}
                </dl>
                {currentSession.header.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">Notes</p>
                    <p className="text-sm text-foreground leading-relaxed">{currentSession.header.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>ElecSurvey Pro — Offline Electrical Field Survey Tool</span>
          <span>All data stored locally in your browser · Works offline</span>
        </div>
      </footer>
    </div>
  );
}
