import type { RuleSet } from './bulk-redaction.data';

/** A page asks the host to start detection (the host may first ask what to do with existing marks). */
export interface StartRequest {
  nodes: string[];
  rules: RuleSet;
  /** Concept 1 confirms with a toast; concept 2 shows the progress panel instead. */
  toast: boolean;
  done: () => void;
  /** Closes the page's own dialog (concept 2's Redact modal) before the host asks about existing marks. */
  closeUi?: () => void;
  /** Reopens it again if the person cancels that question. */
  reopen?: () => void;
}
/** A page asks the host to open the full-screen viewer on a batch of files. */
export interface ViewRequest { ids: string[]; index: number }

/**
 * Menus rebuilt on every change-detection pass hand the DS droplist brand-new item objects, which
 * makes it re-create its buttons under the pointer and swallows clicks. Cache by a cheap key.
 */
export class Memo<T> {
  private cache = new Map<string, T>();
  get(key: string, make: () => T): T {
    let v = this.cache.get(key);
    if (v === undefined) {
      if (this.cache.size > 200) this.cache.clear();
      v = make();
      this.cache.set(key, v);
    }
    return v;
  }
}
