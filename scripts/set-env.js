const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env['SUPABASE_URL'] || '';
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] || '';

const content = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseAnonKey: '${supabaseAnonKey}',
};
`;

fs.writeFileSync(
  path.join(__dirname, '../src/environments/environment.prod.ts'),
  content
);

console.log('environment.prod.ts generated');
