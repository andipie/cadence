import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function handleToggle(value: string): void {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const hasSelection = selected.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
          hasSelection
            ? 'border-accent dark:border-accent-dark bg-accent/10 text-accent dark:text-accent-dark'
            : 'border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-text-secondary dark:hover:border-text-secondary-dark'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Nach ${label} filtern`}
      >
        {label}
        {hasSelection && (
          <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent dark:bg-accent-dark text-white text-[10px]">
            {selected.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg shadow-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark py-1">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-primary dark:text-text-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="rounded border-border dark:border-border-dark text-accent dark:text-accent-dark focus:ring-accent dark:focus:ring-accent-dark"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
