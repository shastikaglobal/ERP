const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to auth page...");
  await page.goto('https://erp.shastikaglobalexport.co.in/auth', { waitUntil: 'networkidle0' });

  // 1. Fill out Login Form
  console.log("Filling out login form...");
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'kim.swathi.07@gmail.com');
  
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', 'admin123');
  
  // Click Sign In
  console.log("Clicking Sign In...");
  const [signInBtn] = await page.$x("//button[contains(., 'Sign In')]");
  if (signInBtn) {
    await signInBtn.click();
  } else {
    // try to find by class or other means if xpath fails
    await page.click('button[type="submit"]');
  }

  // Wait for login to complete and dashboard to load
  console.log("Waiting for dashboard...");
  await page.waitForFunction(() => {
    return window.location.href.includes('/dashboard') || document.body.innerText.includes('Welcome');
  }, { timeout: 15000 });

  // 2. Navigate to Farm Visits
  console.log("Navigating to Farm Visits page...");
  await page.goto('https://erp.shastikaglobalexport.co.in/farmers/farm-visits', { waitUntil: 'networkidle0' });

  // Wait for React to render the button
  console.log("Waiting for Schedule New Visit button...");
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.innerText.includes('Schedule New Visit'));
  }, { timeout: 15000 });

  // Click Schedule New Visit
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Schedule New Visit'));
    addBtn.click();
  });
  console.log("Opened Schedule New Visit modal");

  // Wait for the form to appear
  console.log("Waiting for form to populate...");
  await page.waitForFunction(() => {
    const selects = document.querySelectorAll('select');
    return selects.length > 0 && selects[0].options.length > 1;
  }, { timeout: 15000 });
  
  await page.evaluate(() => {
    const selects = document.querySelectorAll('select');
    // Select first farmer
    selects[0].value = selects[0].options[1].value;
    selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    
    // Set Date
    const inputs = document.querySelectorAll('input[type="datetime-local"]');
    if (inputs.length > 0) {
      inputs[0].value = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Select employee
    if (selects.length > 1) {
      selects[1].value = selects[1].options[1].value;
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Select purpose
    if (selects.length > 2) {
      selects[2].value = 'Quality Check';
      selects[2].dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Fill Notes
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      textareas[0].value = 'Puppeteer UI E2E Test Visit from Browser!';
      textareas[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  console.log("Filled out the form");

  // 6. Submit (wait a bit for state to settle)
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const saveBtn = btns.find(b => b.innerText.includes('Save Visit'));
    saveBtn.click();
  });
  console.log("Clicked Save Visit");

  // 7. Wait for modal to close
  console.log("Waiting for modal to close...");
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Save Visit');
  }, { timeout: 15000 });
  console.log("Modal closed successfully (React State Updated)");

  // 8. Verify the new row is in the table
  console.log("Verifying row is in table...");
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Puppeteer UI E2E Test Visit from Browser!');
  }, { timeout: 15000 });
  console.log("Verified the new row is instantly visible in the table!");

  // Take screenshot for proof
  await page.screenshot({ path: 'puppeteer_ui_proof.png' });
  console.log("Saved screenshot to puppeteer_ui_proof.png");

  await browser.close();
})();
