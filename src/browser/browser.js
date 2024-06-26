import puppeteer from 'puppeteer';
import inquirer  from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';
import 'dotenv/config';

inquirer.registerPrompt('autocomplete',autocompletePrompt);

const isDebugMode = process.env.DEBUG === 'true';

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

export const bookSession = async () => {
    const courses = await inquirer.prompt(
    {
      type: 'autocomplete',
      name: 'courseName',
      message: 'Bitte wählen Sie einen Kurs oder den Kursname eingeben',
      searchText: 'Suche nach dem Kurs...',
      emptyText: 'Keine Kurse gefunden!',
      source: searchCourses,
      pageSize: 20
    }); 
    console.log(courses.courseName); 

  const browser = await puppeteer.launch({headless: false});
  let page = await browser.newPage();

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


  await page.goto('https://www.buchsys.ahs.tu-dortmund.de/angebote/aktueller_zeitraum/', 
    {
      timeout: 20000
    });
  try {
    // Wait for the main div to load
    await page.waitForSelector('div#bs_content dl.bs_menu', { timeout: 6000 });
    const container = await page.$('div#bs_content dl.bs_menu');
    if( container ) {
      console.debug("Found the container, looking through the courses for " + courses.courseName);
      const anchors = await page.$$('a');
      if( anchors.length > 0 ) 
      {
        let found = false;
        for (const anchor of anchors) {
          const anchorText = await page.evaluate(el => el.textContent.trim(), anchor); // Use trim to remove any extra spaces
          if (anchorText.toLowerCase() === courses.courseName.toLowerCase()) {
            // Scroll into view of the anchor element
            await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), anchor);
            console.debug('Clicking on anchor with text ' + courses.courseName + '...');
            await anchor.click();
            found = true;
            console.debug('Clicked on anchor with text:', anchorText);
            // Wait for the navigation to complete
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 200000 });
            break;
          }  
        }
        if( !found ) { 
          console.debug("No course with this name has been found!");
        }
      }
    }
    const bookingMenu = await page.$('.bs_kurse');
    if( bookingMenu ) {
      console.debug("Found the booking menu");
      await page.evaluate(el => el.scrollIntoView({behavior: 'smooth', block: 'center'}), bookingMenu);
    }
    // This part prints the table data of the courses, this will be used to select for which day will the user book 
    const tableData = await page.evaluate(() => {
      const rows = document.querySelectorAll('.bs_kurse tbody tr');
      let data = [];

      rows.forEach(row => {
        let rowData = [];
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
          rowData.push(cell.textContent.trim());
        });
        data.push(rowData);
      });
      return data;
    });
    console.debug(tableData);

    const inputNames = await page.$$eval('input[type="submit"][class="bs_btn_buchen"]', inputs => {
        return inputs.map(input => input.name);
    });
    // Print the name attributes
    console.debug('Available courses: ');
    inputNames.forEach(name => console.debug(name));

    // Click the first button (Just an example)
    if (inputNames.length > 0) {
        console.debug(`Clicked button with name: ${inputNames[0]}`);
    } 
    // Press the link and wait for the target tab 
    const pageTarget = await page.target();
    const [newTarget] = await Promise.all([
        browser.waitForTarget((inputNames) => inputNames.opener() === pageTarget),
        page.click(`input[type="submit"][name="${inputNames[0]}"]`) // TODO: Change this part with the input of the user 
    ]);
    // Change the current page 
    page = await newTarget.page(); // if this fixes the issue...
    const title = await page.title();
    console.debug(title);
   // await page.waitForSelector('.bs_etvg');
    const dateSelector = '.bs_form_uni.bs_left.padding0';
    const divText = await page.$$eval(dateSelector, divs => {
      if (divs.length > 0) {
        // We chose the first one because they only open the courses in one week advance
        const firstDiv = divs[0];
        const values = [];
        const children = firstDiv.children;
        for (let child of children) {
          values.push(child.innerText.trim());
        }
        return values;
      } else {
        return [];
      }
    }); 
    console.debug(divText);
    // Click on the button if it has "buchen" on the name   
    const bookingButton = '.bs_form_uni.bs_right.padding0 input.inlbutton.buchen';
    await page.click(bookingButton);
    await page.waitForNavigation();
    
    // Get the values from the user's .env file and send the keys 
    await page.waitForSelector('div#bs_form_main');
    const nameTextField = await page.$('#BS_F1100');
    console.log(process.env.NAME);
    await nameTextField.click();
    await nameTextField.type(process.env.NAME || 'John');
    console.debug("Typed " + process.env.NAME + " into the textField " + nameTextField);
    await nameTextField.press('Shift');

    const surnameTextField = await page.$('#BS_F1200');
    console.log(process.env.NACHNAME);
    await surnameTextField.click();
    await surnameTextField.type(process.env.NACHNAME || 'Doe');
    console.debug("Typed " + process.env.NACHNAME + " into the textField " + surnameTextField);
  
    const streetNoTextField = await page.$('#BS_F1300');
    console.log(process.env.STRASSE_NO);
    await streetNoTextField.click();
    await streetNoTextField.type(process.env.STRASSE_NO || 'Main St 123');
    console.debug("Typed " + process.env.STREETNO + " into the textField " + streetNoTextField);

    const plz_cityTextField = await page.$('#BS_F1400');
    console.log(process.env.PLZ_STADT);
    await plz_cityTextField.click();
    await plz_cityTextField.type(process.env.PLZ_STADT || '223 Manhattan');
    console.debug("Typed " + process.env.PLZ_STADT + " into the textField " + plz_cityTextField);

  }
  finally {
    console.debug("Closing the browser...");
    //browser.close();
  }
};

await bookSession();
