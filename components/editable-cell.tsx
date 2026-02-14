"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: "text" | "number";
  className?: string;
  displayValue?: React.ReactNode;
}

export function EditableCell({
  value,
  onSave,
  type = "text",
  className = "",
  displayValue,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value));
    }
  }, [value, isEditing]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (type === "number") {
      const parsed = parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
      if (!Number.isNaN(parsed)) {
        onSave(parsed);
      } else if (trimmed === "" || trimmed === "-") {
        onSave(0);
      }
    } else {
      onSave(trimmed);
    }
  }, [editValue, onSave, type]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        setEditValue(String(value));
        setIsEditing(false);
      } else if (e.key === "Tab") {
        handleSave();
      }
    },
    [handleSave, value]
  );

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`border-primary/50 ring-primary/30 tabular-nums bg-background w-full rounded px-1.5 py-0.5 text-sm outline-none ring-1 ${className}`}
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onDoubleClick={() => setIsEditing(true)}
      onKeyDown={(e) => e.key === "Enter" && setIsEditing(true)}
      className={`hover:bg-primary/5 hover:outline-primary/20 min-h-[24px] cursor-cell rounded px-1.5 py-0.5 transition-colors hover:outline hover:outline-1 -mx-1.5 -my-0.5 ${className}`}
      title="Double-click to edit"
    >
      {displayValue ?? value}
    </div>
  );
}
