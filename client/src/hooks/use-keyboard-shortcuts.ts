import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Don't trigger shortcuts when user is typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key === shortcut.key;
        const ctrlMatches = !!event.ctrlKey === !!shortcut.ctrlKey;
        const shiftMatches = !!event.shiftKey === !!shortcut.shiftKey;
        const altMatches = !!event.altKey === !!shortcut.altKey;
        const metaMatches = !!event.metaKey === !!shortcut.metaKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Global keyboard shortcuts hook for the main app
export function useGlobalKeyboardShortcuts() {
  const [, setLocation] = useLocation();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "n",
      ctrlKey: true,
      action: () => setLocation("/?create=true"),
      description: "Create new project"
    },
    {
      key: "P",
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        // Focus the search input in the header
        const searchInput = document.querySelector('[data-testid="input-search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: "Search projects"
    },
    {
      key: "Escape",
      action: () => {
        // Close any open dialogs or modals
        const closeButtons = document.querySelectorAll('[data-radix-collection-item]');
        if (closeButtons.length > 0) {
          const lastCloseButton = closeButtons[closeButtons.length - 1] as HTMLElement;
          lastCloseButton.click();
        }
        
        // Also blur any focused input
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
          activeElement.blur();
        }
      },
      description: "Close dialogs and clear focus"
    }
  ];

  useKeyboardShortcuts({ shortcuts });

  return { shortcuts };
}