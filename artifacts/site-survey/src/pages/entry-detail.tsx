import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { DuplicateEquipmentNameError, getEntry, updateEntry, deletePhoto, getPhoto, type EquipmentEntry, EQUIPMENT_LABELS } from '@/lib/db';
import { getSections } from '@/lib/equipment-fields';
import { ArrowLeft, Camera, X, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import EquipmentIcon from '@/components/equipment-icon';

export default function EntryDetail() {
  const params = useParams<{ id: string; entryId: string }>();
  const [, navigate] = useLocation();
  const [entry, setEntry] = useState<EquipmentEntry | null>(null);
  const [data, setData] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<{ id: string; url: string }[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ blob: Blob; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['all']));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const entriesTabKey = `project-tab:${params.id}`;

  useEffect(() => {
    loadEntry();
  }, [params.entryId]);

  async function loadEntry() {
    setLoading(true);
    const e = await getEntry(params.entryId!);
    if (!e) {
      sessionStorage.setItem(entriesTabKey, 'entries');
      navigate(`/project/${params.id}`);
      return;
    }
    setEntry(e);
    setData(e.data);
    const urls: { id: string; url: string }[] = [];
    for (const pid of e.photos) {
      const blob = await getPhoto(pid);
      if (blob) {
        urls.push({ id: pid, url: URL.createObjectURL(blob) });
      }
    }
    setPhotoUrls(urls);
    setLoading(false);
  }

  function handleChange(name: string, value: string) {
    setData((prev) => ({ ...prev, [name]: value }));
    if (name === 'name' && nameError) setNameError('');
  }

  function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const added: { blob: Blob; url: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      added.push({ blob: files[i], url: URL.createObjectURL(files[i]) });
    }
    setNewPhotos((prev) => [...prev, ...added]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDeletePhoto(photoId: string) {
    await deletePhoto(params.entryId!, photoId);
    setPhotoUrls((prev) => prev.filter((p) => p.id !== photoId));
  }

  function removeNewPhoto(index: number) {
    setNewPhotos((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateEntry(params.entryId!, data, newPhotos.length > 0 ? newPhotos.map((p) => p.blob) : undefined);
      toast({
        title: 'Entry updated',
        description: 'Changes saved successfully.',
      });
      sessionStorage.setItem(entriesTabKey, 'entries');
      navigate(`/project/${params.id}`);
    } catch (err) {
      console.error(err);
      if (err instanceof DuplicateEquipmentNameError) {
        setNameError('This equipment name already exists in this project. Please use a unique name.');
        toast({
          variant: 'destructive',
          title: 'Duplicate equipment name',
          description: 'Use a unique equipment name in this project.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Update failed',
          description: 'Please try again.',
        });
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleSection(section: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  const isSectionExpanded = (section: string) => expandedSections.has('all') || expandedSections.has(section);

  if (loading || !entry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const sections = getSections(entry.type, data);
  const requiredFields = sections.flatMap((s) => s.fields).filter((f) => f.required);
  const completedRequired = requiredFields.filter((f) => data[f.name]?.trim()).length;
  const progressPct = requiredFields.length > 0 ? Math.round((completedRequired / requiredFields.length) * 100) : 100;
  const hasRequiredEmpty = requiredFields.some((f) => !data[f.name]?.trim());

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => {
              sessionStorage.setItem(entriesTabKey, 'entries');
              navigate(`/project/${params.id}`);
            }}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <EquipmentIcon
                  type={entry.type}
                  className="text-lg leading-none"
                  imageClassName="h-8 w-8 rounded-md object-contain object-center"
                />
              </span>
              {data['name'] || 'Unnamed Entry'}
            </h1>
            <p className="text-xs text-muted-foreground">{EQUIPMENT_LABELS[entry.type]}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Update'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4 pb-28 md:pb-6">
        <div className="sticky top-[76px] z-40 bg-card/95 backdrop-blur rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Form completion</span>
            <span className="font-medium text-foreground">{completedRequired}/{requiredFields.length} required fields</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {sections.map(({ section, fields }) => (
          <div key={section} className="bg-card rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => toggleSection(section)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-foreground">{section}</h3>
              {isSectionExpanded(section) ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {isSectionExpanded(section) && (
              <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {field.label}
                      {field.required ? (
                        <span className="text-destructive ml-1">*</span>
                      ) : (
                        <span className="text-muted-foreground ml-1.5 text-xs font-normal">(Optional)</span>
                      )}
                    </label>
                    {field.type === 'dropdown' ? (
                      <select
                        value={data[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                      >
                        <option value="">Select...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        min="0"
                        value={data[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        placeholder="0"
                      />
                    ) : (
                      <input
                        type="text"
                        value={data[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 transition-all ${field.name === 'name' && nameError ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : 'border-input focus:ring-primary/30 focus:border-primary'}`}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                    {field.name === 'name' && nameError && (
                      <p className="text-xs text-destructive mt-1.5">{nameError}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Photos</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handlePhotoAdd}
              className="hidden"
            />
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photoUrls.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                  <img src={photo.url} alt="Equipment photo" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {newPhotos.map((photo, i) => (
                <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/30 group">
                  <img src={photo.url} alt={`New photo ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-medium">NEW</div>
                  <button
                    onClick={() => removeNewPhoto(i)}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-medium">Add Photo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pb-6">
          <button
            onClick={handleSave}
            disabled={saving || hasRequiredEmpty || !!nameError}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Updating Entry...' : 'Update Entry'}
          </button>
          {hasRequiredEmpty && (
            <p className="text-xs text-destructive mt-2 text-center">Please fill in all required fields marked with *</p>
          )}
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur p-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-medium"
          >
            Add Photo
          </button>
          <button
            onClick={handleSave}
            disabled={saving || hasRequiredEmpty || !!nameError}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-sm disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Update Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
