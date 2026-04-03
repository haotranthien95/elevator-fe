const fs = require('fs');

const file = fs.readFileSync('app/admin/page.tsx', 'utf-8');
const beforeSection = file.split('<section className="space-y-6">')[0];
// Ensure correct closing tags:
const fixed = beforeSection + `      </div>\n    </div>\n  );\n}`;
fs.writeFileSync('app/admin/page.tsx', fixed);
console.log('Fixed page.tsx');
