import React, { useState, useCallback, useRef, useEffect } from 'react';

export type SplitDirection = 'horizontal' | 'vertical';

interface SplitPaneProps {
  direction?: SplitDirection;
  defaultSplit?: number;
  minSize?: number;
  maxSize?: number;
  children: [React.ReactNode, React.ReactNode];
}

export function SplitPane({
  direction = 'horizontal',
  defaultSplit = 50,
  minSize = 20,
  maxSize = 80,
  children,
}: SplitPaneProps) {
  const [split, setSplit] = useState(defaultSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newSplit: number;

      if (direction === 'horizontal') {
        newSplit = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        newSplit = ((e.clientY - rect.top) / rect.height) * 100;
      }

      newSplit = Math.max(minSize, Math.min(maxSize, newSplit));
      setSplit(newSplit);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [direction, minSize, maxSize]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`split-pane ${isHorizontal ? 'horizontal' : 'vertical'}`}
    >
      <div
        className="split-pane-first"
        style={isHorizontal ? { width: `${split}%` } : { height: `${split}%` }}
      >
        {children[0]}
      </div>
      <div
        className="split-pane-divider"
        onMouseDown={handleMouseDown}
      />
      <div
        className="split-pane-second"
        style={isHorizontal ? { width: `${100 - split}%` } : { height: `${100 - split}%` }}
      >
        {children[1]}
      </div>
    </div>
  );
}

interface MultiSplitPaneProps {
  direction?: SplitDirection;
  defaultSplits?: number[];
  minSize?: number;
  children: React.ReactNode[];
}

export function MultiSplitPane({
  direction = 'horizontal',
  defaultSplits,
  minSize = 20,
  children,
}: MultiSplitPaneProps) {
  const [splits, setSplits] = useState<number[]>(
    defaultSplits || Array(children.length - 1).fill(100 / children.length)
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const draggedIndex = useRef<number | null>(null);

  const handleMouseDown = useCallback((index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    draggedIndex.current = index;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedIndex.current === null || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalSize = direction === 'horizontal' ? rect.width : rect.height;
      const position = direction === 'horizontal' 
        ? e.clientX - rect.left 
        : e.clientY - rect.top;

      const newSplits = [...splits];
      const delta = ((position / totalSize) * 100) - newSplits.slice(0, draggedIndex.current + 1).reduce((a, b) => a + b, 0);
      
      const currentSplit = newSplits[draggedIndex.current];
      const newSplit = Math.max(minSize, Math.min(100 - minSize * (children.length - draggedIndex.current - 1), currentSplit + delta));
      
      newSplits[draggedIndex.current] = newSplit;
      
      const scale = currentSplit / newSplit;
      for (let i = 0; i < draggedIndex.current; i++) {
        newSplits[i] *= scale;
      }
      for (let i = draggedIndex.current + 1; i < newSplits.length; i++) {
        newSplits[i] *= scale;
      }

      setSplits(newSplits);
    };

    const handleMouseUp = () => {
      draggedIndex.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [splits, direction, minSize, children.length]);

  const isHorizontal = direction === 'horizontal';
  let accumulatedSize = 0;

  return (
    <div
      ref={containerRef}
      className={`split-pane multi ${isHorizontal ? 'horizontal' : 'vertical'}`}
    >
      {React.Children.map(children, (child, index) => {
        const size = index === children.length - 1 
          ? 100 - accumulatedSize 
          : splits[index];
        accumulatedSize += size;

        return (
          <div
            key={index}
            className="split-pane-item"
            style={isHorizontal ? { width: `${size}%` } : { height: `${size}%` }}
          >
            {child}
          </div>
        );
      })}
      {React.Children.map(children, (_, index) => {
        if (index === children.length - 1) return null;
        return (
          <div
            key={`divider-${index}`}
            className="split-pane-divider"
            onMouseDown={handleMouseDown(index)}
          />
        );
      })}
    </div>
  );
}
