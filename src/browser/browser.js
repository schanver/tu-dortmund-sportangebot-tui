import puppeteer from 'puppeteer';
import inquirer  from 'inquirer';
import InterruptedPrompt from "inquirer-interrupted-prompt";
import autocompletePrompt from 'inquirer-autocomplete-prompt';
import 'dotenv/config';
import { menu,showBanner } from '../../index.js';

inquirer.registerPrompt('autocomplete',autocompletePrompt);
InterruptedPrompt.fromAll(inquirer);

const browser = await puppeteer.launch({headless: 'shell'});
const isDebugMode = process.env.DEBUG === 'true';
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
    // This part prints the table data of the courses, this will be used to select for which day will the user book 
    const tableData = await page.evaluate(() => {
      const rows = document.querySelectorAll('.bs_kurse tbody tr');
      let data = [];

      rows.forEach(row => {
        let rowData = "";
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
          let newLength;
          if(cell !== cells[0] && cell !== cells[5]) {
            if(cell.innerHTML.includes("<br>") && cell !== cells[7]) {
              let newLength = cell.textContent.trim().length / 2;
              rowData += cell.textContent.trim().substring(0,newLength).padEnd(newLength > 25 ? 28 : 25 ) + `\t`;
            }
            else {
              if(cell === cells[1] ) {
              rowData += cell.textContent.trim().padEnd(28) + `\t`;
              }
              else {
              newLength = cell.textContent.trim().length;
              rowData += cell.textContent.trim().padEnd(newLength < 25 ? 25 : newLength) + `\t`;
              }
            }
        }
        if(cell === cells[cells.length - 1]) {
          const button = cell.querySelector('input[type="submit"]');
          if( button ) {
            rowData += ` ${button.value}`;
          } else {
            rowData += cell.textContent.trim(); 
          }
        }});

        data.push(rowData);
      });
      return data;
    });

    const inputNames = await page.$$eval('input[type="submit"][class="bs_btn_buchen"]', inputs => {
        return inputs.map(input => input.name);
    });
    // Print the name attributes
    const availableCourses = await inquirer.prompt(
      {
        type:'list',
        name:'bookSelectedCourse',
        message:'Welchen Kurs möchten Sie buchen?',
        choices: tableData 
      })
    .catch(async (error) => {
      if (error.isTtyError) {
      } else {
        if (error === InterruptedPrompt.EVENT_INTERRUPTED) {
          await selectCourse();
        }
      }
    })

    if (inputNames.length > 0) {
        if (isDebugMode) console.debug(`Clicked button with name: ${availableCourses.bookSelectedCourse}`);
    } 

    // Press the link and wait for the target tab 
    const pageTarget = await page.target();
    const [newTarget] = await Promise.all([
        browser.waitForTarget((inputNames) => inputNames.opener() === pageTarget),
        page.click(`input[type="submit"][name="${inputNames[tableData.indexOf(availableCourses.bookSelectedCourse)]}"]`) // TODO: Change this part with the input of the user 
    ]);
    // Change the current page 
    page = await newTarget.page(); // if this fixes the issue...
    await page.waitForNetworkIdle();
    const title = await page.title();
    if (isDebugMode) console.debug(title);

    //const dateSelector = await page.$('.bs_form_uni.bs_left.padding0');

    // This is used to differentiate weekly and one-time bookings, if this selector is present, then it is a weekly booking 
    //
   /* if( dateSelector ) {
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

    //if (isDebugMode) console.debug(divText);*/
    // Click on the button if it has "buchen" on the name   
    const bookingButton = '.bs_form_uni.bs_right.padding0 input.inlbutton.buchen';
    await page.$(bookingButton);
    await page.click(bookingButton);
    await page.waitForNavigation();
    await fillCredentials(page);
    
  } 

const fillCredentials = async (page) => {
  
    // Get the values from the user's .env file and send the keys
    /* const name   = process.env.NAME;
    const surname = process.env.NACHNAME;
    const street_no = process.env.STRASSE_NO;
    const pc_and_city = process.env.PLZ_STADT;
    const */ 
    try { 
    console.log(process.env.GESCHLECHT);
    await page.waitForSelector(`input[name="sex"][value="M"]`);
    await page.click(`input[name="sex"][value="M"]`);
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

    const status = await page.$('#BS_F1600');
    await status.select('S-TUD');

    
    await page.type('input[name="matnr"], input[name="mitnr"]', process.env.MATRIKELNUMMER);

    console.log(process.env.EMAIL); 
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

    

