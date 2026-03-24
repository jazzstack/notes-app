import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Note } from '@notes-app/shared';
import { buildGraphData, simulateForces, getConnectedNodes, GraphNode } from '../utils/graph';
import { Icons } from '@notes-app/ui';
import { useNotesStore } from '../store/notesStore';
import { useLocation } from 'react-router-dom';

export function GraphPage() {
  const notes = useNotesStore((state) => state.notes);
  const location = useLocation();
  const currentNoteId = location.pathname.includes('/note/') 
    ? location.pathname.split('/note/')[1] 
    : undefined;
  
  return <GraphView notes={notes} currentNoteId={currentNoteId} />;
}

interface GraphViewProps {
  notes: Note[];
  currentNoteId?: string;
}

export function GraphView({ notes, currentNoteId }: GraphViewProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [positions, setPositions] = useState<GraphNode[]>([]);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const graphData = useMemo(() => buildGraphData(notes), [notes]);

  useEffect(() => {
    const simulated = simulateForces(graphData.nodes, graphData.edges, 150);
    setPositions(simulated);
  }, [graphData]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, zoom * delta));
    setZoom(newZoom);
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && !draggedNode) {
      const dx = (e.clientX - lastMousePos.current.x) / zoom;
      const dy = (e.clientY - lastMousePos.current.y) / zoom;
      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy,
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging, draggedNode, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    setSelectedNode(nodeId);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    navigate(`/note/${nodeId}`);
  }, [navigate]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(3, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.3, prev / 1.2));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setViewBox({ x: 0, y: 0, width: 800, height: 600 });
  }, []);

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return new Set(getConnectedNodes(selectedNode, graphData.edges));
  }, [selectedNode, graphData.edges]);

  const getNodeColor = useCallback((nodeId: string) => {
    if (nodeId === currentNoteId) return 'var(--color-accent)';
    if (nodeId === selectedNode) return 'var(--color-accent-hover)';
    if (hoveredNode === nodeId) return 'var(--color-accent)';
    if (connectedNodes.has(nodeId)) return 'var(--color-accent-muted)';
    return 'var(--color-text-tertiary)';
  }, [currentNoteId, selectedNode, hoveredNode, connectedNodes]);

  const getEdgeOpacity = useCallback((sourceId: string, targetId: string) => {
    if (!selectedNode) return 0.3;
    if (sourceId === selectedNode || targetId === selectedNode) return 0.8;
    if (connectedNodes.has(sourceId) && connectedNodes.has(targetId)) return 0.5;
    return 0.1;
  }, [selectedNode, connectedNodes]);

  if (notes.length === 0) {
    return (
      <div className="graph-empty">
        <Icons.Graph style={{ width: 64, height: 64 }} />
        <h2>No notes to visualize</h2>
        <p>Create some notes with [[wikilinks]] to see your knowledge graph</p>
      </div>
    );
  }

  return (
    <div className="graph-container" ref={containerRef}>
      <div className="graph-controls">
        <button className="graph-control-btn" onClick={handleZoomIn} title="Zoom In">
          <Icons.ZoomIn />
        </button>
        <button className="graph-control-btn" onClick={handleZoomOut} title="Zoom Out">
          <Icons.ZoomOut />
        </button>
        <button className="graph-control-btn" onClick={handleReset} title="Reset View">
          <Icons.Maximize />
        </button>
      </div>

      <svg
        className="graph-svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / zoom} ${viewBox.height / zoom}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-text-tertiary)" />
          </marker>
        </defs>

        <g className="graph-edges">
          {graphData.edges.map((edge, index) => {
            const sourceNode = positions.find((n) => n.id === edge.source);
            const targetNode = positions.find((n) => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;

            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            return (
              <g key={`edge-${index}`}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={midX}
                  y2={midY}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  opacity={getEdgeOpacity(edge.source, edge.target)}
                />
                <line
                  x1={midX}
                  y1={midY}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  opacity={getEdgeOpacity(edge.source, edge.target)}
                />
              </g>
            );
          })}
        </g>

        <g className="graph-nodes">
          {positions.map((node) => {
            const hasConnections = graphData.edges.some(
              (e) => e.source === node.id || e.target === node.id
            );
            const radius = hasConnections ? 8 : 5;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={radius + 4}
                  fill="transparent"
                  className="node-hitbox"
                />
                <circle
                  r={radius}
                  fill={getNodeColor(node.id)}
                  className="node-circle"
                />
                {hoveredNode === node.id || selectedNode === node.id || connectedNodes.has(node.id) ? (
                  <text
                    className="node-label"
                    y={-radius - 8}
                    textAnchor="middle"
                    fill="var(--color-text)"
                  >
                    {node.title.length > 20 ? node.title.slice(0, 20) + '...' : node.title}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="graph-legend">
        <div className="graph-legend-item">
          <span className="graph-legend-dot current" />
          <span>Current note</span>
        </div>
        <div className="graph-legend-item">
          <span className="graph-legend-dot connected" />
          <span>Connected</span>
        </div>
        <div className="graph-legend-item">
          <span className="graph-legend-dot other" />
          <span>Other notes</span>
        </div>
      </div>
    </div>
  );
}
