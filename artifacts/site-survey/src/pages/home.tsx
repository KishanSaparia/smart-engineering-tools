import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { getProjects, createProject, deleteProject, getEntriesByProject, type Project } from '@/lib/db';
import { Plus, FolderOpen, Trash2, MapPin, User, Calendar, Zap, Search, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { exportProject } from '@/lib/export';

export default function Home() {
  const [, navigate] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', surveyName: '', location: '', client: '', date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    const p = await getProjects();
    setProjects(p);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    await createProject(form);
    toast({
      title: 'Project created',
      description: `${form.name} is ready for data collection.`,
    });
    setForm({ name: '', surveyName: '', location: '', client: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
    await loadProjects();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this project? All data and photos will be permanently removed.')) return;
    try {
      const projectEntries = await getEntriesByProject(id);
      if (projectEntries.length > 0) {
        await exportProject(id);
      }
      await deleteProject(id);
      toast(
        projectEntries.length > 0
          ? {
              title: 'Project exported and deleted',
              description: 'Excel + photos ZIP downloaded before deletion.',
            }
          : {
              title: 'Project deleted',
              description: 'No entries found, so no download was needed.',
            }
      );
      await loadProjects();
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'Could not export and delete project. Please try again.',
      });
    }
  }

  const filteredProjects = projects.filter((project) => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      project.name.toLowerCase().includes(q) ||
      project.surveyName.toLowerCase().includes(q) ||
      project.location.toLowerCase().includes(q) ||
      project.client.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Site Survey</h1>
              <p className="text-xs text-muted-foreground">Data Collection</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Search project, surveyer ID, location, or client..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          {projectSearch && (
            <p className="text-xs text-muted-foreground mt-2">
              {filteredProjects.length} of {projects.length} projects shown
            </p>
          )}
        </div>

        {showForm && (
          <div className="mb-6 bg-card rounded-2xl border border-border p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <h2 className="text-base font-semibold mb-4 text-foreground">Create New Project</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Project Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. Building A Survey"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Surveyer Name / ID</label>
                <input
                  type="text"
                  value={form.surveyName}
                  onChange={(e) => setForm({ ...form, surveyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. SRV-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. 123 Main St"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Client</label>
                <input
                  type="text"
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. ACME Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleCreate}
                disabled={!form.name.trim()}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Create Project
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No Projects Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first project to start collecting site survey data.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
            >
              Create Project
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold text-foreground mb-1">No Matching Projects</h3>
            <p className="text-sm text-muted-foreground mb-4">Try a different search term.</p>
            <button
              onClick={() => setProjectSearch('')}
              className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="group bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                onClick={() => navigate(`/project/${p.id}`)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                  className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2 pr-8">{p.name}</h3>
                <div className="space-y-1.5">
                  {p.surveyName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-medium text-primary">{p.surveyName}</span>
                    </div>
                  )}
                  {p.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{p.location}</span>
                    </div>
                  )}
                  {p.client && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span>{p.client}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{p.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
