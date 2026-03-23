import React, { useCallback, useEffect, useRef } from 'react';

interface ResizeHandleProps {
  onDragStart?: () => void;
  onDrag: (deltaX: number) => void;
  onDragEnd: () => void;
  onReset: () => void;
}

export default function ResizeHandle({ onDragStart, onDrag, onDragEnd, onReset }: ResizeHandleProps): React.ReactElement {
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    onDrag(deltaX);
  }, [onDrag]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    onDragEnd();
  }, [handleMouseMove, onDragEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    onDragStart?.();
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onDragStart, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = useCallback(() => {
    onReset();
  }, [onReset]);

  // Safety cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className="w-1 flex-shrink-0 cursor-col-resize bg-transparent hover:bg-accent/20 dark:hover:bg-accent-dark/20 transition-colors duration-150"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    />
  );
}
