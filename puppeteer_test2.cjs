const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzIyZWNjOC1lYzFmLTRhZmItYWNmOC00NDRkM2JkYmE2NzciLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODU5MjU4ODcsImV4cCI6MTc4NTk2MTg4N30.eicX0xXgavgBWqAMkqBvZbSN7skp5ysZ6T00l79tTaE';

  await page.goto('https://erp.shastikaglobalexport.co.in/auth');
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('user', JSON.stringify({id: "4722ecc8-ec1f-4afb-acf8-444d3bdba677", full_name: "Swathi", role: "admin"}));
  }, token);

  await page.goto('https://erp.shastikaglobalexport.co.in/farmers/farm-visits', { waitUntil: 'networkidle0' });
  console.log("Navigated to Farm Visits page");

  // Wait for React to render the button
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.innerText.includes('Schedule New Visit'));
  }, { timeout: 10000 });

  // Click Schedule New Visit
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Schedule New Visit'));
    addBtn.click();
  });
  console.log("Opened Schedule New Visit modal");

  // Wait for the form to appear
  await page.waitForFunction(() => {
    const selects = document.querySelectorAll('select');
    return selects.length > 0 && selects[0].options.length > 1;
  }, { timeout: 10000 });
  
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
      textareas[0].value = 'Puppeteer E2E Test Visit from Browser!';
      textareas[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  console.log("Filled out the form");

  // 6. Submit (wait a bit for state to settle)
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const saveBtn = btns.find(b => b.innerText.includes('Save Visit'));
    saveBtn.click();
  });
  console.log("Clicked Save Visit");

  // 7. Wait for modal to close (it will only close on success)
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Save Visit');
  }, { timeout: 10000 });
  console.log("Modal closed successfully (React State Updated)");

  // 8. Verify the new row is in the table
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Puppeteer E2E Test Visit from Browser!');
  }, { timeout: 10000 });
  console.log("Verified the new row is instantly visible in the table!");

  // Take screenshot for proof
  await page.screenshot({ path: 'puppeteer_proof.png' });
  console.log("Saved screenshot to puppeteer_proof.png");

  await browser.close();
})();
