import { useState, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'wouter';
import { getProject, getEntriesByProject, deleteEntry, type Project, type EquipmentEntry, type EquipmentType, EQUIPMENT_LABELS } from '@/lib/db';
import { ArrowLeft, Plus, FileSpreadsheet, Trash2, ChevronRight, Camera, ClipboardList, Search, X, Filter } from 'lucide-react';
import { EQUIPMENT_META, getEquipmentCompletion } from '@/lib/equipment-meta';
import { toast } from '@/hooks/use-toast';
import EquipmentIcon from '@/components/equipment-icon';

export default function ProjectDetail() {
  const PAGE_SIZE = 75;
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [entries, setEntries] = useState<EquipmentEntry[]>([]);
  const [stats, setStats] = useState<Record<EquipmentType, number> | null>(null);
  const [activeTab, setActiveTab] = useState<'entries' | 'add'>('add');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | ''>('');
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState<'All' | 'Power' | 'Control' | 'Mechanical' | 'Other'>('All');
  const [entriesPage, setEntriesPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [params.id]);

  useEffect(() => {
    const tab = sessionStorage.getItem(`project-tab:${params.id}`);
    if (tab === 'entries') {
      setActiveTab('entries');
    }
    sessionStorage.removeItem(`project-tab:${params.id}`);
  }, [params.id]);

  useEffect(() => {
    setEntriesPage(1);
  }, [search, typeFilter]);

  async function loadData() {
    setLoading(true);
    const p = await getProject(params.id!);
    if (!p) {
      navigate('/home');
      return;
    }
    setProject(p);
    const e = await getEntriesByProject(params.id!);
    setEntries(e);
    const calculatedStats = (Object.keys(EQUIPMENT_LABELS) as EquipmentType[]).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<EquipmentType, number>);
    for (const entry of e) {
      calculatedStats[entry.type] = (calculatedStats[entry.type] || 0) + 1;
    }
    setStats(calculatedStats);
    setLoading(false);
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    await deleteEntry(entryId);
    await loadData();
    toast({
      title: 'Entry deleted',
      description: 'Equipment entry removed successfully.',
    });
  }

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchType = !typeFilter || entry.type === typeFilter;
      if (!matchType) return false;
      if (!q) return true;
      const name = (entry.data['name'] || '').toLowerCase();
      const fedFrom = (entry.data['fedFrom'] || entry.data['fedFromN'] || '').toLowerCase();
      const typeLabel = EQUIPMENT_LABELS[entry.type].toLowerCase();
      return name.includes(q) || fedFrom.includes(q) || typeLabel.includes(q);
    });
  }, [entries, search, typeFilter]);

  const totalEntryPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const pagedEntries = useMemo(() => {
    const start = (entriesPage - 1) * PAGE_SIZE;
    return filteredEntries.slice(start, start + PAGE_SIZE);
  }, [filteredEntries, entriesPage]);

  useEffect(() => {
    if (entriesPage > totalEntryPages) {
      setEntriesPage(totalEntryPages);
    }
  }, [entriesPage, totalEntryPages]);

  const equipmentTypeList = useMemo(() => {
    const q = equipmentSearch.trim().toLowerCase();
    return (Object.keys(EQUIPMENT_LABELS) as EquipmentType[]).filter((type) => {
      const meta = EQUIPMENT_META[type];
      if (equipmentCategory !== 'All' && meta.category !== equipmentCategory) return false;
      if (!q) return true;
      return (
        EQUIPMENT_LABELS[type].toLowerCase().includes(q) ||
        meta.hint.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q)
      );
    });
  }, [equipmentSearch, equipmentCategory]);

  const mostUsedTypes = useMemo(() => {
    if (!stats) return [] as EquipmentType[];
    return (Object.keys(EQUIPMENT_LABELS) as EquipmentType[])
      .filter((type) => (stats[type] || 0) > 0)
      .sort((a, b) => (stats[b] || 0) - (stats[a] || 0))
      .slice(0, 4);
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const totalEntries = entries.length;
  const totalPhotos = entries.reduce((sum, e) => sum + e.photos.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('/home')} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{project.name}</h1>
              <p className="text-xs text-muted-foreground">{project.location} {project.client && `- ${project.client}`}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'add' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Add Equipment
              </span>
            </button>
            <button
              onClick={() => setActiveTab('entries')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'entries' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              <span className="flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" />
                Entries ({totalEntries})
              </span>
            </button>
            <button
              onClick={() => navigate(`/project/${params.id}/export`)}
              className="ml-auto px-4 py-2 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:opacity-80 transition-opacity"
            >
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                Import / Export
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'entries' && (
          <>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, type, or fed from..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as EquipmentType | '')}
                  className="pl-3 pr-8 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Types</option>
                  {(Object.keys(EQUIPMENT_LABELS) as EquipmentType[]).map((t) => (
                    <option key={t} value={t}>{EQUIPMENT_LABELS[t]}</option>
                  ))}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            {(search || typeFilter) && (
              <p className="text-xs text-muted-foreground mb-3">
                {filteredEntries.length} of {totalEntries} entries shown
                {(search || typeFilter) && (
                  <button onClick={() => { setSearch(''); setTypeFilter(''); }} className="ml-2 text-primary hover:underline">Clear filters</button>
                )}
              </p>
            )}
            {filteredEntries.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  Page {entriesPage} of {totalEntryPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEntriesPage((p) => Math.max(1, p - 1))}
                    disabled={entriesPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setEntriesPage((p) => Math.min(totalEntryPages, p + 1))}
                    disabled={entriesPage === totalEntryPages}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <div className="text-2xl font-bold text-primary">{totalEntries}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total Entries</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <div className="text-2xl font-bold text-chart-2">{totalPhotos}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total Photos</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <div className="text-2xl font-bold text-chart-3">{stats ? Object.values(stats).filter(v => v > 0).length : 0}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Equipment Types</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 text-center">
                <div className="text-2xl font-bold text-chart-4">{entries.filter(e => e.data['arcFlashLabel'] === 'Yes').length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Arc Flash Labels</div>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No Equipment Entries</h3>
                <p className="text-sm text-muted-foreground mb-4">Start adding equipment to this project.</p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
                >
                  Add Equipment
                </button>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">No results found</h3>
                <p className="text-xs text-muted-foreground mb-3">Try a different search term or filter.</p>
                <button onClick={() => { setSearch(''); setTypeFilter(''); }} className="text-sm text-primary hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {pagedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => navigate(`/project/${params.id}/entry/${entry.id}`)}
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
                      <EquipmentIcon
                        type={entry.type}
                        className="text-lg leading-none"
                        imageClassName="h-9 w-9 rounded-md object-contain object-center"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm truncate">{entry.data['name'] || 'Unnamed'}</span>
                        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium uppercase tracking-wider shrink-0">
                          {EQUIPMENT_LABELS[entry.type]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {entry.data['fedFrom'] && <span>Fed from: {entry.data['fedFrom']}</span>}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${getEquipmentCompletion(entry) === 100 ? 'bg-chart-2/15 text-chart-2' : 'bg-chart-3/15 text-chart-3'}`}>
                          {getEquipmentCompletion(entry)}% complete
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${entry.photos.length > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {entry.photos.length > 0 ? `${entry.photos.length} photo${entry.photos.length > 1 ? 's' : ''}` : 'No photos'}
                        </span>
                        {entry.photos.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {entry.photos.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'add' && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h2 className="text-base font-semibold text-foreground mr-auto">Select Equipment Type</h2>
              <button onClick={() => setEquipmentCategory('All')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${equipmentCategory === 'All' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>All</button>
              <button onClick={() => setEquipmentCategory('Power')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${equipmentCategory === 'Power' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>Power</button>
              <button onClick={() => setEquipmentCategory('Control')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${equipmentCategory === 'Control' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>Control</button>
              <button onClick={() => setEquipmentCategory('Mechanical')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${equipmentCategory === 'Mechanical' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>Mechanical</button>
              <button onClick={() => setEquipmentCategory('Other')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${equipmentCategory === 'Other' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>Other</button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                placeholder="Search equipment type..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {equipmentSearch && (
                <button onClick={() => setEquipmentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {mostUsedTypes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Quick add (most used)</p>
                <div className="flex flex-wrap gap-2">
                  {mostUsedTypes.map((type) => (
                    <button
                      key={`quick-${type}`}
                      onClick={() => navigate(`/project/${params.id}/new/${type}`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                        <EquipmentIcon
                          type={type}
                          className="text-xs leading-none"
                          imageClassName="h-4 w-4 object-contain object-center"
                        />
                      </span>
                      {EQUIPMENT_LABELS[type]} ({stats?.[type] || 0})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {equipmentTypeList.length === 0 ? (
              <div className="text-center py-10 bg-card rounded-xl border border-border">
                <p className="text-sm font-medium text-foreground">No equipment type found</p>
                <p className="text-xs text-muted-foreground mt-1">Try another search or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {equipmentTypeList.map((type) => (
                <button
                  key={type}
                  onClick={() => navigate(`/project/${params.id}/new/${type}`)}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                    <EquipmentIcon
                      type={type}
                      className="text-lg leading-none"
                      imageClassName="h-9 w-9 rounded-md object-contain object-center"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{EQUIPMENT_LABELS[type]}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{EQUIPMENT_META[type].hint}</div>
                    {stats && stats[type] > 0 && (
                      <div className="text-xs text-primary mt-1">{stats[type]} existing</div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
