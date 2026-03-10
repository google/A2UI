import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const result = await page.evaluate(() => {
    try {
      eval('(class A { static { this.foo = "bar"; } })');
      return "SUCCESS";
    } catch (e) {
      return e.toString();
    }
  });

  console.log("EVAL RESULT: ", result);
  await browser.close();
})();
