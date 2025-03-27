import chalk from "chalk";
import puppeteer from "puppeteer";
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

const browser = await puppeteer.launch({headless: 'shell'});
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

// To speed up load time when testing without headless mode
const dontLoadMediaContent = async (page) => {
  // Do not load media or styles to save some loading time 
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    const resourceType = request.resourceType();
    if(resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media' || url.endsWith('.svg')) {
      request.abort();
    } else {
      request.continue();
    }
  });
};

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

const selectCourseDay = async (courseName) => {

  let page = await browser.newPage();
  await page.setViewport({ width: 1980, height: 1200 });
  
//await dontLoadMediaContent(page);

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
          if(isDebugMode) console.debug(`Comparing ${anchorText} to ${courseName}...`);
          if(anchorText.toLowerCase() === courseName.toLowerCase()) {
            // Scroll into view of the anchor element
            await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), anchor);
            if(isDebugMode) console.debug('Clicken auf ' + courseName + '...');
            await anchor.click();
            found = true;
            if(isDebugMode) console.debug(`Auf ${courseName} geclickt...`);
            // Wait for the navigation to complete
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
            break; 
          }  
        }
        if(!found) { 
          console.error("Dieser Kurs ist leider nicht gefunden werden!");
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
            tableObject.day = cell.innerHTML.split('<br>')[0].trim();
          } 
          else if(index == 3) { // Time of the course
            tableObject.time = cell.innerHTML.split('<br>')[0].trim();
          } 
          else if(index == 4) { // Location of the course
            tableObject.place = cell.innerHTML
                                    .replace(/<a[^>]*>(.*?)<\/a>/g, '$1')                              // Don't ask me what this regex does...
                                    .replace(/<br\s*\/?>/gi, ' ')
                                    .trim();
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
  console.log(courseID);  
  console.log(courseName + " " + courseID.name);
      if(isDebugMode) console.debug(`Die Taste mit dem ID ${courseID} wurde geclickt...`);

      // Press the link and wait for the target tab
      const pageTarget = await page.target();
      const [newTarget] = await Promise.all([
        browser.waitForTarget((target) => target.opener() === pageTarget),
        page.click(`input[type="submit"][name="${courseID.id}"]`),
      ]).catch(error => {
      console.error("Fehler beim Clicken auf der Taste oder Wartung auf das Ziel:", error);
      return null; // Return null if there's an error
    });

    // Change the current page 
    page = await newTarget.page() // if this fixes the issue...
    await page.waitForNetworkIdle();
    const title = await page.title();
    if(isDebugMode) console.debug(title);

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
    
  // TODO: Get the date from here
    if(isDebugMode) console.table(divText);
    if(isDebugMode) console.log(divText[1]);

    // Click on the button if it has "buchen" on the name   
    const bookingButton = await page.$('input[type="submit"][class="inlbutton buchen"][value="buchen"]');
    // Ensure the button exists
    if(bookingButton) { 
      await bookingButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' }); // Wait for the navigation or network idle
      await fillCredentials(page,courseName, courseID, divText[1]);
    } else {
      console.error("Keine Taste zur Buchung ist verfügbar");
      // await fillCredentials(page);
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
    await page.waitForSelector(`input[name="sex"][value="${process.env.GESCHLECHT}"]`);
    await page.click(`input[name="sex"][value="${process.env.GESCHLECHT}"]`);
    const nameTextField = await page.$('#BS_F1100');
    await nameTextField.click();
    await nameTextField.type(process.env.NAME);

    const surnameTextField = await page.$('#BS_F1200');
    await surnameTextField.click();
    await surnameTextField.type(process.env.NACHNAME);

    const streetNoTextField = await page.$('#BS_F1300');
    await streetNoTextField.click();
    await streetNoTextField.type(process.env.STRASSE_NO);

    const plz_cityTextField = await page.$('#BS_F1400');
    await plz_cityTextField.click();
    await plz_cityTextField.type(process.env.PLZ_STADT);



    const userStatus = visitorStatus[parseInt(process.env.STATUS)];
    const status = await page.$('#BS_F1600');
    await status.select(userStatus);

    let isDisabled;
    const matriculationNumber = await page.$('#BS_F1700');
    if(matriculationNumber) {
    isDisabled = await page.evaluate(el => el.hasAttribute('disabled'), matriculationNumber);
    if(!isDisabled) {
      await matriculationNumber.click();
      await matriculationNumber.type(process.env.MATRIKELNUMMER);
    }
    }
   

    const officialPhone = await page.$('#BS_F1800');
    if(officialPhone) {
    isDisabled = await page.evaluate(el => el.hasAttribute('disabled'), officialPhone);
    if(!isDisabled) {
      await officialPhone.click();
      await officialPhone.type(process.env.DIENSTLEISTUNG_PHONE);
    }
    }

    if(isDebugMode) console.log(process.env.EMAIL);
    const email = await page.$('#BS_F2000');
    await email.click();
    await email.type(process.env.EMAIL);

    const phoneNo = await page.$('#BS_F2100');
    await phoneNo.click();
    await phoneNo.type(process.env.PHONE_NO);

    const iban = await page.$('#BS_F_iban');
    if(iban) {
    isDisabled = await page.evaluate(el => el.hasAttribute('disabled'), iban);
    if(!isDisabled) {
      await iban.click();
      await iban.type(process.env.IBAN);
    }
    }

    await page.click('input[type="checkbox"][name="tnbed"]');
    const submit = await page.$('#bs_submit');
    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }),submit);
    await page.waitForSelector('#bs_submit', {visible: true });
    await page.click('#bs_submit');

    await page.waitForNetworkIdle();


    await page.waitForSelector('input[type="submit"][value="verbindlich buchen"]');



    // Click the submit button
    await page.click('input[type="submit"][value="verbindlich buchen"]');
    if(isDebugMode) console.log('Auf dem Submit-Button geclickt...');
    await page.waitForNavigation({waitUntil: 'networkidle2'});


    const alreadyBooked = await page.$('form[name="bsform"] .bs_meldung') !== null;
    if(alreadyBooked) {
      console.log(chalk.yellow("Sie haben schon für dieses Angebot eine Buchung!Zurück zum Menü in 5 Sekunden..."));
      await new Promise(resolve => setTimeout(resolve, 5000));
      await menu();
    }
    else {
      console.log(chalk.greenBright("Der Kurs ist erfolgreich gebucht"));
      bookingCompleted = true;
      // TODO: Add JSON database integration here 
      saveToJson(
        {
          courseName: `${courseName} ${courseID?.name || "?"}`, 
          courseDate: date || "?", 
          courseTime: courseID?.time || "?"
        }
      );  
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  finally {
    const picName = new Date().toISOString().substring(0,16).replace('T',' ') + ' ' + courseName; 
    const screenshotDir = path.resolve(PROJECT_ROOT, 'screenshots');
    await mkdir(screenshotDir, { recursive: true });

    const picDir = path.resolve(screenshotDir, `${picName}.png`); 
    // Take a screenshot and save it to the constructed path
    await page.screenshot({ path: picDir});
    console.log(`Buchungsfoto kann in \"screenshots\"-Ordner gefunden werden`);
    console.log("Browser wird geschlossen...");
    await browser.close();
    await menu();
  }

}

