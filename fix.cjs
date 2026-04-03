const fs = require('fs');

let file = fs.readFileSync('app/admin/page.tsx', 'utf-8');

// remove everything from the last `} ` inside the map to the end and replace it correctly
file = file.replace(/                  <\/div>\n                <\/Link>\n              \);\n            }\)}\n          <\/div>\n        <\/section>\n      <\/div>\n    <\/div>\n  \);\n}\n[\s\S]*/m, 
`                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}`);

fs.writeFileSync('app/admin/page.tsx', file);
