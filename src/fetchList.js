import puppeteer from 'puppeteer';

// This should fetch the list

export async function fetchList() {
  const browser = await puppeteer.launch({headless: 'shell'});
  let page = await browser.newPage();
  //await page.setViewport({ width: 1980, height: 1200 });


  await page.goto('https://www.buchsys.ahs.tu-dortmund.de/angebote/aktueller_zeitraum/', 
    {
      timeout: 10000
    });
  try {
    // Wait for the menu to load
    await page.waitForSelector('div#bs_content dl.bs_menu', { timeout: 6000 });

    // Retrieve all course names within the menu
    const courseNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div#bs_content dl.bs_menu a'))
        .map(anchor => anchor.textContent.trim());
    });
    //console.table(courseNames);
    console.debug("Course list fetched...");
    return courseNames; // Return the array of course names
  } catch (error) {
    console.error('Error fetching courses:', error);
    return []; // Return an empty array if there's an error
  } finally {
    await page.close();
  }
};

