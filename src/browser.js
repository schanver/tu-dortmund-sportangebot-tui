import boxen from 'boxen';
import chalk from "chalk";
import { chromium, firefox } from 'playwright';
import inquirer  from "inquirer";
import InterruptedPrompt from "inquirer-interrupted-prompt";
import autocompletePrompt from "inquirer-autocomplete-prompt";
import "dotenv/config";
import { menu,showBanner,isDebugMode } from "./../index.js";
import { fetchList } from "./fetchList.js";
import { PROJECT_ROOT } from "./config.js";
import path from "path";
import { mkdir } from "fs/promises";
import { saveToJson } from "./database.js";

inquirer.registerPrompt('autocomplete',autocompletePrompt);
InterruptedPrompt.fromAll(inquirer);

export const browserName = (process.env.BROWSER || 'chromium').toLowerCase();
export const browsers = { chromium, firefox };
export const browserType = browsers[browserName] || chromium;
let bookingCompleted = false;

export const visitorStatus = [
  "",
  "S-TUD",
  "S-FHD",
  "S-FH/RUB",
  "S-aH",
  "B-TUDO",
  "B-FHDO",
  "B-STWDO",
  "Azubi TU",
  "GH",
  "Extern",
  "B-FHRUB",
  "B-aH"
];
let courseList = [];


async function searchCourses(_, input) {

  input = input || '';
  return courseList.filter(course =>
    typeof course === 'string' && course.toLowerCase().includes(input.toLowerCase()));
}

function stripAnsi(str) {
    return str.replace(/\x1B\[[0-9;]*m/g, '');
}

export const selectCourse = async () => {
console.clear();
console.log(await showBanner());
courseList = await fetchList();

const courses = await inquirer.prompt({
type: 'autocomplete',
name: 'selectedCourse',
message: 'Bitte wählen Sie einen Kurs oder geben Sie den Kursname ein, drücken Sie die Taste <ESC>, um zurück zum Hauptmenü zu gehen',
searchText: 'Suche nach dem Kurs...',
emptyText: 'Keine Kurse gefunden!',
source : searchCourses,
pageSize: 20
})
.catch(async (error) => {
    if(error.isTtyError) {
    } else {
      if(error === InterruptedPrompt.EVENT_INTERRUPTED) {
        await menu();
      }
    }
  });
  const courseName = courses.selectedCourse;
  await selectCourseDay(courseName);
};

export const bookSportsCard = async () => {
  const browser = await browserType.launch({
    headless: true,
    args: [
      '--disable-features=AutofillCreditCardEnabled,AutofillSaveCardEnabled,AutofillIBANEnabled',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-notifications'
    ]
  });
  const context = await browser.newContext();
  let page = await context.newPage();
  await page.goto
(
    'https://www.buchsys.ahs.tu-dortmund.de/angebote/aktueller_zeitraum/_SPORTKARTE.html',
    {
      timeout: 20000
    }
  );

  const bookingMenu = await page.$('.bs_kurse');
 if (bookingMenu) {
    console.log('✅ Buchungsmenü ist gefunden!');
  } else {
    console.error('❌ Buchungsmenü nicht gefunden.');
    await browser.close();
    process.exit(1);
  }

  const rows = await page.$$('.bs_kurse tbody tr');
  let bookingSuccessful = false;

  for (const row of rows) {
    try {
      const button = await row.$('td:last-child input[type="submit"].bs_btn_buchen');
      if (button) {
        const buttonName = await button.getAttribute('name');
        console.log(`🎯 Buchung verfügbar: ${buttonName}`);

        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          page.click(`input[type="submit"][name="${buttonName}"]`),
        ]);

        page = newPage;
        await page.waitForLoadState('networkidle');

        console.log(`🎉 Buchung wurde eingeleitet: ${buttonName}`);
        bookingSuccessful = true;
        break;
      }
    } catch (error) {
      console.error('❌ Fehler beim Buchen:', error);
    }
  }

  if (!bookingSuccessful) {
    console.error('❌ Keine Buchung derzeit verfügbar.');
    await browser.close();
    process.exit(1);
  }
  await fillCredentials(page, 'SPORTKARTE', '', '');
};

const selectCourseDay = async (courseName) => {
  const browser = await browserType.launch({
    headless: true,
    args: [
      '--disable-features=AutofillCreditCardEnabled,AutofillSaveCardEnabled,AutofillIBANEnabled',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-notifications'
    ]
  });
  let context = await browser.newContext({
    viewport: null
  });
 let page = await context.newPage();

  await page.goto('https://www.buchsys.ahs.tu-dortmund.de/angebote/aktueller_zeitraum/', 
    {
      timeout: 20000
    });
  // Wait for the main div to load
  await page.waitForSelector('div#bs_content dl.bs_menu', { timeout: 6000 });
  const container = await page.$('div#bs_content dl.bs_menu');

  if(container) {
    if(isDebugMode) console.debug(`Suche nach dem Kurs ${courseName}`);
    const anchors = await page.$$('a');
    if(anchors.length > 0) 
  {
      let found = false;
      for(const anchor of anchors) {
        const anchorText = await page.evaluate(el => el.textContent.trim(), anchor); // Use trim to remove any extra spaces
        if(isDebugMode) console.debug(`Vergleich von ${anchorText} mit ${courseName}...`);
        if(anchorText.toLowerCase() === courseName.toLowerCase()) {
          // Scroll into view of the anchor element
          await page.evaluate(el => el.scrollIntoView(), anchor);
          if(isDebugMode) console.debug('Clicken auf ' + courseName + '...');
          const oldContent = await page.content();
          await anchor.click();

          await page.waitForFunction(old => document.body.innerHTML !== old, oldContent, {
            timeout: 10000
          });
          found = true;
          if(isDebugMode) console.debug(`Auf ${courseName} geclickt...`);
          // Wait for the navigation to complete
          break; 
        }  
      }
      if(!found) { 
        console.error("Dieser Kurs ist leider nicht gefunden!");
        await selectCourse();
        process.exit(0);
      }
    }
  }

  const bookingMenu = await page.$('.bs_kurse');
  if(bookingMenu) {
    if(isDebugMode) console.debug("Buchungsmenu ist gefunden...");
    await page.evaluate(el => el.scrollIntoView({behavior: 'smooth', block: 'center'}), bookingMenu);
  }


  const {tableData,courseIDs} = await page.evaluate(() => {
    const rows = document.querySelectorAll('.bs_kurse tbody tr');
    let data = []
    let localIDs = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');

      // Create an object for the current row
      let tableObject = {
        name:'',
        place:'',
        time: '',
        day: '',
        status: '',
        id :''
      };

      if(cells) {
        cells.forEach((cell, index) => {
          if(index == 1) { // Name of the course
            tableObject.name = cell.textContent.trim();
          }
          else if(index == 2) { // Day of the course
            tableObject.day = cell.innerHTML ? cell.innerHTML.split('<br>')[0].trim() : "";
          }
          else if(index == 3) { // Time of the course
            tableObject.time = cell.innerHTML ? cell.innerHTML.split('<br>')[0].trim() : "";
          }
          else if(index == 4) { // Location of the course
            tableObject.place = cell.innerHTML ? 
              cell.innerHTML.replace(/<a[^>]*>(.*?)<\/a>/g, '$1')                              // Don't ask me what this regex does...
              .replace(/<br\s*\/?>/gi, ' ')
              .trim() : "";
          } 
          else if(index == cells.length - 1) { // Booking button or status
            const button = cell.querySelector('input[type="submit"]');
            if(button) {
              console.log(button.name);
              if(button.classList.contains('bs_btn_buchen')) { // Booking button available
                tableObject.status = button.value.trim();
                tableObject.id = button.name;
                localIDs.push(tableObject.id);
              } 
              else if(button.classList.contains('bs_btn_ausgebucht')) { // Course is fully booked
                tableObject.status = button.value.trim();
                tableObject.disabled = 'Dieser Kurs ist ausgebucht!';
                localIDs.push(button.name);
              }
              else if(button.classList.contains('bs_btn_warteliste')) {
                tableObject.status = button.value.trim();
                tableObject.disabled = 'Dieser Kurs ist ausgebucht!';
                localIDs.push(button.name);
              }
            }
            else { // No booking button available
              tableObject.disabled = cell.textContent.trim();
              localIDs.push("x");
            }
          }
        });

        // Push the tableObject after processing all cells for this row
        data.push(tableObject);
      }
    });

    return { tableData: data, courseIDs: localIDs };
  });

  const courseInfoCombined = tableData.map((course, index) => {
    const courseInfo = `${course.name},${course.day},${course.time},${course.place},${course.status}`;
    const isDisabled = course.disabled ? course.disabled : false;
    const coloredCourseInfo = isDisabled ? chalk.red(courseInfo) : chalk.green(courseInfo);
    return {
      name: coloredCourseInfo,
      disabled : isDisabled,
    };
  });

  const germanText = await page.$eval('.bs_kursbeschreibung .bslang_de', el => el.innerText.trim());
  console.log(boxen(germanText));
  // Print the list of available courses
  const availableCourses = await inquirer.prompt(
    {
      type:'list',
      name:'bookSelectedCourse',
      message:'Welchen Kurs möchten Sie buchen?',
      choices: courseInfoCombined
    })
    .catch(async (error) => {
      if(error.isTtyError) {
      } else {
        if(error === InterruptedPrompt.EVENT_INTERRUPTED) {
          await selectCourse();
        }
      }
    });
  const courseParts = availableCourses.bookSelectedCourse.split(",");
  const courseID = tableData.find(obj => 
    obj.name === stripAnsi(courseParts[0]) &&
      obj.day  === stripAnsi(courseParts[1]) &&
      obj.time === stripAnsi(courseParts[2])
  );
  if(isDebugMode) console.debug(`Die Taste mit dem ID ${courseID} wurde geclickt...`);

  context = page.context();

  try {
    // Wait for a new page to be opened by the click
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click(`input[type="submit"][name="${courseID.id}"]`),
    ]);

    // Switch page reference to the new tab
    page = newPage;

    // Wait for network idle on the new page
    await page.waitForLoadState('networkidle');

    // Now you can continue using 'page' as the new tab
  } catch (error) {
    console.error("Fehler beim Clicken auf der Taste oder Wartung auf das Ziel:", error);
    page = null; // or handle error as needed
  }
  // Change the current page 
  const title = await page.title();
  if(isDebugMode) console.debug("This is the title of date thingy: " + title);

  const dateSelector = await page.$$(".bs_form_uni.bs_left.padding0");
  // This is used to differentiate weekly and one-time bookings; if this selector is present, then it is a weekly booking 
  if(dateSelector.length > 0) {
    const divText = await page.evaluate(div => {
      const bookingDate = [];
      const children = div.children;

      for(let child of children) {
        bookingDate.push(child.innerText.trim());
      }

      return bookingDate;
    }, dateSelector[0]);


    // Click on the button if it has "buchen" on the name   
    const bookingButton = await page.$('input[type="submit"][class="inlbutton buchen"][value="buchen"]');
    // Ensure the button exists
    if(bookingButton) { 
      await Promise.all([
        page.waitForLoadState('networkidle'),
        bookingButton.click()
      ]);
      await fillCredentials(page,courseName, courseID, divText[1]);
    } else {
      console.error("Keine Taste zur Buchung ist verfügbar");
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      await selectCourse();
    }
  } else {
    console.error("Es ist zurzeit keine Buchung zu diesem Angebot verfügbar.Gehe zurück ins Menü...");
    await new Promise(resolve => setTimeout(resolve, 3000)); 
    await menu();
  }
} 

const fillCredentials = async (page, courseName, courseID,date) => {
  
  try {
  console.log("Die Textfelder wird ausgefüllt, bitte haben Sie etwas Geduld...");

  await page.locator(`input[name="sex"][value="${process.env.GESCHLECHT}"]`).check();

  await page.locator('#BS_F1100').click();
  await page.locator('#BS_F1100').fill(process.env.NAME || "");

  await page.locator('#BS_F1200').click();
  await page.locator('#BS_F1200').fill(process.env.NACHNAME || "");

  await page.locator('#BS_F1300').click();
  await page.locator('#BS_F1300').fill(process.env.STRASSE_NR);

  await page.locator('#BS_F1400').click();
  await page.locator('#BS_F1400').fill(process.env.PLZ_STADT);

  if (isDebugMode) {
    console.debug(`Name: ${process.env.NAME}`);
    console.debug(`Nachname: ${process.env.NACHNAME}`);
    console.debug(`Straßenummer: ${process.env.STRASSE_NR}`);
    console.debug(`PLZ und Stadt: ${process.env.PLZ_STADT}`);
  }

  // Status auswählen
  const userStatus = visitorStatus[parseInt(process.env.STATUS)];
  await page.locator('#BS_F1600').selectOption(userStatus);

  if (isDebugMode) console.debug(`Status: ${userStatus}`);

  const matriculationField = page.locator('#BS_F1700');
  if (await matriculationField.isVisible() && await matriculationField.isEnabled()) {
    await matriculationField.click();
    await matriculationField.fill(process.env.MATRIKEL_NR);
    if (isDebugMode) console.debug(`Matrikelnummer: ${process.env.MATRIKEL_NR}`);
  }

  const phoneField = page.locator('#BS_F1800');
  if (await phoneField.isVisible() && await phoneField.isEnabled()) {
    await phoneField.click();
    await phoneField.fill(process.env.DIENSTL_NR);
    if (isDebugMode) console.debug(`Dienstleistungsnummer: ${process.env.DIENSTL_NR}`);
  }

  if (isDebugMode) console.debug(`Email: ${process.env.EMAIL}`);
  await page.locator('#BS_F2000').click();
  await page.locator('#BS_F2000').fill(process.env.EMAIL);

  if (isDebugMode) console.debug(`Telefonnummer: ${process.env.TELEFON_NR}`);
  await page.locator('#BS_F2100').click();
  await page.locator('#BS_F2100').fill(process.env.TELEFON_NR);

  const ibanField = page.locator('#BS_F_iban');
  if (await ibanField.isVisible() && await ibanField.isEnabled()) {
    await ibanField.click();
    await ibanField.fill(process.env.IBAN);
  }

  // Teilnahmebedingungen akzeptieren
  await page.locator('input[type="checkbox"][name="tnbed"]').check();

  // Submit-Button klicken
  const submit = page.locator('#bs_submit');
  await submit.scrollIntoViewIfNeeded();
  await submit.waitFor({ state: 'visible' });
  await submit.click();

  if (isDebugMode) console.log('Submit button clicked – waiting for validation...');

  // Auf mögliche Warnungen warten
  try {
    await page.waitForFunction(() => {
      return document.querySelectorAll('.warn').length > 0;
    }, { timeout: 6000 });
  } catch (e) {
    if (isDebugMode) console.log('No validation warnings appeared.');
  }

  // Warnungen sammeln
  const warnings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.bs_form_row.warn'))
      .map(row => {
        const label = row.querySelector('label');
        return label ? label.textContent.trim() : 'Unknown field';
      });
  });

  if (warnings.length > 0) {
    console.log("⚠️ Das/die folgende(n) Feld(er) ist/sind entweder falsch ausgefüllt oder lee");
    warnings.forEach(w => console.log(" -", w));
    process.exit(0);
  } else {
    console.log("✅ No warnings – proceeding.");
  }
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input[type="submit"][value="verbindlich buchen"]', { timeout: 5000 });

  const verbindlichBtn = page.locator('input[type="submit"][value="verbindlich buchen"]');
  const kostenpflichtigBtn = page.locator('input[type="submit"][value="kostenpflichtig buchen"]');

  if (await verbindlichBtn.isVisible()) {
    await verbindlichBtn.click();
  } else if (await kostenpflichtigBtn.isVisible()) {
    await kostenpflichtigBtn.click();
  } else {
    console.log("Keine verfügbare Button gefunden!");
  }

  if (isDebugMode) console.log('Auf dem Submit-Button geclickt...');
  await page.waitForLoadState('networkidle');
  const alreadyBooked = await page.locator('form[name="bsform"] .bs_meldung').isVisible();
  if (alreadyBooked) {
    const bookingMessage = await page.locator('form[name="bsform"] .bs_meldung').innerText();
    console.log(chalk.yellow("Meldung vom Buchungssystem:"));
    console.log(bookingMessage);
    await page.waitForTimeout(5000);
    await menu();
  } else {
    console.log(chalk.greenBright("Der Kurs ist erfolgreich gebucht!"));
    bookingCompleted = true;
    if (isDebugMode) console.debug("Buchungszustand " + bookingCompleted);
    await saveToJson({
      courseName: `${courseName} ${courseID?.name || " "}`,
      courseDate: date || " ",
      courseTime: courseID?.time || " "
    });
    await page.waitForTimeout(3000);
  }
} catch (error) {
  console.error("❌ Fehler im Buchungsprozess:", error);
}
  finally {
    if(bookingCompleted) {
    const picName = `${date} ${courseName} ${courseID?.name || " "}`; 
    const screenshotDir = path.resolve(PROJECT_ROOT, 'screenshots');
    await mkdir(screenshotDir, { recursive: true });

    const picDir = path.resolve(screenshotDir, `${picName}.png`); 
    // Take a screenshot and save it to the constructed path
    await page.screenshot({ path: picDir});
    console.log(`Buchungsfoto kann in \"screenshots\"-Ordner gefunden werden`);
    console.log("Browser wird geschlossen, bitte haben Sie etwas Geduld...");
    await new Promise(resolve => setTimeout(resolve,2000));
    }
    await page.close();
    await menu();
  }

}

