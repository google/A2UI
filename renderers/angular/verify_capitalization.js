/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { chromium } = require('playwright');

(async () => {
    console.log('Starting Capitalization Regression Test...');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:4200/');
        
        // Click on 'Capitalized Text' example
        await page.click('text=Capitalized Text');
        
        // Wait for input to be visible and type 'regression test'
        await page.waitForSelector('input');
        await page.type('input', 'regression test');
        
        // Wait for short delay simulating server loop
        await page.waitForTimeout(200);
        
        // Inspect DOM for the output
        const textContent = await page.innerText('.rendered-content');
        console.log(`Detected Rendered Area Text: "${textContent}"`);
        
        if (textContent.includes('Regression test')) {
            console.log('✅ Regression Test Passed!');
            await browser.close();
            process.exit(0);
        } else {
            console.error(`❌ Regression Test Failed! Expected "Regression test", but got "${outputText}"`);
            await browser.close();
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Error during regression test:', err.message);
        await browser.close();
        process.exit(1);
    }
})();
