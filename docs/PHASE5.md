# Phase 5: Graph View (Visual Layer)

## Overview

This phase adds an interactive graph visualization that displays notes as nodes and wikilinks as edges. The graph provides a visual way to explore connections between notes in your knowledge base.

## Features

### 1. Graph Visualization
- **Nodes** represent notes (larger nodes have connections, smaller are orphan notes)
- **Edges** represent wikilinks between notes
- Force-directed layout algorithm for automatic positioning
- Nodes are color-coded:
  - **Accent color**: Current note (when viewing from note page)
  - **Accent muted**: Connected to selected note
  - **Gray**: Other notes

### 2. Interactive Controls
- **Zoom**: Mouse wheel or zoom buttons
- **Pan**: Click and drag on empty space
- **Select**: Click a node to highlight it and its connections
- **Navigate**: Click a node to open that note

### 3. Navigation
- Access graph view from the top bar (graph icon)
- Route: `/graph`
- Current note is highlighted when viewing from a note page

## File Structure

```
src/
├── pages/
│   └── GraphPage.tsx      # Graph view page component
├── utils/
│   └── graph.ts           # Graph data utilities
│   └── links.ts           # Link parsing (from Phase 3)
└── styles/
    └── layout.css         # Graph styles
```

## Implementation Details

### Graph Data (`src/utils/graph.ts`)

```typescript
interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
  sourceTitle: string;
  targetTitle: string;
}

// Build graph from notes
buildGraphData(notes: Note[]): { nodes: GraphNode[]; edges: GraphEdge[] }

// Apply force simulation
simulateForces(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[]

// Get connected nodes
getConnectedNodes(nodeId: string, edges: GraphEdge[]): string[]
```

### GraphView Component (`src/pages/GraphPage.tsx`)

```typescript
interface GraphViewProps {
  notes: Note[];
  currentNoteId?: string;
}
```

### Force Simulation Algorithm

The graph uses a simplified force-directed layout:
1. **Attraction**: Connected nodes are pulled toward each other
2. **Repulsion**: All nodes repel each other to prevent overlap
3. **Centering**: Nodes are gently pulled toward the center
4. **Damping**: Velocity is reduced over time to stabilize the layout

## Usage

### Accessing the Graph

1. Click the **Graph icon** in the top bar
2. Or navigate to `/graph` directly

### Interactions

| Action | How |
|--------|-----|
| Pan | Click and drag on empty space |
| Zoom in | Mouse wheel up or click + button |
| Zoom out | Mouse wheel down or click - button |
| Reset view | Click maximize button |
| Select node | Click on a node |
| Open note | Double-click or click then confirm |

### Visual Feedback

- **Hover**: Node scales up slightly
- **Selected**: Node and its connections are highlighted
- **Labels**: Show on hover, selection, or connected nodes

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.graph-container` | Container for the entire graph view |
| `.graph-svg` | SVG canvas for rendering |
| `.graph-controls` | Zoom and reset buttons |
| `.graph-control-btn` | Individual control buttons |
| `.graph-legend` | Legend showing node colors |
| `.graph-nodes` | Group containing all node elements |
| `.graph-edges` | Group containing all edge elements |
| `.node-circle` | Individual node circles |
| `.node-label` | Text labels for nodes |

## Empty State

When there are no notes to visualize, the graph shows:
- Empty state message
- Instructions to create notes with [[wikilinks]]

## Future Enhancements

- [ ] Draggable nodes (fix position)
- [ ] Cluster/grouping by tags
- [ ] Node size based on backlink count
- [ ] Filter by tags
- [ ] Search within graph
- [ ] Mini-map for navigation
- [ ] Animation controls
- [ ] Export as image
- [ ] 3D graph view
