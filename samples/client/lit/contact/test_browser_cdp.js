import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const cdp = await page.target().createCDPSession();

  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  cdp.on('Runtime.exceptionThrown', (event) => {
    console.log("CRASH URL:", event.exceptionDetails.url);
    console.log("LINE:", event.exceptionDetails.lineNumber);
    console.log("COL:", event.exceptionDetails.columnNumber);
    if (event.exceptionDetails.exception) {
      console.log("MSG:", event.exceptionDetails.exception.description);
    }
  });

  await page.goto('http://localhost:5176');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
