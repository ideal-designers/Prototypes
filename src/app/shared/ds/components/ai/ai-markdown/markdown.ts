/**
 * A small, safe markdown subset for assistant answers.
 *
 * Parses to typed blocks rather than an HTML string, so the component renders
 * real text nodes and no model output can ever become markup. Tolerates the
 * half-finished markup that arrives mid-stream: an unclosed fence, a list with
 * no blank line after it, a table whose last row is still being written.
 */

export interface InlineSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
}

export type MdBlockKind = 'heading' | 'paragraph' | 'list' | 'code' | 'table' | 'quote' | 'rule';

/**
 * Flat rather than a discriminated union: Angular templates cannot narrow a
 * union through [ngSwitch], so each kind reads the fields it owns.
 */
export interface MdBlock {
  kind: MdBlockKind;
  /** heading */
  level?: 2 | 3;
  /** heading · paragraph · quote */
  spans?: InlineSpan[];
  /** list */
  ordered?: boolean;
  items?: InlineSpan[][];
  /** code */
  lang?: string;
  text?: string;
  /** table */
  head?: InlineSpan[][];
  rows?: InlineSpan[][][];
}

const RE_INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\n]+\*)|(\[[^\]]+\]\([^)\s]+\))/g;
const RE_TABLE_SEP = /^\s*\|?[\s:|-]*-[\s:|-]*\|[\s:|-]*$/;
const RE_BULLET = /^\s*[-*+]\s+/;
const RE_NUMBER = /^\s*\d+[.)]\s+/;
const RE_RULE = /^(---+|\*\*\*+|___+)$/;

export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RE_INLINE.lastIndex = 0;

  while ((m = RE_INLINE.exec(text))) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    const tok = m[0];

    if (tok.startsWith('`')) {
      spans.push({ text: tok.slice(1, -1), code: true });
    } else if (tok.startsWith('**') || tok.startsWith('__')) {
      spans.push({ text: tok.slice(2, -2), bold: true });
    } else if (tok.startsWith('[')) {
      const cut = tok.indexOf('](');
      spans.push({ text: tok.slice(1, cut), href: tok.slice(cut + 2, -1) });
    } else {
      spans.push({ text: tok.slice(1, -1), italic: true });
    }
    last = m.index + tok.length;
  }

  if (last < text.length) spans.push({ text: text.slice(last) });
  return spans.length ? spans : [{ text }];
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map(cell => cell.trim());
}

/** True when a line opens a new block — used to close a paragraph early. */
function opensBlock(line: string | undefined, next?: string): boolean {
  if (!line) return false;
  const t = line.trimStart();
  if (t.startsWith('```')) return true;
  if (/^#{1,3}\s/.test(t)) return true;
  if (t.startsWith('>')) return true;
  if (RE_BULLET.test(line) || RE_NUMBER.test(line)) return true;
  if (RE_RULE.test(line.trim())) return true;
  if (line.includes('|') && next !== undefined && RE_TABLE_SEP.test(next)) return true;
  return false;
}

export function parseMarkdown(src: string): MdBlock[] {
  const lines = (src ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: MdBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Fenced code. A missing closing fence is normal while streaming.
    if (line.trimStart().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || undefined;
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) body.push(lines[i++]);
      i++;
      blocks.push({ kind: 'code', lang, text: body.join('\n') });
      continue;
    }

    if (RE_RULE.test(line.trim())) { blocks.push({ kind: 'rule' }); i++; continue; }

    // Assistant answers never own an h1 — # collapses to h2.
    const heading = /^(#{1,3})\s+(.*)$/.exec(line.trim());
    if (heading) {
      const level = Math.min(3, Math.max(2, heading[1].length)) as 2 | 3;
      blocks.push({ kind: 'heading', level, spans: parseInline(heading[2]) });
      i++;
      continue;
    }

    // Table — header row followed by a separator row.
    if (line.includes('|') && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1])) {
      const head = splitRow(line).map(parseInline);
      i += 2;
      const rows: InlineSpan[][][] = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        rows.push(splitRow(lines[i]).map(parseInline));
        i++;
      }
      blocks.push({ kind: 'table', head, rows });
      continue;
    }

    if (line.trimStart().startsWith('>')) {
      const body: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        body.push(lines[i++].replace(/^\s*>\s?/, ''));
      }
      blocks.push({ kind: 'quote', spans: parseInline(body.join(' ')) });
      continue;
    }

    if (RE_BULLET.test(line) || RE_NUMBER.test(line)) {
      const ordered = RE_NUMBER.test(line);
      const marker = ordered ? RE_NUMBER : RE_BULLET;
      const items: InlineSpan[][] = [];
      while (i < lines.length && marker.test(lines[i])) {
        items.push(parseInline(lines[i].replace(marker, '')));
        i++;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    // Paragraph — soft-wrapped lines join into one.
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !(para.length && opensBlock(lines[i], lines[i + 1]))) {
      para.push(lines[i++]);
    }
    blocks.push({ kind: 'paragraph', spans: parseInline(para.join(' ')) });
  }

  return blocks;
}
