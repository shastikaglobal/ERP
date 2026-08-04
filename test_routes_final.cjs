const fs = require('fs');

function log(msg) {
  fs.appendFileSync('audit_progress.txt', msg + '\n');
  console.log(msg);
}

async function run() {
  fs.writeFileSync('audit_progress.txt', 'Starting audit...\n');
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  log('Logging in...');
  await page.goto('http://localhost:8080/auth');
  try {
    await page.waitForSelector('input[name="username_field_9321"]', { timeout: 10000 });
    await page.type('input[name="username_field_9321"]', 'swathitae35@gmail.com');
    await page.type('input[name="password_field_9321"]', 'Admin@Password123!');
    await page.click('button[type="submit"]');
    await page.waitForFunction('window.location.pathname !== "/auth"', { timeout: 10000 });
    log('Login successful! Current URL: ' + page.url());
  } catch(e) {
    log('Login error: ' + e.message);
  }

  const rawRoutes = JSON.parse(fs.readFileSync('routes.json', 'utf8'));
  const cleanedRoutes = [];
  for (const r of rawRoutes) {
    if (['/auth', '/auth/callback', '/'].includes(r)) continue;
    if (['/create', '/verification', '/kyc', '/farm-visits', '/contracts', '/commitments', '/collections', '/payouts', '/rating', '/documents', '/support', '/convert'].includes(r)) {
      cleanedRoutes.push('/farmers' + r);
    } else {
      cleanedRoutes.push(r);
    }
  }
  const routes = [...new Set(cleanedRoutes)];
  const results = { working: [], broken: [] };
  
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    log('[' + (i+1) + '/' + routes.length + '] Testing ' + route + ' ...');
    
    let errors = [];
    const onConsole = msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
          errors.push(text);
        }
      }
    };
    const onPageError = err => errors.push(err.toString());
    
    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    
    try {
      await page.goto('http://localhost:8080' + route, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000)); // wait a short bit for react to mount
      
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('TypeError:') || bodyText.includes('ReferenceError:') || bodyText.includes('A runtime error occurred') || bodyText.includes('Application Error')) {
        errors.push('React Error Boundary or runtime crash detected in DOM');
      }
    } catch(e) {
      if (e.message.includes('ERR_CONNECTION_REFUSED')) {
         errors.push('Connection Refused - is dev server running on 8080?');
      } else {
         errors.push('Navigation Error: ' + e.message);
      }
    }
    
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    
    if (errors.length > 0) {
      log('  -> BROKEN: ' + errors[0].substring(0, 100));
      results.broken.push({ route, errors });
    } else {
      log('  -> OK');
      results.working.push(route);
    }
  }

  await browser.close();
  fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
  log('Finished. Results saved to test_results.json');
}

run().catch(e => log('Fatal error: ' + e.message));
