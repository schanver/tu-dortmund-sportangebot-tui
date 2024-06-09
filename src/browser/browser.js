import puppeteer from 'puppeteer';

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false, // Set to true if you don't need to see the browser actions
    slowMo: 150 // Uncomment this line to slow down operations by 250ms for better observation
  });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto('https://www.buchsys.ahs.tu-dortmund.de/angebote/aktueller_zeitraum/', {
    waitUntil: 'networkidle2', // Ensure the page is fully loaded
    timeout: 60000 // Set a reasonable timeout
  });

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // Wait for the container element to be loaded
  await page.waitForSelector('div#bs_content dl.bs_menu', { timeout: 60000 });

  // Get the container element
  const container = await page.$('div#bs_content dl.bs_menu');

  if (container) {
    console.log('Container found. Looking for anchor elements...');

    // Find all anchor elements within the container
    const anchors = await container.$$('a');

    if (anchors.length > 0) {
      let found = false;
      // Iterate through all anchor elements to find the one with "Yoga" text
      for (const anchor of anchors) {
        const anchorText = await page.evaluate(el => el.textContent.trim(), anchor); // Use trim to remove any extra spaces
        if (anchorText.toLowerCase().includes('intervall training')) {
          // Scroll into view of the anchor element
          await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), anchor);
          
          // Wait for a short time to ensure scroll is completed
          //await page.waitForFunction('window.innerWidth < 100'); 
          // Click the anchor element with the text "Yoga"
          console.log('Clicking on anchor with text "Intervall Training"...');
          await anchor.click();
          found = true;
          console.log('Clicked on anchor with text:', anchorText);
          // Wait for the navigation to complete
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
          break;
        }
      }
      if (!found) {
        console.log('No anchor element with the text "Intervall Training" found.');
      }
    } else {
      console.log('No anchor elements found.');
    }
  } else {
    console.log('Container element not found.');
  }

  // Uncomment the following line to close the browser when done
  await browser.close();
})();
