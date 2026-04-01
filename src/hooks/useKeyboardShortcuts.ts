import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger in inputs/textareas
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: { key: string; ctrl?: boolean; shift?: boolean; description: string }[] }) {
  return (
    <div className="space-y-2">
      {shortcuts.map((s, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{s.description}</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
            {s.ctrl && 'Ctrl+'}
            {s.shift && 'Shift+'}
            {s.key.toUpperCase()}
          </kbd>
        </div>
      ))}
    </div>
  );
}
