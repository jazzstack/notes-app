import { Note } from '@notes-app/shared';
import { parseWikiLinks, resolveLinkToNote } from './links';

export interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  sourceTitle: string;
  targetTitle: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraphData(notes: Note[]): GraphData {
  const nodes: GraphNode[] = notes.map((note, index) => {
    const angle = (2 * Math.PI * index) / notes.length;
    const radius = Math.min(300, notes.length * 30);
    return {
      id: note.id,
      title: note.title || 'Untitled',
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const edges: GraphEdge[] = [];
  const addedEdges = new Set<string>();

  notes.forEach((note) => {
    const links = parseWikiLinks(note.content);
    
    links.forEach((link) => {
      const linkedNote = resolveLinkToNote(link.title, notes);
      
      if (linkedNote && linkedNote.id !== note.id) {
        const edgeKey = [note.id, linkedNote.id].sort().join('-');
        
        if (!addedEdges.has(edgeKey)) {
          addedEdges.add(edgeKey);
          edges.push({
            source: note.id,
            target: linkedNote.id,
            sourceTitle: note.title || 'Untitled',
            targetTitle: linkedNote.title || 'Untitled',
          });
        }
      }
    });
  });

  return { nodes, edges };
}

export function simulateForces(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations: number = 100
): GraphNode[] {
  const nodesCopy = nodes.map(n => ({ ...n }));
  const nodeMap = new Map(nodesCopy.map(n => [n.id, n]));

  for (let i = 0; i < iterations; i++) {
    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 50 / (distance * distance);
        
        source.vx += dx * force * 0.1;
        source.vy += dy * force * 0.1;
        target.vx -= dx * force * 0.1;
        target.vy -= dy * force * 0.1;
      }
    });

    nodesCopy.forEach((node) => {
      if (node.fx !== undefined && node.fy !== undefined) {
        node.x = node.fx;
        node.y = node.fy;
        return;
      }

      nodesCopy.forEach((other) => {
        if (node.id !== other.id) {
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (distance < 100) {
            node.vx -= dx * 0.01;
            node.vy -= dy * 0.01;
          }
        }
      });

      const centerX = 400;
      const centerY = 300;
      node.vx += (centerX - node.x) * 0.001;
      node.vy += (centerY - node.y) * 0.001;

      node.vx *= 0.9;
      node.vy *= 0.9;

      node.x += node.vx;
      node.y += node.vy;

      node.x = Math.max(50, Math.min(750, node.x));
      node.y = Math.max(50, Math.min(550, node.y));
    });
  }

  return nodesCopy;
}

export function getConnectedNodes(nodeId: string, edges: GraphEdge[]): string[] {
  const connected = new Set<string>();
  
  edges.forEach((edge) => {
    if (edge.source === nodeId) {
      connected.add(edge.target);
    } else if (edge.target === nodeId) {
      connected.add(edge.source);
    }
  });
  
  return Array.from(connected);
}
