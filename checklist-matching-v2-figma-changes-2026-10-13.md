# DD checklist AI matching v2: Figma changes, 13.10.2026

Source: Staging Hub / FVDR / NT, section "Concept v2" (38483:164847). Applied to the prototype `/checklist-matching`.

## Source file mode
1. **Not read yet:** "Edit" becomes secondary. The only primary action on the screen is "Extract requests" in the AI card.
2. **Results in the file's columns:** "Export" also appears in the Source file toolbar (Only you · Share · Export).

## Requests mode
3. **Check what was read (list):**
   - the last column is "Source file", showing a grey "Row N" badge instead of a link;
   - type badges by colour: Document request = Blue, Question = Magenta, Note = Stone, Instruction = Coffee.
4. **Matching card:** ring, then **Matching "All documents in Lighthouse"** (the chosen scope), then the matching-items icon with "214 of 640 documents", then a clock icon with "about 2 min left".
5. **Matching list:** "Row" is a grey badge, not a link.
6. **Results table:** after a decision the row gets a green note "Accepted as partial by you · just now".
7. **Bulk "Ask about gaps" removed:** the screen is gone from the design, so the "Ask about N gaps" button and its modal are removed.
8. **Export menu:** the warning keeps only "Review first"; "Preview in file" is gone.
9. **Read failed:** a "Duplicates" illustration (sheet + magnifier) above the title.

## Drawers
10. **Header:** the status badge is size 24 (md); the ↑↓ arrows are grouped.
11. **Request meta:** labels in Label S (14 semibold), values in Body 2 (15). Row is a grey badge.
12. **Section headings:** Label M (15 semibold) in every drawer.
13. **Suggested document:** the name in regular weight; the path is a green link that opens the folder.
14. **"Needs attention":** with an AI icon (Icon Ai, double sparkle) before the heading.
15. **"If you accept, your file gets" → a Status dropdown** (Covered / Partial / Gap / Not applicable). The default comes from AI's verdict; Save writes the chosen status.
16. **Footer:** Save + Reject on the left, **Ask Seller** on the right (secondary). It opens the question to the seller.
17. **What AI read:** headings in Label M; field labels (Found, Read from, Columns, Status values) in Label S; "rows 1–3" in Body 3 secondary.

## Unchanged
Empty state, AI is reading, Requests found, the gap drawer (except the Row badge), the results row (filters / Review / coverage), the toast.
