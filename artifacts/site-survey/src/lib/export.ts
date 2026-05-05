import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { getEntriesByProject, getPhoto, getProject, EQUIPMENT_LABELS, type EquipmentEntry, type EquipmentType } from './db';
import { EQUIPMENT_FIELDS, getVisibleFields } from './equipment-fields';

export async function exportProject(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  const entries = await getEntriesByProject(projectId);
  const zip = new JSZip();

  const wb = XLSX.utils.book_new();

  const equipmentTypes = Object.keys(EQUIPMENT_LABELS) as EquipmentType[];
  for (const eqType of equipmentTypes) {
    const typeEntries = entries.filter((e) => e.type === eqType);
    const fields = EQUIPMENT_FIELDS[eqType];
    const headers = fields.map((f) => f.label);
    headers.push('Photos Count');

    const rows: string[][] = [];
    for (const entry of typeEntries) {
      const row = fields.map((f) => entry.data[f.name] || '');
      row.push(String(entry.photos.length));
      rows.push(row);
    }

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = headers.map((h, i) => {
      let max = h.length;
      for (const row of rows) {
        if (row[i] && row[i].length > max) max = row[i].length;
      }
      return { wch: Math.min(max + 2, 40) };
    });
    ws['!cols'] = colWidths;

    const sheetName = EQUIPMENT_LABELS[eqType].substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const summaryData = [
    ['Project Name', project.name],
    ['Surveyer Name / ID', project.surveyName || ''],
    ['Location', project.location],
    ['Client', project.client],
    ['Date', project.date],
    [''],
    ['Equipment Type', 'Count'],
  ];
  for (const eqType of equipmentTypes) {
    const count = entries.filter((e) => e.type === eqType).length;
    if (count > 0) {
      summaryData.push([EQUIPMENT_LABELS[eqType], String(count)]);
    }
  }
  summaryData.push(['', '']);
  summaryData.push(['Total Entries', String(entries.length)]);

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary', true);

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file(`${project.name}_Survey_Data.xlsx`, excelBuffer);

  const photosFolder = zip.folder('Photos');
  if (photosFolder) {
    for (const entry of entries) {
      const eqLabel = EQUIPMENT_LABELS[entry.type];
      const entryName = (entry.data['name'] || entry.id).replace(/[/\\?%*:|"<>]/g, '-');
      const typeFolder = photosFolder.folder(`${eqLabel}`);
      if (typeFolder) {
        const entryFolder = typeFolder.folder(entryName);
        if (entryFolder) {
          for (let i = 0; i < entry.photos.length; i++) {
            const blob = await getPhoto(entry.photos[i]);
            if (blob) {
              const ext = blob.type.includes('png') ? 'png' : 'jpg';
              const paddedIndex = String(i + 1).padStart(2, '0');
              entryFolder.file(`${entryName}_${paddedIndex}.${ext}`, blob);
            }
          }
        }
      }
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${project.name}_Site_Survey.zip`);
}

export interface OneLineDiagramIssue {
  entryName: string;
  reason: string;
}

function issueToCsv(issues: OneLineDiagramIssue[]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = ['Entry Name,Reason'];
  for (const issue of issues) {
    lines.push(`${escape(issue.entryName)},${escape(issue.reason)}`);
  }
  return lines.join('\r\n');
}

export function downloadOneLineErrorReport(issues: OneLineDiagramIssue[], baseName = 'one-line-diagram-errors'): void {
  if (issues.length === 0) return;
  const csvBlob = new Blob([issueToCsv(issues)], { type: 'text/csv;charset=utf-8' });
  saveAs(csvBlob, `${baseName}.csv`);

  const txt = issues.map((issue) => `${issue.entryName}: ${issue.reason}`).join('\n');
  const txtBlob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  saveAs(txtBlob, `${baseName}.txt`);
}

interface DiagramNode {
  entry: EquipmentEntry;
  name: string;
  lines: string[];
  width: number;
  height: number;
  index: number;
}

interface EdgeRef {
  from: DiagramNode;
  to: DiagramNode;
  label: string;
}

interface PositionedNode extends DiagramNode {
  x: number;
  y: number;
  depth: number;
}

interface RoutedEdge extends EdgeRef {
  points: Array<{ x: number; y: number }>;
}

interface LayoutConfig {
  horizontalGap: number;
  verticalGap: number;
  siblingGap: number;
  nodePadding: number;
  parentLaneGap: number;
  branchChannelStep: number;
  filletRadius: number;
}

interface DiagramBounds {
  minLeft: number;
  maxRight: number;
  minTop: number;
  maxBottom: number;
  width: number;
  height: number;
}

const TYPE_COLORS: Record<EquipmentType, { fill: [number, number, number]; border: [number, number, number]; line: [number, number, number] }> = {
  SWITCHGEAR: { fill: [255, 245, 230], border: [226, 132, 25], line: [205, 113, 13] },
  SWITCHBOARD: { fill: [237, 247, 255], border: [66, 153, 225], line: [43, 124, 194] },
  PANEL: { fill: [245, 243, 255], border: [124, 92, 255], line: [99, 71, 230] },
  TRANSFORMER: { fill: [241, 253, 245], border: [47, 158, 90], line: [35, 130, 72] },
  DISCONNECT_SWITCH: { fill: [255, 245, 245], border: [230, 83, 83], line: [207, 59, 59] },
  ENCLOSED_CIRCUIT_BREAKER: { fill: [255, 248, 240], border: [240, 144, 88], line: [217, 119, 62] },
  MOTOR_CONTROL_CENTER: { fill: [238, 248, 255], border: [41, 128, 185], line: [33, 108, 156] },
  VARIABLE_FREQUENCY_DRIVE: { fill: [248, 243, 255], border: [142, 68, 173], line: [123, 52, 154] },
  MOTOR: { fill: [245, 255, 250], border: [42, 157, 143], line: [28, 134, 121] },
  GENERATOR: { fill: [255, 252, 235], border: [221, 161, 0], line: [191, 136, 0] },
  AUTOMATIC_TRANSFER_SWITCH: { fill: [240, 252, 255], border: [0, 151, 178], line: [0, 127, 151] },
  UNINTERRUPTIBLE_POWER_SUPPLY: { fill: [248, 250, 255], border: [78, 96, 196], line: [63, 80, 171] },
  UNKNOWN_EQUIPMENT: { fill: [248, 248, 248], border: [128, 128, 128], line: [105, 105, 105] },
};

type TreeMap = Map<string, string[]>;

function getNodeBounds(node: PositionedNode): { left: number; right: number; top: number; bottom: number } {
  return {
    left: node.x - node.width / 2,
    right: node.x + node.width / 2,
    top: node.y - node.height / 2,
    bottom: node.y + node.height / 2,
  };
}

function overlaps1D(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && b1 < a2;
}

function buildDiagramGraph(entries: EquipmentEntry[]): {
  nodes: DiagramNode[];
  edges: EdgeRef[];
  issues: OneLineDiagramIssue[];
} {
  const issues: OneLineDiagramIssue[] = [];
  const nameMap = new Map<string, DiagramNode>();
  const nodes: DiagramNode[] = [];

  for (const entry of entries) {
    const visibleFields = getVisibleFields(entry.type, entry.data);
    const requiredFields = visibleFields.filter((f) => f.required);
    const lineItems = requiredFields
      .map((f) => `${f.label}: ${(entry.data[f.name] || '').trim()}`)
      .filter((line) => !line.endsWith(':'));

    const longest = lineItems.reduce((max, line) => Math.max(max, line.length), 0);
    const width = Math.max(186, Math.min(420, longest * 5.9 + 26));
    const height = Math.max(74, lineItems.length * 13 + 36);
    const name = (entry.data.name || entry.id).trim();
    const key = name.toLowerCase();

    if (nameMap.has(key)) {
      issues.push({
        entryName: name,
        reason: 'Duplicate equipment name found. Connection matching may be ambiguous.',
      });
    }

    const node: DiagramNode = { entry, name, lines: lineItems, width, height, index: nodes.length };
    nodes.push(node);
    if (!nameMap.has(key)) {
      nameMap.set(key, node);
    }
  }

  const edges: EdgeRef[] = [];
  for (const node of nodes) {
    const refs = [
      { value: node.entry.data.fedFrom, label: 'fedFrom' },
      { value: node.entry.data.fedFromN, label: 'fedFromN' },
      { value: node.entry.data.fedFromE, label: 'fedFromE' },
    ].filter((r) => (r.value || '').trim());

    for (const ref of refs) {
      const key = (ref.value || '').trim().toLowerCase();
      const source = nameMap.get(key);
      if (!source) {
        issues.push({
          entryName: node.name,
          reason: `Source "${ref.value}" (${ref.label}) not found by equipment name.`,
        });
        continue;
      }
      if (source === node) {
        issues.push({
          entryName: node.name,
          reason: `Self reference "${ref.value}" (${ref.label}) was ignored.`,
        });
        continue;
      }
      edges.push({ from: source, to: node, label: ref.label });
    }
  }

  return { nodes, edges, issues };
}

function buildHierarchy(
  nodes: DiagramNode[],
  edges: EdgeRef[],
  issues: OneLineDiagramIssue[]
): { roots: string[]; childrenByParent: TreeMap; depthByNode: Map<string, number> } {
  const nodeById = new Map(nodes.map((n) => [n.entry.id, n]));
  const incoming = new Map<string, EdgeRef[]>();
  const outgoing = new Map<string, EdgeRef[]>();
  for (const n of nodes) {
    incoming.set(n.entry.id, []);
    outgoing.set(n.entry.id, []);
  }
  for (const e of edges) {
    incoming.get(e.to.entry.id)?.push(e);
    outgoing.get(e.from.entry.id)?.push(e);
  }

  // Primary parent selection keeps each equipment localized under one source.
  const primaryParentByNode = new Map<string, string>();
  for (const node of nodes) {
    const inc = incoming.get(node.entry.id) || [];
    if (inc.length === 0) continue;
    inc.sort((a, b) => {
      const rank = (label: string) => (label === 'fedFrom' ? 0 : label === 'fedFromN' ? 1 : 2);
      const da = rank(a.label);
      const db = rank(b.label);
      if (da !== db) return da - db;
      return a.from.name.localeCompare(b.from.name);
    });
    primaryParentByNode.set(node.entry.id, inc[0].from.entry.id);
  }

  const childrenByParent: TreeMap = new Map();
  for (const n of nodes) childrenByParent.set(n.entry.id, []);
  for (const [childId, parentId] of primaryParentByNode.entries()) {
    childrenByParent.get(parentId)?.push(childId);
  }

  for (const [parentId, kids] of childrenByParent.entries()) {
    kids.sort((a, b) => (nodeById.get(a)?.name || '').localeCompare(nodeById.get(b)?.name || ''));
    childrenByParent.set(parentId, kids);
  }

  let roots = nodes
    .filter((n) => !primaryParentByNode.has(n.entry.id))
    .map((n) => n.entry.id);
  if (roots.length === 0 && nodes.length > 0) {
    roots = [nodes[0].entry.id];
  }

  roots.sort((a, b) => (nodeById.get(a)?.name || '').localeCompare(nodeById.get(b)?.name || ''));

  const depthByNode = new Map<string, number>();
  const visiting = new Set<string>();
  const memoDepth = (id: string): number => {
    if (depthByNode.has(id)) return depthByNode.get(id)!;
    if (visiting.has(id)) {
      issues.push({
        entryName: nodeById.get(id)?.name || id,
        reason: 'Cycle detected in fedFrom connections.',
      });
      return 0;
    }
    visiting.add(id);
    const parentId = primaryParentByNode.get(id);
    const d = parentId ? Math.min(20, memoDepth(parentId) + 1) : 0;
    visiting.delete(id);
    depthByNode.set(id, d);
    return d;
  };
  for (const n of nodes) memoDepth(n.entry.id);

  return { roots, childrenByParent, depthByNode };
}

function computeSubtreeWidths(
  rootIds: string[],
  childrenByParent: TreeMap,
  nodeById: Map<string, DiagramNode>,
  cfg: LayoutConfig
): Map<string, number> {
  const widthByNode = new Map<string, number>();
  const dfs = (id: string): number => {
    if (widthByNode.has(id)) return widthByNode.get(id)!;
    const node = nodeById.get(id)!;
    const children = childrenByParent.get(id) || [];
    if (children.length === 0) {
      widthByNode.set(id, node.width + cfg.nodePadding * 2);
      return widthByNode.get(id)!;
    }
    let sum = 0;
    for (let i = 0; i < children.length; i++) {
      sum += dfs(children[i]);
      if (i > 0) sum += cfg.siblingGap;
    }
    const result = Math.max(node.width + cfg.nodePadding * 2, sum);
    widthByNode.set(id, result);
    return result;
  };
  for (const rootId of rootIds) dfs(rootId);
  return widthByNode;
}

function placeHierarchy(
  rootIds: string[],
  childrenByParent: TreeMap,
  depthByNode: Map<string, number>,
  widthByNode: Map<string, number>,
  nodeById: Map<string, DiagramNode>,
  cfg: LayoutConfig
): PositionedNode[] {
  const placed = new Map<string, PositionedNode>();

  const placeSubtree = (id: string, left: number): void => {
    const node = nodeById.get(id)!;
    const subtreeWidth = widthByNode.get(id)!;
    const x = left + subtreeWidth / 2;
    const depth = depthByNode.get(id) || 0;
    const y = depth * cfg.verticalGap;
    placed.set(id, { ...node, x, y, depth });

    const children = childrenByParent.get(id) || [];
    let cursor = left;
    for (const childId of children) {
      placeSubtree(childId, cursor);
      cursor += widthByNode.get(childId)! + cfg.siblingGap;
    }
  };

  let left = 0;
  for (let i = 0; i < rootIds.length; i++) {
    const rootId = rootIds[i];
    placeSubtree(rootId, left);
    left += widthByNode.get(rootId)! + cfg.horizontalGap;
  }

  // Collision pass by depth; shift overlapping branches apart.
  const nodes = [...placed.values()];
  const byDepth = new Map<number, PositionedNode[]>();
  for (const n of nodes) {
    byDepth.set(n.depth, [...(byDepth.get(n.depth) || []), n]);
  }
  const childrenLookup = childrenByParent;
  const shiftSubtree = (id: string, dx: number): void => {
    const target = placed.get(id);
    if (!target) return;
    target.x += dx;
    const kids = childrenLookup.get(id) || [];
    for (const kid of kids) shiftSubtree(kid, dx);
  };

  const sortedDepths = [...byDepth.keys()].sort((a, b) => a - b);
  for (const depth of sortedDepths) {
    const row = (byDepth.get(depth) || []).sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) {
      const prev = row[i - 1];
      const cur = row[i];
      const minLeft = prev.x + prev.width / 2 + cfg.horizontalGap + cur.width / 2;
      if (cur.x < minLeft) {
        const delta = minLeft - cur.x;
        shiftSubtree(cur.entry.id, delta);
      }
    }
  }

  // Center parents over children after shifts.
  const idsByDepthDesc = [...placed.values()]
    .sort((a, b) => b.depth - a.depth)
    .map((n) => n.entry.id);
  for (const id of idsByDepthDesc) {
    const kids = childrenByParent.get(id) || [];
    if (kids.length === 0) continue;
    const childXs = kids.map((kid) => placed.get(kid)?.x).filter((x): x is number => x !== undefined);
    if (childXs.length === 0) continue;
    const center = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    const self = placed.get(id)!;
    const dx = center - self.x;
    self.x = center;
    // shift entire parent subtree root so descendants remain local branch.
    for (const kid of kids) shiftSubtree(kid, dx);
  }

  return [...placed.values()];
}

function segmentIntersectsNode(
  a: { x: number; y: number },
  b: { x: number; y: number },
  node: PositionedNode,
  inflate = 8
): boolean {
  const box = getNodeBounds(node);
  const left = box.left - inflate;
  const right = box.right + inflate;
  const top = box.top - inflate;
  const bottom = box.bottom + inflate;
  if (a.x === b.x) {
    const x = a.x;
    if (x < left || x > right) return false;
    const y1 = Math.min(a.y, b.y);
    const y2 = Math.max(a.y, b.y);
    return overlaps1D(y1, y2, top, bottom);
  }
  if (a.y === b.y) {
    const y = a.y;
    if (y < top || y > bottom) return false;
    const x1 = Math.min(a.x, b.x);
    const x2 = Math.max(a.x, b.x);
    return overlaps1D(x1, x2, left, right);
  }
  return false;
}

function pathIntersectsNodes(
  points: Array<{ x: number; y: number }>,
  nodes: PositionedNode[],
  skipIds: Set<string>
): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (const n of nodes) {
      if (skipIds.has(n.entry.id)) continue;
      if (segmentIntersectsNode(a, b, n, 10)) return true;
    }
  }
  return false;
}

function findClearHorizontalY(
  preferredY: number,
  x1: number,
  x2: number,
  nodes: PositionedNode[],
  skipIds: Set<string>
): number {
  let y = preferredY;
  let attempts = 0;
  while (attempts < 60) {
    const a = { x: Math.min(x1, x2), y };
    const b = { x: Math.max(x1, x2), y };
    let blocked = false;
    for (const node of nodes) {
      if (skipIds.has(node.entry.id)) continue;
      if (segmentIntersectsNode(a, b, node, 12)) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return y;
    y += 10;
    attempts++;
  }
  return y;
}

function routeEdges(
  edges: EdgeRef[],
  nodes: PositionedNode[],
  cfg: LayoutConfig
): RoutedEdge[] {
  const nodeById = new Map(nodes.map((n) => [n.entry.id, n]));
  const outByParent = new Map<string, EdgeRef[]>();
  for (const e of edges) {
    outByParent.set(e.from.entry.id, [...(outByParent.get(e.from.entry.id) || []), e]);
  }
  for (const [id, list] of outByParent) {
    list.sort((a, b) => (nodeById.get(a.to.entry.id)?.x || 0) - (nodeById.get(b.to.entry.id)?.x || 0));
    outByParent.set(id, list);
  }

  const routed: RoutedEdge[] = [];
  for (const e of edges) {
    const from = nodeById.get(e.from.entry.id)!;
    const to = nodeById.get(e.to.entry.id)!;
    const siblings = outByParent.get(e.from.entry.id) || [e];
    const laneIndex = Math.max(0, siblings.findIndex((x) => x === e));
    const laneCenter = laneIndex - (siblings.length - 1) / 2;

    const start = { x: from.x, y: from.y + from.height / 2 };
    const end = { x: to.x, y: to.y - to.height / 2 };
    const skipIds = new Set<string>([from.entry.id, to.entry.id]);

    const preferredMidY = start.y + cfg.parentLaneGap + Math.abs(laneCenter) * 8;
    const midY = findClearHorizontalY(preferredMidY, start.x, end.x, nodes, skipIds);
    const simple = [
      start,
      { x: start.x, y: midY },
      { x: end.x, y: midY },
      end,
    ];

    if (!pathIntersectsNodes(simple, nodes, skipIds)) {
      routed.push({ ...e, points: simple });
      continue;
    }

    // Obstacle-aware channel route.
    const dir = end.x >= start.x ? 1 : -1;
    let channelX = start.x + dir * cfg.branchChannelStep;
    let path = simple;
    for (let attempt = 0; attempt < 30; attempt++) {
      const stubY = findClearHorizontalY(start.y + cfg.parentLaneGap, start.x, channelX, nodes, skipIds);
      const topOfChild = Math.min(stubY, end.y - cfg.parentLaneGap);
      const candidate = [
        start,
        { x: start.x, y: stubY },
        { x: channelX, y: stubY },
        { x: channelX, y: topOfChild },
        { x: end.x, y: topOfChild },
        end,
      ];
      if (!pathIntersectsNodes(candidate, nodes, skipIds)) {
        path = candidate;
        break;
      }
      channelX += dir * cfg.branchChannelStep;
      path = candidate;
    }
    routed.push({ ...e, points: path });
  }

  return routed;
}

function validateLayout(nodes: PositionedNode[], edges: RoutedEdge[]): {
  nodeOverlaps: number;
  edgeNodeCollisions: number;
  duplicateRoutes: number;
  labelCrowding: number;
} {
  let nodeOverlaps = 0;
  for (let i = 0; i < nodes.length; i++) {
    const a = getNodeBounds(nodes[i]);
    for (let j = i + 1; j < nodes.length; j++) {
      const b = getNodeBounds(nodes[j]);
      if (overlaps1D(a.left, a.right, b.left, b.right) && overlaps1D(a.top, a.bottom, b.top, b.bottom)) {
        nodeOverlaps++;
      }
    }
  }

  let edgeNodeCollisions = 0;
  for (const edge of edges) {
    const skip = new Set<string>([edge.from.entry.id, edge.to.entry.id]);
    if (pathIntersectsNodes(edge.points, nodes, skip)) edgeNodeCollisions++;
  }

  const routeKey = (points: Array<{ x: number; y: number }>) =>
    points.map((p) => `${Math.round(p.x)}:${Math.round(p.y)}`).join('|');
  const seen = new Set<string>();
  let duplicateRoutes = 0;
  for (const edge of edges) {
    const key = routeKey(edge.points);
    if (seen.has(key)) duplicateRoutes++;
    seen.add(key);
  }

  let labelCrowding = 0;
  for (let i = 0; i < nodes.length; i++) {
    const a = getNodeBounds(nodes[i]);
    for (let j = i + 1; j < nodes.length; j++) {
      const b = getNodeBounds(nodes[j]);
      const horizontalGap = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
      const verticalGap = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
      const nearX = Math.abs(a.left - b.right) < 28 || Math.abs(b.left - a.right) < 28;
      const overlapY = overlaps1D(a.top - 8, a.bottom + 8, b.top - 8, b.bottom + 8);
      const nearY = Math.abs(a.top - b.bottom) < 24 || Math.abs(b.top - a.bottom) < 24;
      const overlapX = overlaps1D(a.left - 10, a.right + 10, b.left - 10, b.right + 10);
      if ((nearX && overlapY) || (nearY && overlapX) || (horizontalGap < 18 && verticalGap < 18)) {
        labelCrowding++;
      }
    }
  }

  return { nodeOverlaps, edgeNodeCollisions, duplicateRoutes, labelCrowding };
}

function getDiagramBounds(nodes: PositionedNode[]): DiagramBounds {
  const minLeft = Math.min(...nodes.map((n) => n.x - n.width / 2), 0);
  const maxRight = Math.max(...nodes.map((n) => n.x + n.width / 2), 0);
  const minTop = Math.min(...nodes.map((n) => n.y - n.height / 2), 0);
  const maxBottom = Math.max(...nodes.map((n) => n.y + n.height / 2), 0);
  return {
    minLeft,
    maxRight,
    minTop,
    maxBottom,
    width: maxRight - minLeft,
    height: maxBottom - minTop,
  };
}

function drawFilletedOrthogonalPath(
  doc: jsPDF,
  points: Array<{ x: number; y: number }>,
  radius: number
): void {
  if (points.length < 2) return;
  const k = 0.5522847498;
  const vectors: number[][] = [];
  let current = { ...points[0] };

  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1];
    const b = points[i];
    const c = points[i + 1];
    const inDx = b.x - a.x;
    const inDy = b.y - a.y;
    const outDx = c.x - b.x;
    const outDy = c.y - b.y;
    const inLen = Math.hypot(inDx, inDy);
    const outLen = Math.hypot(outDx, outDy);
    const straightLine = inLen === 0 || outLen === 0 || (inDx === 0 && outDx === 0) || (inDy === 0 && outDy === 0);

    if (straightLine) {
      vectors.push([b.x - current.x, b.y - current.y]);
      current = { x: b.x, y: b.y };
      continue;
    }

    const r = Math.max(2, Math.min(radius, inLen / 2, outLen / 2));
    const inUx = inDx / inLen;
    const inUy = inDy / inLen;
    const outUx = outDx / outLen;
    const outUy = outDy / outLen;

    const p1 = { x: b.x - inUx * r, y: b.y - inUy * r };
    const p2 = { x: b.x + outUx * r, y: b.y + outUy * r };
    const c1 = { x: p1.x + inUx * r * k, y: p1.y + inUy * r * k };
    const c2 = { x: p2.x - outUx * r * k, y: p2.y - outUy * r * k };

    vectors.push([p1.x - current.x, p1.y - current.y]);
    vectors.push([
      c1.x - p1.x,
      c1.y - p1.y,
      c2.x - p1.x,
      c2.y - p1.y,
      p2.x - p1.x,
      p2.y - p1.y,
    ]);
    current = p2;
  }

  const last = points[points.length - 1];
  vectors.push([last.x - current.x, last.y - current.y]);
  doc.lines(vectors as [number, number][], points[0].x, points[0].y, [1, 1], 'S', false);
}

export async function exportOneLineDiagramPdf(
  projectId: string
): Promise<{ issues: OneLineDiagramIssue[]; nodeCount: number; edgeCount: number }> {
  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  const entries = await getEntriesByProject(projectId);
  if (entries.length === 0) {
    throw new Error('No entries found for one-line diagram');
  }

  const { nodes, edges, issues } = buildDiagramGraph(entries);
  const nodeById = new Map(nodes.map((n) => [n.entry.id, n]));
  const { roots, childrenByParent, depthByNode } = buildHierarchy(nodes, edges, issues);

  // Prefer main source naming conventions as visual anchor.
  const rootNameRank = (id: string): number => {
    const name = (nodeById.get(id)?.name || '').toLowerCase();
    if (name.includes('main switchboard')) return 0;
    if (name.includes('switchboard')) return 1;
    if (name.includes('main')) return 2;
    return 3;
  };
  roots.sort((a, b) => {
    const ra = rootNameRank(a);
    const rb = rootNameRank(b);
    if (ra !== rb) return ra - rb;
    return (nodeById.get(a)?.name || '').localeCompare(nodeById.get(b)?.name || '');
  });

  let bestNodes: PositionedNode[] = [];
  let bestEdges: RoutedEdge[] = [];
  let bestScore = Number.POSITIVE_INFINITY;
  let bestCfg: LayoutConfig | null = null;

  // ANSI D fixed paper (22x34 in), vector points (72 pt/in).
  const ANSI_D_LANDSCAPE = { width: 34 * 72, height: 22 * 72 };
  const ANSI_D_PORTRAIT = { width: 22 * 72, height: 34 * 72 };
  const drawingMargins = { left: 96, right: 96, top: 120, bottom: 96 };
  const drawableLandscape = {
    width: ANSI_D_LANDSCAPE.width - drawingMargins.left - drawingMargins.right,
    height: ANSI_D_LANDSCAPE.height - drawingMargins.top - drawingMargins.bottom,
  };
  const drawablePortrait = {
    width: ANSI_D_PORTRAIT.width - drawingMargins.left - drawingMargins.right,
    height: ANSI_D_PORTRAIT.height - drawingMargins.top - drawingMargins.bottom,
  };

  const attempts: LayoutConfig[] = [
    {
      horizontalGap: 124,
      verticalGap: 210,
      siblingGap: 74,
      nodePadding: 14,
      parentLaneGap: 52,
      branchChannelStep: 64,
      filletRadius: 12,
    },
    {
      horizontalGap: 144,
      verticalGap: 228,
      siblingGap: 88,
      nodePadding: 16,
      parentLaneGap: 58,
      branchChannelStep: 72,
      filletRadius: 13,
    },
    {
      horizontalGap: 168,
      verticalGap: 248,
      siblingGap: 104,
      nodePadding: 18,
      parentLaneGap: 64,
      branchChannelStep: 82,
      filletRadius: 14,
    },
    {
      horizontalGap: 108,
      verticalGap: 190,
      siblingGap: 64,
      nodePadding: 12,
      parentLaneGap: 46,
      branchChannelStep: 56,
      filletRadius: 11,
    },
  ];

  for (const cfg of attempts) {
    const subtreeWidths = computeSubtreeWidths(roots, childrenByParent, nodeById, cfg);
    const placed = placeHierarchy(roots, childrenByParent, depthByNode, subtreeWidths, nodeById, cfg);
    const routed = routeEdges(edges, placed, cfg);
    const validation = validateLayout(placed, routed);
    const bounds = getDiagramBounds(placed);
    const landscapeScale = Math.min(
      1,
      drawableLandscape.width / Math.max(1, bounds.width),
      drawableLandscape.height / Math.max(1, bounds.height)
    );
    const portraitScale = Math.min(
      1,
      drawablePortrait.width / Math.max(1, bounds.width),
      drawablePortrait.height / Math.max(1, bounds.height)
    );
    const preferredScale = Math.max(landscapeScale, portraitScale);
    const scalePenalty =
      preferredScale < 0.6
        ? Math.round((0.6 - preferredScale) * 600)
        : preferredScale > 0.98
          ? Math.round((preferredScale - 0.98) * 120)
          : 0;
    const score =
      validation.nodeOverlaps * 1400 +
      validation.edgeNodeCollisions * 220 +
      validation.labelCrowding * 120 +
      validation.duplicateRoutes * 15 +
      scalePenalty;
    if (score < bestScore) {
      bestScore = score;
      bestNodes = placed;
      bestEdges = routed;
      bestCfg = cfg;
    }
    if (score === 0) break;
  }

  if (bestScore > 0) {
    issues.push({
      entryName: project.name,
      reason: 'Layout auto-expanded to reduce collisions; review PDF if branch density is very high.',
    });
  }

  const validation = validateLayout(bestNodes, bestEdges);
  if (validation.nodeOverlaps > 0) {
    issues.push({
      entryName: project.name,
      reason: `${validation.nodeOverlaps} node overlap(s) detected after layout pass.`,
    });
  }
  if (validation.edgeNodeCollisions > 0) {
    issues.push({
      entryName: project.name,
      reason: `${validation.edgeNodeCollisions} feeder-to-node collision(s) detected after routing pass.`,
    });
  }
  if (validation.labelCrowding > 0) {
    issues.push({
      entryName: project.name,
      reason: `${validation.labelCrowding} potential label-crowding region(s) detected after spacing pass.`,
    });
  }
  const bounds = getDiagramBounds(bestNodes);
  const landscapeScale = Math.min(
    1,
    drawableLandscape.width / Math.max(1, bounds.width),
    drawableLandscape.height / Math.max(1, bounds.height)
  );
  const portraitScale = Math.min(
    1,
    drawablePortrait.width / Math.max(1, bounds.width),
    drawablePortrait.height / Math.max(1, bounds.height)
  );

  // ANSI D default: landscape. Portrait only if materially better fit.
  const usePortrait = portraitScale - landscapeScale > 0.12 && landscapeScale < 0.56;
  const pageWidth = usePortrait ? ANSI_D_PORTRAIT.width : ANSI_D_LANDSCAPE.width;
  const pageHeight = usePortrait ? ANSI_D_PORTRAIT.height : ANSI_D_LANDSCAPE.height;
  const availableWidth = pageWidth - drawingMargins.left - drawingMargins.right;
  const availableHeight = pageHeight - drawingMargins.top - drawingMargins.bottom;
  const scale = Math.min(1, availableWidth / Math.max(1, bounds.width), availableHeight / Math.max(1, bounds.height));
  const offsetX = drawingMargins.left + (availableWidth - bounds.width * scale) / 2 - bounds.minLeft * scale;
  const offsetY = drawingMargins.top + (availableHeight - bounds.height * scale) / 2 - bounds.minTop * scale;

  const doc = new jsPDF({
    orientation: usePortrait ? 'portrait' : 'landscape',
    unit: 'pt',
    format: [pageWidth, pageHeight],
  });

  const tx = (x: number) => x * scale + offsetX;
  const ty = (y: number) => y * scale + offsetY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(25, 25, 25);
  doc.text(`${project.name} - Single Line Diagram`, drawingMargins.left, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(85, 85, 85);
  doc.text(
    `ANSI D (${usePortrait ? '22x34 Portrait' : '34x22 Landscape'})   Entries: ${bestNodes.length}   Connections: ${bestEdges.length}`,
    drawingMargins.left,
    56
  );

  doc.setLineWidth(Math.max(0.8, 1.2 * scale));
  for (const edge of bestEdges) {
    const lineColor = TYPE_COLORS[edge.from.entry.type].line;
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    const points = edge.points.map((p) => ({ x: tx(p.x), y: ty(p.y) }));
    const fillet = (bestCfg?.filletRadius || 12) * scale;
    drawFilletedOrthogonalPath(doc, points, Math.max(6, fillet));
  }

  for (const node of bestNodes) {
    const boxW = node.width * scale;
    const boxH = node.height * scale;
    const left = tx(node.x) - boxW / 2;
    const top = ty(node.y) - boxH / 2;
    const colors = TYPE_COLORS[node.entry.type];
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setFillColor(colors.fill[0], colors.fill[1], colors.fill[2]);
    doc.roundedRect(left, top, boxW, boxH, Math.max(4, 6 * scale), Math.max(4, 6 * scale), 'FD');

    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(Math.max(8, 11 * scale));
    doc.text(node.name || 'Unnamed', left + boxW / 2, top + 16 * scale, { align: 'center', baseline: 'top' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(Math.max(7, 8.5 * scale));
    doc.text(EQUIPMENT_LABELS[node.entry.type], left + boxW / 2, top + 28 * scale, { align: 'center', baseline: 'top' });

    const contentStart = top + 40 * scale;
    const contentEnd = top + boxH - 8 * scale;
    const lineStep = Math.max(8, 9.5 * scale);
    const maxLines = Math.max(0, Math.floor((contentEnd - contentStart) / lineStep));
    let textY = contentStart;
    for (const line of node.lines.slice(0, maxLines)) {
      const short = line.length > 72 ? `${line.slice(0, 69)}...` : line;
      doc.text(short, left + boxW / 2, textY, { align: 'center', baseline: 'top' });
      textY += lineStep;
    }
  }

  const safeName = project.name.replace(/[/\\?%*:|"<>]/g, '-');
  doc.save(`${safeName}_Single_Line_Diagram.pdf`);

  return { issues, nodeCount: bestNodes.length, edgeCount: bestEdges.length };
}
