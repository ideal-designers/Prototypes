import { Injectable } from '@angular/core';
import { MockDocument } from '../models/mock-doc.model';

/** Intents the proxy can return, mapped onto the existing answer renderers. */
export type LlmIntent = 'find' | 'summarize' | 'signatures' | 'report' | 'answer' | 'none';

export interface LlmResult {
  intent: LlmIntent;
  documentIds: string[];
  text: string;
  followUp: string;
}

/**
 * Client for the `/api/ask` Gemini proxy.
 *
 * Only document metadata leaves the browser — never document bodies. Every failure
 * path returns null so the engine can fall back to its scripted answer: the
 * prototype has to keep demoing when there is no key, no network, or a rate limit.
 */
@Injectable()
export class AiLlmService {
  /** Set once a call fails, so a broken key doesn't stall every later question. */
  private unavailable = false;

  get isUnavailable(): boolean {
    return this.unavailable;
  }

  async ask(query: string, documents: MockDocument[], scope?: string): Promise<LlmResult | null> {
    if (this.unavailable) return null;

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          scope,
          documents: documents.map((d) => ({
            id: d.id,
            index: d.index,
            name: d.name,
            type: d.type,
            folderPath: d.folderPath,
            sizeLabel: d.sizeLabel,
            pages: d.pages,
            addedOn: d.addedOn,
            signatureStatus: d.signatureStatus,
            gist: d.gist,
          })),
        }),
      });

      if (!res.ok) {
        // 503 = no key configured. 502 usually wraps an upstream 429 (the free tier's
        // quota is tight). Either way, stop calling for the rest of the session rather
        // than making every later question wait on a doomed request.
        if (res.status === 503 || res.status === 502) this.unavailable = true;
        return null;
      }

      const json = (await res.json()) as LlmResult;
      return json?.intent ? json : null;
    } catch {
      return null;
    }
  }
}
