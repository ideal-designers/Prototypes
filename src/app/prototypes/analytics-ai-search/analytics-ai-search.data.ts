import type { AiBarItem, AiPersonRow, AiStat } from '../../shared/ds';

export type AnalyticsPage = 'dashboard' | 'activity-log';

export type AnswerBlock =
  | { kind: 'stats'; title: string; stats: AiStat[] }
  | { kind: 'bars'; title: string; chartTitle: string; items: AiBarItem[] }
  | { kind: 'people'; title: string; rows: AiPersonRow[]; total: number; noun: string; whenLabel: string };

/** One AI answer — lead text, one data block, closing text. The prototype's
 *  "Answer" switch decides which of the three parts render. */
export interface AnalyticsAnswer {
  id: string;
  lead: string;
  block: AnswerBlock;
  tail: string;
  followUps: string[];
  /** Activity log only — the filters the AI applied to the report underneath. */
  filters?: { period: string; action: string; author?: string };
  /** Activity log only — how many log rows match those filters. */
  matches?: number;
}

export const META = ['Project Nova', 'Last 7 days'];
export const FOOTNOTE = 'Calculated from activity log · Updated 2 min ago';

// ── People ──────────────────────────────────────────────────────────────────

const P = (id: string, name: string, email: string, group: string, when: string): AiPersonRow => ({
  id, name, email, group, when,
  initials: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
});

const DOWNLOADERS: AiPersonRow[] = [
  P('p1', 'Floyd Miles', 'floyd.miles@example.com', 'Bidder A', 'Sep 20, 2026 · 07:20'),
  P('p2', 'Olivia Rhye', 'olivia@gmail.com', 'Legal Team', 'Sep 20, 2026 · 10:15'),
  P('p3', 'Avery Park', 'avery@example.com', 'Sell-side', 'Sep 19, 2026 · 16:04'),
  P('p4', 'Floyd Miles', 'floyd.miles@example.com', 'Legal Team', 'Sep 19, 2026 · 10:15'),
  P('p5', 'Floyd Miles', 'floyd.miles@example.com', 'Sell-side', 'Sep 18, 2026 · 15:04'),
  P('p6', 'Floyd Miles', 'floyd.miles@example.com', 'Legal Team', 'Sep 16, 2026 · 10:15'),
  P('p7', 'Marvin McKinney', 'marvin@bidder-b.com', 'Bidder B', 'Sep 16, 2026 · 09:02'),
  P('p8', 'Jane Cooper', 'jane.cooper@bidder-d.com', 'Bidder D', 'Sep 15, 2026 · 18:40'),
];

const SIGNED_IN: AiPersonRow[] = [
  P('s1', 'Floyd Miles', 'floyd.miles@example.com', 'Bidder A', 'Sep 20, 2026 · 07:20'),
  P('s2', 'Olivia Rhye', 'olivia@gmail.com', 'Legal Team', 'Sep 20, 2026 · 10:15'),
  P('s3', 'Avery Park', 'avery@example.com', 'Sell-side', 'Sep 19, 2026 · 16:04'),
  P('s4', 'Marvin McKinney', 'marvin@bidder-b.com', 'Bidder B', 'Sep 19, 2026 · 10:15'),
  P('s5', 'Jane Cooper', 'jane.cooper@bidder-d.com', 'Bidder D', 'Sep 18, 2026 · 15:04'),
  P('s6', 'Devon Lane', 'devon.lane@bidder-a.com', 'Bidder A', 'Sep 17, 2026 · 11:32'),
  P('s7', 'Kristin Watson', 'kristin@bidder-b.com', 'Bidder B', 'Sep 16, 2026 · 14:08'),
  P('s8', 'Cody Fisher', 'cody.fisher@bidder-d.com', 'Bidder D', 'Sep 15, 2026 · 09:47'),
];

// ── Answers ─────────────────────────────────────────────────────────────────

export const ANSWER_ACTIVITY: AnalyticsAnswer = {
  id: 'activity',
  lead: 'Engagement is still light this week — 8 of 50 invited participants (16%) have signed in, and only 49 of 28,033 files have been opened. Whether that’s expected depends on how long the room has been open: normal for week one, worth flagging if it’s been longer.',
  block: {
    kind: 'stats', title: 'Activity this week',
    stats: [
      { label: 'Total sign-ins', value: '63' },
      { label: 'Signed-in participants', value: '8', note: 'of 50 (16 %)' },
      { label: 'Accessed files', value: '49', note: 'of 28033 (0,17 %)' },
    ],
  },
  tail: 'These numbers likely reflect where the deal is in its timeline rather than a lack of interest — worth checking against when the room was opened before drawing conclusions. If most of the 50 invites went out this week, 16% sign-in is normal early on; if they’ve been pending for a while, it may be worth sending reminders to the 42 who haven’t logged in yet.',
  followUps: ['Who has signed in?', 'How many files have been opened?'],
};

export const ANSWER_TIME: AnalyticsAnswer = {
  id: 'time',
  lead: 'Bidder A leads this week’s engagement (14h 20m) — almost double Bidder B, with Bidder D trailing slightly. Bidder C has effectively gone quiet — barely 12 minutes all week — worth a nudge before the update goes to the deal lead.',
  block: {
    kind: 'bars', title: 'Buyer engagement, this week', chartTitle: 'Time spent by bidder group',
    items: [
      { label: 'Bidder A', value: 860, display: '14 h 20 m' },
      { label: 'Bidder B', value: 545, display: '9 h 05 m' },
      { label: 'Bidder D', value: 400, display: '6 h 40 m' },
      { label: 'Bidder C', value: 12, display: '0 h 12 m' },
    ],
  },
  tail: 'This is the second consecutive week of decline for Bidder C — down from 2h 10m last week to 12 minutes now. The other three groups have held steady or grown slightly over the same period.',
  followUps: ['What did Bidder C look at last week?', 'Draft a nudge to Bidder C'],
};

export const ANSWER_DOWNLOADS: AnalyticsAnswer = {
  id: 'downloads',
  lead: 'There have been 100 downloads across the room in the last 7 days. One name stands out: Floyd Miles accounts for a noticeable share of recent activity, downloading files tied to Bidder A, Legal Team, and Sell-side within the same few days — worth a quick look at whether that’s expected (e.g. an internal reviewer with broad access) or something to flag.',
  block: { kind: 'people', title: 'Last 20 downloads', rows: DOWNLOADERS, total: 100, noun: 'downloads', whenLabel: 'Downloaded' },
  tail: 'If Floyd Miles isn’t meant to have visibility across multiple bidder groups and the sell-side folder simultaneously, this is worth checking against their permission level rather than assuming it’s routine — cross-group access like this is exactly the kind of pattern that’s easy to miss in a raw activity log but stands out once it’s surfaced.',
  followUps: ['Which files did Floyd Miles download?', 'Check Floyd Miles’ permissions'],
  filters: { period: 'Sep 14, 2026 – Sep 20, 2026', action: 'File download' },
  matches: 3,
};

export const ANSWER_SIGNED_IN: AnalyticsAnswer = {
  id: 'signed-in',
  lead: 'Only 8 of the 50 invited participants have signed in so far. Floyd Miles is the only one active across multiple groups — Bidder A, Legal Team, and Sell-side — while the rest have each accessed just one group, as expected.',
  block: { kind: 'people', title: 'Last 20 signed-in participants', rows: SIGNED_IN, total: 8, noun: 'sign-ins', whenLabel: 'Signed in' },
  tail: 'The remaining 42 haven’t signed in at all yet. If most invites went out this week, that’s not unusual this early — but if any of them are meant to be active ahead of Friday’s call, it’s worth sending a direct reminder rather than waiting.',
  followUps: ['Who hasn’t signed in yet?', 'Send a reminder to pending invitees'],
  filters: { period: 'Sep 14, 2026 – Sep 20, 2026', action: 'Login' },
  matches: 8,
};

export const ANSWER_FILES: AnalyticsAnswer = {
  id: 'files',
  lead: '49 files were opened this week — 0.17% of the room. Almost all of them sit in two folders: Legal Agreements and Financial Projections.',
  block: {
    kind: 'stats', title: 'Files opened this week',
    stats: [
      { label: 'Opened files', value: '49', note: 'of 28033 (0,17 %)' },
      { label: 'Legal Agreements', value: '27', note: 'files' },
      { label: 'Financial Projections', value: '18', note: 'files' },
      { label: 'Other folders', value: '4', note: 'files' },
    ],
  },
  tail: 'Nobody has opened the Due Diligence Reports folder yet, even though it was published on Monday — if bidders are expected to be reading it before Friday, it may need a pointer in the next update.',
  followUps: ['Who opened the Legal Agreements?', 'Which bidders haven’t opened anything?'],
};


export const ANSWER_FLOYD_FILES: AnalyticsAnswer = {
  id: 'floyd-files',
  lead: 'Floyd Miles downloaded 14 files this week, from three different areas of the room. Most of them are originals, not watermarked PDFs.',
  block: {
    kind: 'stats', title: 'Floyd Miles · downloads this week',
    stats: [
      { label: 'Bidder A', value: '6', note: 'files · management presentation, Q2 KPIs' },
      { label: 'Legal Team', value: '5', note: 'files · 5.5.1 Merger Agreement and annexes' },
      { label: 'Sell-side', value: '3', note: 'files · teaser, process letter' },
      { label: 'Format', value: '11', note: 'originals, 3 watermarked PDFs' },
    ],
  },
  tail: 'Downloading originals from both a bidder folder and the sell-side folder is the unusual part — if Floyd is an internal reviewer this is expected, otherwise their download permission is broader than it should be.',
  followUps: ['Check Floyd Miles’ permissions', 'Who else downloaded from Sell-side?'],
};

export const ANSWER_FLOYD_PERMS: AnalyticsAnswer = {
  id: 'floyd-perms',
  lead: 'Floyd Miles is in the Legal Team group, which has Download original on the whole room. That is why the cross-group downloads went through.',
  block: {
    kind: 'stats', title: 'Floyd Miles · access',
    stats: [
      { label: 'Group', value: 'Legal Team' },
      { label: 'Role', value: 'User', note: '(not an administrator)' },
      { label: 'Permission', value: 'Download original', note: 'on all folders' },
      { label: 'Added', value: 'Sep 2, 2026', note: 'by Olivia Rhye' },
    ],
  },
  tail: 'If Legal Team only needs to review, lowering it to View or Download PDF would stop originals leaving the room without changing what they can read.',
  followUps: ['Who else is in Legal Team?', 'Show Legal Team downloads'],
};

export const ANSWER_BIDDER_C: AnalyticsAnswer = {
  id: 'bidder-c',
  lead: 'Last week Bidder C spent 2h 10m in the room, almost all of it in Financial Projections. This week they opened only the teaser.',
  block: {
    kind: 'bars', title: 'Bidder C · time by folder, last week', chartTitle: 'Time spent by folder',
    items: [
      { label: 'Financials', value: 96, display: '1 h 36 m' },
      { label: 'Legal', value: 22, display: '0 h 22 m' },
      { label: 'Teaser', value: 12, display: '0 h 12 m' },
      { label: 'Q&A', value: 0, display: '0 h 00 m' },
    ],
  },
  tail: 'They never opened the Legal Agreements folder that went live on Monday — a short nudge pointing at it is the most likely way to get them back in before the deadline.',
  followUps: ['Draft a nudge to Bidder C', 'Who in Bidder C signed in last?'],
};

/** Keyword → answer. Unknown questions get the activity summary. */
export function answerFor(q: string): AnalyticsAnswer {
  const s = q.toLowerCase();
  if (/floyd/.test(s) && /permission|access/.test(s)) return ANSWER_FLOYD_PERMS;
  if (/floyd/.test(s)) return ANSWER_FLOYD_FILES;
  if (/bidder c/.test(s)) return ANSWER_BIDDER_C;
  if (/download/.test(s)) return ANSWER_DOWNLOADS;
  if (/time|spent|engag|bidder group|quiet/.test(s)) return ANSWER_TIME;
  if (/signed in|sign-in|sign in|logged|invited/.test(s)) return ANSWER_SIGNED_IN;
  if (/files? (have been|were)? ?opened|opened|files/.test(s)) return ANSWER_FILES;
  return ANSWER_ACTIVITY;
}

export const RECENTS: Record<AnalyticsPage, string[]> = {
  'dashboard': ['Who’s been invited but hasn’t signed in yet?', 'Give me the full activity history for this project.'],
  'activity-log': ['Who has signed in this week?', 'Give me the full activity history for this project.'],
};

export const PROMPTS: Record<AnalyticsPage, string[]> = {
  'dashboard': [
    'Give me the full activity history for this project.',
    'How much time has each bidder group spent in the room?',
    'Who’s been downloading files this week, and from which groups?',
  ],
  'activity-log': [
    'Who’s been downloading files this week, and from which groups?',
    'Who has signed in this week?',
    'How much time has each bidder group spent in the room?',
  ],
};

// ── Dashboard replica data ──────────────────────────────────────────────────

export const KPI = [
  { label: 'Total sign-ins', value: '1,847' },
  { label: 'Signed-in participants', value: '30', note: 'of 42 (71%)' },
  { label: 'Accessed files', value: '121', note: 'of 168 (72%)' },
];

export const PARTICIPANT_STATES = [
  { tone: 'invited', value: 2, label: 'Invited', share: 7 },
  { tone: 'signed', value: 13, label: 'Signed-in', share: 36 },
  { tone: 'engaged', value: 17, label: 'Engaged', share: 30 },
  { tone: 'deactivated', value: 8, label: 'Deactivated', share: 17 },
  { tone: 'deleted', value: 2, label: 'Deleted', share: 9 },
];

export const FILES_BY_BIDDER = [
  { name: 'Bidder 1', accessed: 121, pct: 72 }, { name: 'Bidder 2', accessed: 99, pct: 59 },
  { name: 'Bidder 3', accessed: 139, pct: 83 }, { name: 'Bidder 4', accessed: 67, pct: 40 },
  { name: 'Bidder 5', accessed: 67, pct: 40 }, { name: 'Bidder 6', accessed: 135, pct: 80 },
  { name: 'Bidder 7', accessed: 135, pct: 80 }, { name: 'Bidder 8', accessed: 135, pct: 80 },
  { name: 'Bidder 9', accessed: 135, pct: 80 }, { name: 'Bidder 10', accessed: 135, pct: 80 },
];

export const GROUP_ROWS = Array.from({ length: 10 }, (_, i) => ({
  name: `Bidder ${i + 1}`,
  signedIn: '16/18',
  signIns: 124 - i * 7,
  delta: i % 2 === 1 ? '+6' : '',
  last: `${(i % 4) + 1}d ago`,
  time: `${40 - i * 3}h ${20 - i}m`,
  files: [87, 59, 83, 40, 40, 80, 80, 80, 80, 80][i],
  qa: `${i % 3 + 1}/6 (${Math.round(((i % 3 + 1) / 6) * 100)}%)`,
}));

// ── Activity log replica data ───────────────────────────────────────────────

export interface LogRow { time: string; name: string; email: string; initials: string; role: 'admin' | 'user'; action: string; detail: string; filePath?: string }
export interface LogDay { day: string; rows: LogRow[] }

const L = (time: string, name: string, email: string, role: LogRow['role'], action: string, detail: string, filePath?: string): LogRow => ({
  time, name, email, role, action, detail, filePath, initials: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
});

export const LOG_ALL: LogDay[] = [
  { day: 'Today', rows: [
    L('4:35:25 PM', 'Olivia Rhye', 'olivia@gmail.com', 'admin', 'File viewing', 'Total viewing time: 1 min 10 sec', '/56 [folder name]/56.1 Asset Purchase Agreement.pdf'),
    L('4:31:02 PM', 'Olivia Rhye', 'olivia@gmail.com', 'admin', 'Login', 'Application type: Web application'),
    L('3:12:47 PM', 'Avery Park', 'avery@gmail.com', 'user', 'Login', 'Application type: Web application'),
  ] },
  { day: 'Yesterday', rows: [
    L('6:02:11 PM', 'Olivia Rhye', 'olivia@gmail.com', 'admin', 'Login', 'Application type: Web application'),
    L('5:48:39 PM', 'Avery Park', 'avery@gmail.com', 'user', 'File viewing', 'Total viewing time: 1 min 10 sec', '/56 [folder name]/56.3 Shareholder Agreement.pdf'),
    L('2:20:05 PM', 'Olivia Rhye', 'olivia@gmail.com', 'admin', 'File viewing', 'Total viewing time: 4 min 32 sec', '/5 Legal Agreements/5.5.1 Merger Agreement.pdf'),
    L('11:15:50 AM', 'Olivia Rhye', 'olivia@gmail.com', 'admin', 'File viewing', 'Total viewing time: 0 min 48 sec', '/3 Financial Projections/FY26 model.xlsx'),
    L('9:03:14 AM', 'Olivia Rhye', 'olivia@gmail.com', 'admin', 'File viewing', 'Total viewing time: 2 min 05 sec', '/5 Legal Agreements/5.6 Regulatory Filings.pdf'),
  ] },
];

/** Log rows once the AI applied its filters — Figma 370:36901 (Floyd Miles surfaces on top). */
export function logFor(a: AnalyticsAnswer | null): LogDay[] {
  if (!a?.filters) return LOG_ALL;
  if (a.filters.action === 'File download') {
    return [
      { day: 'Today', rows: [
        L('7:20:12 AM', 'Floyd Miles', 'floyd.miles@example.com', 'user', 'File download', 'Format: Original', '/1 Bidder A/1.2 Management presentation.pdf'),
      ] },
      { day: 'Sep 19, 2026', rows: [
        L('4:04:51 PM', 'Avery Park', 'avery@example.com', 'user', 'File download', 'Format: PDF with watermark', '/7 Sell-side/7.1 Teaser.pdf'),
        L('10:15:33 AM', 'Floyd Miles', 'floyd.miles@example.com', 'user', 'File download', 'Format: Original', '/5 Legal Agreements/5.5.1 Merger Agreement.pdf'),
      ] },
    ];
  }
  return [
    { day: 'Today', rows: SIGNED_IN.slice(0, 2).map(p => L(p.when.split(' · ')[1] + ':00', p.name, p.email, 'user', 'Login', 'Application type: Web application')) },
    { day: 'This week', rows: SIGNED_IN.slice(2).map(p => L(p.when.split(' · ')[1] + ':00', p.name, p.email, 'user', 'Login', 'Application type: Web application')) },
  ];
}
