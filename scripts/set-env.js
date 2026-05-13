const fs = require('fs');
const path = require('path');

// Trim + escape single quotes to guard against stray whitespace/newlines from env vars
const clean = (v) => (v || '').trim().replace(/'/g, "\\'");
const supabaseUrl = clean(process.env['SUPABASE_URL']);
const supabaseAnonKey = clean(process.env['SUPABASE_ANON_KEY']);
const password = clean(process.env['PROTO_PASSWORD']);
const posthogKey = clean(process.env['POSTHOG_KEY']);
const tinymceApiKey = clean(process.env['TINYMCE_API_KEY']);

const content = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseAnonKey: '${supabaseAnonKey}',
  password: '${password}',
  posthogKey: '${posthogKey}',
  tinymceApiKey: '${tinymceApiKey}',
};
`;

fs.writeFileSync(
  path.join(__dirname, '../src/environments/environment.prod.ts'),
  content
);

console.log(`environment.prod.ts generated (SUPABASE_URL set: ${!!supabaseUrl}, SUPABASE_ANON_KEY set: ${!!supabaseAnonKey}, POSTHOG_KEY set: ${!!posthogKey})`);
