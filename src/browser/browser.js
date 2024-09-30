import chalk from 'chalk';
import puppeteer from 'puppeteer';
import inquirer  from 'inquirer';
import InterruptedPrompt from "inquirer-interrupted-prompt";
import autocompletePrompt from 'inquirer-autocomplete-prompt';
import 'dotenv/config';
import { menu,showBanner,isDebugMode } from '../../index.js';

inquirer.registerPrompt('autocomplete',autocompletePrompt);
InterruptedPrompt.fromAll(inquirer);

const browser = await puppeteer.launch({headless: 'shell'});
let bookingCompleted = false;
const courseList = 
  [
    "Acroyoga", "Aerobic Workout meets HIIT", "Anatolische Volkstänze", "Bachata",
    "Badminton","Ballett","Basketball","Bauchkiller","Beach Platzreservierung",
    "Beachkarte","Beachvolleyball","Bodyforming","Bogenschießen Recurve (olympisch)",
    "Bollywood Musical","Bouldern","Boule","Boxen","Brazilian Jiu Jitsu",
    "Budolehrgang Kyusho und Aikijitsu","Calisthenics","Campusliga","Capoeira",
    "Cheerleading","Confidance","Darts","EntspannungsPause FH","Entspannungspause TU",
    "Euro Fußballseminar mit Andy Markovits","Fatburner","Fechten",
    "FFW Das Fitnessstudio auf dem Campus","FFW Follow UP","FFW international class",
    "FFW Personal Training","FFW Probetraining","FFW Starterkurs","FFW welcome back",
    "Fitnesskarte","Flag Football","Floorball","flowing AthletiX®","Frauenfußball",
    "Frisbee - Ultimate Frisbee -","Full Body Workout","Futrex-Messung","Futsal",
    "Fußball","Handball","Hiphop Basics","Hiphop Fusion","Hoopdance","Intervall Training",
    "Judo","Kickboxen","Klettern","Kombikarte","Kung Fu","Lacrosse","Lauftreff",
    "Lauftreff Intervalltraining","Leichtathletik","Luftakrobatik","Meditation mit Klangschalen",
    "Mobile Massage","Modern Dance/ Contemporary","Mountainbike","Ninjitsu","Online-Kurse",
    "Parkour","Pausenexpress FH Dortmund","Pausenexpress TU","Pilates","Poledance",
    "Powerstep","Progressive Muskelentspannung","Reiten","Rennrad","Rock´n´Roll",
    "Roundnet/ Spikeball","Rudern","Rugby","Rückenfit","Rückenfit im Büroalltag (BGF)",
    "Salsa","Schach","Schwimmen","Schwimmkarte Freies Schwimmen","Selbstverteidigung",
    "Showdown","Skateboarding","Soccerbox","Softball (Mixed)","Spazierengehen",
    "Spiele spielen/kleine Sportspiele","SPORTKARTE","Stand UP Paddling (SUP)",
    "Taekwondo","Tagesticket Hochschulsport","Tai Chi Chuan","Tango Argentino",
    "Tanz Standard/Latein","Tennis Kurs","Tennis Platzreservierung","Tenniskarte",
    "Tischtennis","Trampolin","Turnen","Unihockey","Unterwasser - Rugby",
    "Verleih von Bewegungs- und Entspannungsmaterialien","Volleyball",
    "Windsurfen","World Jumping®","Yoga","Zirkeltraining (BGF)","Zirkeltraining (BGF) FH",
    "Zumba®","Zwischen-Zirkeltraining vor Ort","RESTPLÄTZE - alle freien Kursplätze dieses Zeitraums"
  ];

async function searchCourses(answers, input) {

  input = input || '';
  return courseList.filter(course =>
    typeof course === 'string' && course.toLowerCase().includes(input.toLowerCase()));
}

const dontLoadMediaContent = async ( page ) => {
  // Do not load media or styles to save some loading time 
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    const resourceType = request.resourceType();
    if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media' || url.endsWith('.svg')) {
      request.abort();
    } else {
      request.continue();
    }
  });
};

export const selectCourse = async () => {
console.clear();
console.log(await showBanner());

const courses = await inquirer.prompt({
type: 'autocomplete',
name: 'selectedCourse',
message: 'Bitte wählen Sie einen Kurs oder geben Sie den Kursname ein',
searchText: 'Suche nach dem Kurs...',
emptyText: 'Keine Kurse gefunden!',
source : searchCourses,
pageSize: 20
})
.catch(async (error) => {
    if (error.isTtyError) {
    } else {
      if (error === InterruptedPrompt.EVENT_INTERRUPTED) {
        await menu();
      }
    }
  });
  const courseName = courses.selectedCourse;
  await selectCourseDay(courseName);
};

const selectCourseDay = async ( courseName ) => {

  let page = await browser.newPage();
  await page.setViewport({ width: 1980, height: 1200 });
  
//#await dontLoadMediaContent(page);

  await page.goto('https://www.buchsys.ahs.tu-dortmund.de/angebote/aktueller_zeitraum/', 
    {
      timeout: 20000
    });
    // Wait for the main div to load
    await page.waitForSelector('div#bs_content dl.bs_menu', { timeout: 6000 });
    const container = await page.$('div#bs_content dl.bs_menu');

    if( container ) {
      if (isDebugMode) console.debug(`Found the container, looking through the courses for ${courseName}`);
      const anchors = await page.$$('a');
      if( anchors.length > 0 ) 
      {
        let found = false;
        for (const anchor of anchors) {
          const anchorText = await page.evaluate(el => el.textContent.trim(), anchor); // Use trim to remove any extra spaces
          if (anchorText.toLowerCase() === courseName.toLowerCase()) {
            // Scroll into view of the anchor element
            await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), anchor);
            if (isDebugMode) console.debug('Clicking on ' + courseName + '...');
            await anchor.click();
            found = true;
            if (isDebugMode) console.debug('Clicked on :', anchorText);
            // Wait for the navigation to complete
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 200000 });
            break;
          }  
        }
        if( !found ) { 
          if (isDebugMode) console.debug("No course with this name has been found!");
        }
      }
    }

    const bookingMenu = await page.$('.bs_kurse');
    if( bookingMenu ) {
      if (isDebugMode) console.debug("Found the booking menu");
      await page.evaluate(el => el.scrollIntoView({behavior: 'smooth', block: 'center'}), bookingMenu);
    }

    // TODO: Make it an object array so that it gives me the option to disable them to my heart's content 
    
    
  const {tableData} = await page.evaluate(() => {
    const rows = document.querySelectorAll('.bs_kurse tbody tr');
    let data = []

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');

      // Create an object for the current row
      let tableObject = {
        name: '',
        place: '',
        time: '',
        day: '',
        status: '',
        id : ''
      };

      if (cells) {
        cells.forEach((cell, index) => {
          if (index == 1) { // Name of the course
            tableObject.name = cell.textContent.trim();
          } 
          else if (index == 2) { // Day of the course
            tableObject.day = cell.innerHTML.split('<br>')[0].trim();
          } 
          else if (index == 3) { // Time of the course
            tableObject.time = cell.innerHTML.split('<br>')[0].trim();
          } 
          else if (index == 4) { // Location of the course
            tableObject.place = cell.innerHTML
                                    .replace(/<a[^>]*>(.*?)<\/a>/g, '$1')                              // Don't ask me what this regex does...
                                    .replace(/<br\s*\/?>/gi, ' ')
                                    .trim();
          } 
          else if (index == cells.length - 1) { // Booking button or status
            const button = cell.querySelector('input[type="submit"]');
            if (button && button.name === 'bs_btn_buchen') { // Booking button available
              tableObject.status = button.value;
              tableObject.id = button.name;
            } 
            else if (button && button.name === 'bs_btn_ausgebucht') { // Course is fully booked
              tableObject.status = button.value;
              tableObject.disabled = 'Dieser Kurs ist ausgebucht!';
            } 
            else { // No booking button available
              tableObject.disabled = cell.textContent.trim();
            }
          }
        });

        // Push the tableObject after processing all cells for this row
        data.push(tableObject);
      }
    });

    return { tableData: data };
  });

  const courseInfoCombined = tableData.map((course, index ) => {
    const courseInfo = `${course.name}, ${course.day}, ${course.time}, ${course.place}, ${course.status}`;
    const isDisabled = course.disabled ? course.disabled : false;
    const coloredCourseInfo = isDisabled ? chalk.red(courseInfo) : chalk.green(courseInfo);
    return {
      name: coloredCourseInfo,
      disabled : isDisabled
    };
  });

    // Print the name attributes
    const availableCourses = await inquirer.prompt(
      {
        type:'list',
        name:'bookSelectedCourse',
        message:'Welchen Kurs möchten Sie buchen?',
        choices: courseInfoCombined
    })
    .catch(async (error) => {
      if (error.isTtyError) {
      } else {
        if (error === InterruptedPrompt.EVENT_INTERRUPTED) {
          await selectCourse();
        }
      }
    });
     const courseID = availableCourses.bookSelectedCourse;
    
  
    if (inputNames.length > 0) {
        if (isDebugMode) console.debug(`Clicked button with name: ${tableData[courseID].id}`);
    } 
    
    // Press the link and wait for the target tab 
    const pageTarget = await page.target();
    const [newTarget] = await Promise.all([
        browser.waitForTarget((inputNames) => inputNames.opener() === pageTarget),
        page.click(`input[type="submit"][name="${tableData[courseID].id}"]`)
    ]);
    // Change the current page 
    page = await newTarget.page(); // if this fixes the issue...
    await page.waitForNetworkIdle();
    const title = await page.title();
    if (isDebugMode) console.debug(title);


    // This is used to differentiate weekly and one-time bookings, if this selector is present, then it is a weekly booking 
    //
   if( dateSelector ) {
    const divText = await page.$eval(dateSelector, async divs => {
      if (divs.length > 0) {
        // We chose the first one because they only open the courses in one week advance
        const bookingDate = [];
        const firstDiv = divs[0];
        const children = firstDiv.children;
        for (let child of children) {
          bookingDate.push(child.innerText.trim());
        }
        return bookingDate;
      } else {
        console.error("There are no bookings available for this course in the meantime. Returning to main menu...");
        process.exit(0);
      }
  });
    if (isDebugMode) console.debug(divText);
    // Click on the button if it has "buchen" on the name   
    const bookingButton = '.bs_form_uni.bs_right.padding0 input.inlbutton.buchen';
    await page.$(bookingButton);
    await page.click(bookingButton);
    await page.waitForNavigation();
   }
    await fillCredentials(page);
    
  } 

const fillCredentials = async (page) => {
  
    try {
    console.log(process.env.GESCHLECHT);
      await page.waitForSelector(`input[name="sex"][value="${process.env.GESCHLECHT}"]`);
      await page.click(`input[name="sex"][value="${process.env.GESCHLECHT}"]`);
    let nameTextField = await page.$('#BS_F1100');
    await nameTextField.click();
    await nameTextField.type(process.env.NAME);
    if (isDebugMode) console.debug("Typed " + process.env.NAME + " into the textField " + nameTextField);

    const surnameTextField = await page.$('#BS_F1200');
    await surnameTextField.click();
    await surnameTextField.type(process.env.NACHNAME);
    if (isDebugMode) console.debug("Typed " + process.env.NACHNAME + " into the textField " + surnameTextField);
  
    const streetNoTextField = await page.$('#BS_F1300');
    await streetNoTextField.click();
    await streetNoTextField.type(process.env.STRASSE_NO);
    if (isDebugMode) console.debug("Typed " + process.env.STRASSE_NO + " into the textField " + streetNoTextField);

    const plz_cityTextField = await page.$('#BS_F1400');
    await plz_cityTextField.click();
    await plz_cityTextField.type(process.env.PLZ_STADT);
    if (isDebugMode) console.debug("Typed " + process.env.PLZ_STADT + " into the textField " + plz_cityTextField);


      // TODO : Change this to select what user selected at the .env file
      // also add the line to write IBAN, if necessary
    const status = await page.$('#BS_F1600');
    await status.select('S-TUD');

    
    await page.type('input[name="matnr"], input[name="mitnr"]', process.env.MATRIKELNUMMER);

      if(isDebugMode) console.log(process.env.EMAIL);
    const email = await page.$('#BS_F2000');
    await email.click();
    await email.type(process.env.EMAIL);

    const phoneNo = await page.$('#BS_F2100');
    await phoneNo.click();
    await phoneNo.type(process.env.PHONE_NO);

    await page.click('input[type="checkbox"][name="tnbed"]');
    const submit = await page.$('#bs_submit');
    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }),submit);
    await page.waitForSelector('#bs_submit', {visible: true });
    await page.click('#bs_submit');

    await page.waitForNetworkIdle();


    await page.waitForSelector('input[type="submit"][value="verbindlich buchen"]');

    // Click the submit button
    await page.click('input[type="submit"][value="verbindlich buchen"]');
    console.log('Clicked the submit button.');
    await page.waitForNavigation();

    const alreadyBooked = await page.$('form[name="bsform"] .bs_meldung') !== null;

    if( alreadyBooked ) {
    console.log("You have already booked this course! Returning to main menu...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    await menu();
    }
    else {
    if (isDebugMode) console.debug("Booking confirmed");
    bookingCompleted = true;
    console.log("Screenshot of the booking could be found in the root directory");
    await page.waitForNavigation();
    }
  }
  finally {
    if(bookingCompleted) {
    await page.screenshot({path: './reservation.png'});
    console.log("Booking completed.");
    }
    console.log("Closing the browser...");
    await browser.close();
    await menu(); 
  }

}

    

