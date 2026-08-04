const fs = require('fs');
let content = fs.readFileSync('src/components/ProtectedRoute.tsx', 'utf8');

// Add profileLoadError state
content = content.replace(
  'const profileRetryCount = useRef(0);',
  'const profileRetryCount = useRef(0);\n  const [profileLoadError, setProfileLoadError] = useState(false);'
);

// Set error when retry count >= 10
content = content.replace(
  'if (profileRetryCount.current >= 10) {',
  'if (profileRetryCount.current >= 10) {\n        setProfileLoadError(true);'
);

// Modify the loading UI
content = content.replace(
  '<p className="mt-4 text-sm text-muted-foreground animate-pulse">Setting up your account...</p>',
  `{profileLoadError ? (
            <div className="mt-4 flex flex-col items-center">
              <p className="text-sm text-red-500 font-medium">Failed to load profile data.</p>
              <button onClick={() => window.location.reload()} className="mt-2 text-xs px-3 py-1 bg-primary text-primary-foreground rounded">Retry</button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">Setting up your account...</p>
          )}`
);

fs.writeFileSync('src/components/ProtectedRoute.tsx', content);
console.log('Updated ProtectedRoute.tsx');
