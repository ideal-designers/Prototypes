import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import type { PdfItem } from './bulk-redaction.data';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface PdfPageSize { w: number; h: number }

/**
 * The one mock document every file in this prototype shows — the same /assets/pdfs/protocol.pdf the
 * /redaction-viewer prototype uses. Loaded once; text items are cached at scale 1 (PDF points).
 */
@Injectable({ providedIn: 'root' })
export class BrPdfService {
  private docP?: Promise<any>;
  private itemsP?: Promise<PdfItem[]>;
  private sizesP?: Promise<PdfPageSize[]>;
  private thumbP?: Promise<string>;

  doc(): Promise<any> {
    return (this.docP ??= pdfjsLib.getDocument('/assets/pdfs/protocol.pdf').promise);
  }

  pageSizes(): Promise<PdfPageSize[]> {
    return (this.sizesP ??= (async () => {
      const doc = await this.doc();
      const out: PdfPageSize[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const v = (await doc.getPage(i)).getViewport({ scale: 1 });
        out.push({ w: v.width, h: v.height });
      }
      return out;
    })());
  }

  /** First-page thumbnail (data URL) for the document info card. */
  thumb(): Promise<string> {
    return (this.thumbP ??= (async () => {
      const page = await (await this.doc()).getPage(1);
      const viewport = page.getViewport({ scale: 0.3 });
      const cv = document.createElement('canvas');
      cv.width = viewport.width;
      cv.height = viewport.height;
      await page.render({ canvasContext: cv.getContext('2d')!, viewport }).promise;
      return cv.toDataURL('image/png');
    })().catch(() => ''));
  }

  items(): Promise<PdfItem[]> {
    return (this.itemsP ??= (async () => {
      const doc = await this.doc();
      const out: PdfItem[] = [];
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        for (const it of content.items as any[]) {
          if (!it.str || !it.str.trim()) continue;
          const tx = pdfjsLib.Util.transform(viewport.transform, it.transform);
          out.push({ text: it.str, page: p, x: Math.max(0, tx[4]), y: Math.max(0, tx[5] - it.height),
            w: Math.max(it.width, 4), h: Math.max(it.height, 8) });
        }
      }
      return out;
    })().catch(() => []));
  }
}
