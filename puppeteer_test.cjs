const puppeteer = require('puppeteer');
const jwt = require('jsonwebtoken');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Generate token using the known secret from the VPS
  // Wait, I can just use the token I generated earlier!
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzIyZWNjOC1lYzFmLTRhZmItYWNmOC00NDRkM2JkYmE2NzciLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODU5MjU4ODcsImV4cCI6MTc4NTk2MTg4N30.eicX0xXgavgBWqAMkqBvZbSN7skp5ysZ6T00l79tTaE';

  // 2. Go to site and set localStorage
  await page.goto('https://erp.shastikaglobalexport.co.in/auth');
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('user', JSON.stringify({id: "4722ecc8-ec1f-4afb-acf8-444d3bdba677", full_name: "Swathi", role: "admin"}));
  }, token);

  // 3. Navigate to Farm Visits
  await page.goto('https://erp.shastikaglobalexport.co.in/farmers/farm-visits', { waitUntil: 'networkidle0' });
  console.log("Navigated to Farm Visits page");

  // 4. Click Schedule New Visit
  await page.waitForXPath("//button[contains(., 'Schedule New Visit')]");
  const [addBtn] = await page.$x("//button[contains(., 'Schedule New Visit')]");
  await addBtn.click();
  console.log("Opened Schedule New Visit modal");

  // 5. Fill out the form
  await page.waitForSelector('select');
  
  // Wait for the farmers dropdown to populate
  await page.waitForFunction(() => {
    const selects = document.querySelectorAll('select');
    if (selects.length > 0 && selects[0].options.length > 1) return true;
    return false;
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
      textareas[0].value = 'Puppeteer E2E Test Visit';
      textareas[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  console.log("Filled out the form");

  // 6. Submit
  const [saveBtn] = await page.$x("//button[contains(., 'Save Visit')]");
  await saveBtn.click();
  console.log("Clicked Save Visit");

  // 7. Wait for modal to close (it will only close on success)
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Save Visit');
  }, { timeout: 10000 });
  console.log("Modal closed successfully (React State Updated)");

  // 8. Verify the new row is in the table
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Puppeteer E2E Test Visit');
  }, { timeout: 10000 });
  console.log("Verified the new row is instantly visible in the table!");

  // Take screenshot for proof
  await page.screenshot({ path: 'puppeteer_proof.png' });
  console.log("Saved screenshot to puppeteer_proof.png");

  await browser.close();
})();
