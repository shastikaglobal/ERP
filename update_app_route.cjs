const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const Auth = lazy(() => import("./pages/Auth"));',
  'const Auth = lazy(() => import("./pages/Auth"));\nconst ForceReset = lazy(() => import("./pages/ForceReset"));'
);

content = content.replace(
  '<Route path="/auth" element={<Auth />} />',
  '<Route path="/auth" element={<Auth />} />\n            <Route path="/force-reset" element={<ForceReset />} />'
);

fs.writeFileSync(file, content);
console.log('Fixed App.tsx');
