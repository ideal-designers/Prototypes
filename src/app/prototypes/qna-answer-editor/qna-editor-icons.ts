import { TINYMCE_ICONS } from '../../shared/ds/components/text-editor/editor-icons';

/**
 * Toolbar icons for the QnA answer editor replica.
 * Reuses the Figma-exported SVGs already registered for the DS text editor
 * (bold / text-color / highlight-bg-color / list-num-default / align-left / remove-formatting / link),
 * plus a few glyphs the product toolbar has that aren't part of that set.
 */
export const QNA_EDITOR_ICONS = {
  bold: TINYMCE_ICONS['bold'],
  textColor: TINYMCE_ICONS['text-color'],
  highlight: TINYMCE_ICONS['highlight-bg-color'],
  listNum: TINYMCE_ICONS['list-num-default'],
  alignLeft: TINYMCE_ICONS['align-left'],
  clearFormat: TINYMCE_ICONS['remove-formatting'],
  link: TINYMCE_ICONS['link'],

  caret: `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  smiley: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 9.5C5.5 9.5 6.4 11 8 11C9.6 11 10.5 9.5 10.5 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M5.75 6.25H5.76" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10.25 6.25H10.26" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  attachment: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.9 6.55L7.4 12.05C6.13 13.32 4.07 13.32 2.8 12.05C1.53 10.78 1.53 8.72 2.8 7.45L8.3 1.95C9.15 1.1 10.53 1.1 11.38 1.95C12.23 2.8 12.23 4.18 11.38 5.03L6.13 10.28C5.7 10.71 5 10.71 4.58 10.28C4.15 9.86 4.15 9.16 4.58 8.73L9.33 3.98" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  send: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8H13.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 3L14 8L8.5 13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};
