import puppeteer from 'puppeteer';
import { isDebugMode } from '../index.js';

// This should fetch the list

export async function fetchList() {
  const browser = await puppeteer.launch({headless: 'shell'});
  let page = await browser.newPage();

  await page.goto('https://www.buchsys.ahs.tu-dortmund.de/angebote/aktueller_zeitraum/', 
    {
      timeout: 15000
    });
  try {
    // Wait for the menu to load
    await page.waitForSelector('div#bs_content dl.bs_menu', { timeout: 10000 });

    // Retrieve all course names within the menu
    const courseNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div#bs_content dl.bs_menu a'))
        .filter(anchor => !["SPORTKARTE","alle freien Kursplätze dieses Zeitraums"].includes(anchor.textContent.trim()))
        .map(anchor => anchor.textContent.trim());
    });
    if(isDebugMode) console.debug("Kursliste ist abgerufen.");
    return courseNames;
  } catch (error) {
    console.error("Fehler beim Abrufen der Kursliste" , error);
    return [];
  } finally {
    await page.close();
  }
};

