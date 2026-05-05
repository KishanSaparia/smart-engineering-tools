import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { getProject, getEntriesByProject, getProjectStats, deleteProject, type Project, type EquipmentEntry, type EquipmentType, EQUIPMENT_LABELS } from '@/lib/db';
import { downloadOneLineErrorReport, exportOneLineDiagramPdf, exportProject } from '@/lib/export';
import { ArrowLeft, Download, Trash2, FileSpreadsheet, Camera, AlertTriangle, CheckCircle2, Upload, GitBranch } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { downloadImportErrorReport, downloadSampleTemplate, importWorkbookToProject } from '@/lib/import';
import EquipmentIcon from '@/components/equipment-icon';

export default function ExportPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [entries, setEntries] = useState<EquipmentEntry[]>([]);
  const [stats, setStats] = useState<Record<EquipmentType, number> | null>(null);
  const [exporting, setExporting] = useState(false);
  const [diagramExporting, setDiagramExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ processedRows: 0, totalRows: 0, currentSheet: '' });
  const [dragOverImport, setDragOverImport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [params.id]);

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
    const s = await getProjectStats(params.id!);
    setStats(s);
    setLoading(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportProject(params.id!);
      toast({
        title: 'Export complete',
        description: 'Project ZIP downloaded successfully.',
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Please try again.',
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleOneLinePdf() {
    setDiagramExporting(true);
    try {
      const result = await exportOneLineDiagramPdf(params.id!);
      if (result.issues.length > 0) {
        downloadOneLineErrorReport(result.issues, `${project?.name || 'project'}-one-line-errors`);
        toast({
          title: 'One-line PDF downloaded with warnings',
          description: `Diagram generated for ${result.nodeCount} entries. Error report downloaded for ${result.issues.length} issue(s).`,
        });
      } else {
        toast({
          title: 'One-line PDF downloaded',
          description: `Diagram generated for ${result.nodeCount} entries with ${result.edgeCount} connections.`,
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'One-line PDF failed',
        description: 'Could not generate the single-line PDF. Please check entry data and try again.',
      });
    } finally {
      setDiagramExporting(false);
    }
  }

  async function handleDeleteProject() {
    setDeleting(true);
    try {
      if (totalEntries > 0) {
        await exportProject(params.id!);
      }
      await deleteProject(params.id!);
      toast(
        totalEntries > 0
          ? {
              title: 'Project exported and deleted',
              description: 'Downloaded file is saved and local project has been removed.',
            }
          : {
              title: 'Project deleted',
              description: 'No entries found, so no download was needed.',
            }
      );
      navigate('/home');
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: 'Failed to export and delete project. Please try again.',
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleImportWorkbook(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await runImport(file);
  }

  async function runImport(file: File) {
    if (!/\.xlsx?$/.test(file.name.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an Excel file (.xlsx or .xls).',
      });
      return;
    }

    setImporting(true);
    setImportProgress({ processedRows: 0, totalRows: 0, currentSheet: '' });
    try {
      const result = await importWorkbookToProject(params.id!, file, (progress) => {
        setImportProgress(progress);
      });
      await loadData();
      toast({
        title: 'Import completed',
        description: `${result.created} entries imported${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}.`,
      });
      if (result.issues.length > 0) {
        downloadImportErrorReport(result.issues, `${project?.name || 'project'}-import-errors`);
        toast({
          title: 'Import error report downloaded',
          description: 'Skipped row reasons were saved as TXT and CSV.',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: 'Please check the Excel format and try again.',
      });
    } finally {
      setImporting(false);
      setImportProgress({ processedRows: 0, totalRows: 0, currentSheet: '' });
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }
  function onDropImport(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverImport(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    void runImport(file);
  }


  function handleDownloadTemplate() {
    downloadSampleTemplate();
    toast({
      title: 'Template downloaded',
      description: 'Use this sample format for Excel import.',
    });
  }

  if (loading || !project || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalEntries = entries.length;
  const totalPhotos = entries.reduce((sum, e) => sum + e.photos.length, 0);
  const typesUsed = Object.entries(stats).filter(([, count]) => count > 0);
  const importPercent = importProgress.totalRows > 0
    ? Math.min(100, Math.round((importProgress.processedRows / importProgress.totalRows) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(`/project/${params.id}`)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Export & Manage</h1>
            <p className="text-xs text-muted-foreground">{project.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Project Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalEntries}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Forms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-2">{totalPhotos}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Photos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-3">{typesUsed.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Equipment Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-4">
                {entries.filter((e) => e.data['arcFlashLabel'] === 'Yes').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Arc Flash Labels</div>
            </div>
          </div>

          {typesUsed.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Entries by Equipment Type</h3>
              <div className="space-y-2">
                {typesUsed.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-foreground inline-flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                        <EquipmentIcon
                          type={type as EquipmentType}
                          className="text-sm leading-none"
                          imageClassName="h-6 w-6 rounded-sm object-contain object-center"
                        />
                      </span>
                      {EQUIPMENT_LABELS[type as EquipmentType]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground">
                        {count === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-2">Export Data</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Download all survey data as an Excel file with photos in a ZIP archive.
          </p>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium">What's included:</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground text-xs">
                <li>Excel file with separate sheets for each equipment type</li>
                <li>Summary sheet with project info and entry counts</li>
                <li>All photos organized in folders by equipment type and name</li>
              </ul>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || totalEntries === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Preparing Download...' : `Download Project (${totalEntries} entries, ${totalPhotos} photos)`}
          </button>
          <button
            onClick={handleOneLinePdf}
            disabled={diagramExporting || totalEntries === 0}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-accent text-accent-foreground rounded-xl text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <GitBranch className="w-4 h-4" />
            {diagramExporting ? 'Generating One-Line PDF...' : 'Download One-Line PDF'}
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-2">Import / Export Tools</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload an Excel file in the same sheet/column format to auto-create entries that you can edit later.
          </p>
          <div className="rounded-xl border border-border bg-muted/30 p-3 mb-4 text-xs text-muted-foreground">
            Required and optional fields are marked in the sample template as <strong>(Required)</strong> and <strong>(Optional)</strong>.
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportWorkbook}
            className="hidden"
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverImport(true);
            }}
            onDragLeave={() => setDragOverImport(false)}
            onDrop={onDropImport}
            className={`mb-3 rounded-xl border-2 border-dashed p-4 text-center text-sm transition-colors ${dragOverImport ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
          >
            Drag and drop Excel file here, or use the upload button.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Upload Excel and Import'}
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Sample Excel
            </button>
          </div>
          {importing && (
            <div className="mt-3 space-y-1.5">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${importPercent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                Processing rows: {importProgress.processedRows}
                {importProgress.totalRows > 0 ? ` / ${importProgress.totalRows}` : ''}
                {importProgress.currentSheet ? ` (${importProgress.currentSheet})` : ''} - {importPercent}%
              </p>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-destructive/30 p-6">
          <h2 className="text-base font-semibold text-destructive mb-2">Delete Project</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Export and delete this project. The data will be downloaded automatically before deletion.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              {totalEntries > 0 ? 'Delete Project (Downloads Data First)' : 'Delete Project'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Are you sure?</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {totalEntries > 0
                      ? `This will download all data (Excel + photos) and then permanently delete the project with all ${totalEntries} entries and ${totalPhotos} photos from this device.`
                      : 'This project has no entries, so it will be deleted directly without download.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? (totalEntries > 0 ? 'Exporting & Deleting...' : 'Deleting...') : totalEntries > 0 ? 'Yes, Export & Delete' : 'Yes, Delete Project'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
