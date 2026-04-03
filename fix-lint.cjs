const fs = require('fs');

let file = fs.readFileSync('app/admin/page.tsx', 'utf-8');

file = file.replace(/formatAdminRole,\\n/, '');
file = file.replace('moduleCards,\\n', '');
file = file.replace('technicianLoadCards', '_technicianLoadCards');

// Remove the formatInsightLabel function
file = file.replace(/function formatInsightLabel[\s\S]*?\}\n/, '');

// Find the line with className and replace it
file = file.replace(/className="block rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-400 hover:bg-emerald-50\/40"/, 
'className="block rounded-2xl bg-surface-low p-6 transition-all hover:bg-surface-high border-l-[4px] border-transparent hover:border-primary"');

fs.writeFileSync('app/admin/page.tsx', file);
