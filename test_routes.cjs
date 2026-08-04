const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Starting headless browser test...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set larger viewport to avoid responsive layout hiding things
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Logging in...");
  await page.goto('http://localhost:8080/auth', { waitUntil: 'networkidle2' });
  
  // Try to login (we can assume the login page is standard)
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'admin@shastika.com');
    await page.type('input[type="password"]', 'admin123'); // assuming standard
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(e => console.log('Wait for nav timed out or not needed'));
    
    // Check if we got redirected to dashboard
    await new Promise(r => setTimeout(r, (2000));
  } catch (e) {
    console.log("Login failed or not on auth page. Setting auth token manually if needed.");
  }
  
  const rawRoutes = JSON.parse(fs.readFileSync('routes.json', 'utf8'));
  const cleanedRoutes = [];
  
  for (const r of rawRoutes) {
    if (['/auth', '/auth/callback', '/'].includes(r)) continue;
    if (r === '/create' || r === '/verification' || r === '/kyc' || r === '/farm-visits' || r === '/contracts' || r === '/commitments' || r === '/collections' || r === '/payouts' || r === '/rating' || r === '/documents' || r === '/support' || r === '/convert') {
      cleanedRoutes.push('/farmers' + r);
    } else {
      cleanedRoutes.push(r);
    }
  }

  // Remove duplicates
  const routes = [...new Set(cleanedRoutes)];
  
  const working = [];
  const broken = [];

  for (const route of routes) {
    console.log("Testing " + route + " ...");
    let errors = [];
    
    const errHandler = msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Failed to load resource') || text.includes('404')) return; // ignore 404s for network requests mostly
        errors.push(text);
      }
    };
    
    page.on('console', errHandler);
    page.on('pageerror', err => {
      errors.push(err.toString());
    });
    
    try {
      await page.goto('http://localhost:8080' + route, { waitUntil: 'networkidle2', timeout: 10000 });
      // wait a bit for react rendering
      await new Promise(r => setTimeout(r, (1000));
      
      // Check for common error boundaries
      const pageText = await page.evaluate(() => document.body.innerText);
      if (pageText.includes('TypeError:') || pageText.includes('ReferenceError:') || pageText.includes('A runtime error occurred')) {
         errors.push('React Error Boundary or crash detected in DOM');
      }
      
    } catch (e) {
      errors.push("Timeout or Navigation Error: " + e.message);
    }
    
    page.off('console', errHandler);
    
    if (errors.length > 0) {
      broken.push({ route, errors });
      console.log("  [BROKEN]", errors.length, "errors");
    } else {
      working.push(route);
      console.log("  [OK]");
    }
  }

  await browser.close();
  
  console.log("\n====== RESULTS ======");
  console.log("Total routes tested: " + routes.length);
  console.log("Working: " + working.length);
  console.log("Broken: " + broken.length);
  
  fs.writeFileSync('test_results.json', JSON.stringify({ working, broken }, null, 2));
  console.log("Results saved to test_results.json");
})();
