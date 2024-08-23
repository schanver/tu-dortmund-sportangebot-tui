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

  const browser = await puppeteer.launch({headless:'shell'});
  let page = await browser.newPage();
  await page.setViewport({width: 1980, height: 1200});
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
            console.debug('Clicking on ' + courses.courseName + '...');
            await anchor.click();
            found = true;
            console.debug('Clicked on :', anchorText);
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
        let rowData = "";
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
          let newLength;
          if(cell !== cells[0] && cell !== cells[5]) {
            if(cell.innerHTML.includes("<br>") && cell !== cells[7]) {
              let newLength = cell.textContent.trim().length / 2;
              rowData += cell.textContent.trim().substring(0,newLength).padEnd(newLength > 25 ? 28 : 15) + `\t`;
            }
            else {
              newLength = cell.textContent.trim().length;
              rowData += cell.textContent.trim().padEnd(newLength > 25 ? 28 : 15) + `\t`;
            }
          }
        });
        data.push(rowData);
      });
      return data;
    });

    const inputNames = await page.$$eval('input[type="submit"][class="bs_btn_buchen"]', inputs => {
        return inputs.map(input => input.name);
    });
    // Print the name attributes
    console.debug('Available courses: ');
    const { availableCourses } = await inquirer.prompt(
      {
        type:'list',
        name:'bookSession',
        message:'Welchen Kurs möchten Sie buchen?',
        choices: tableData 
      });
    console.log(availableCourses);



    // Click the first button (Just an example)
    if (inputNames.length > 0) {
        console.debug(`Clicked button with name: ${availableCourses.bookSession}`);
    } 
    // Press the link and wait for the target tab 
    const pageTarget = await page.target();
    const [newTarget] = await Promise.all([
        browser.waitForTarget((inputNames) => inputNames.opener() === pageTarget),
        page.click(`input[type="submit"][name="${inputNames[4]}"]`) // TODO: Change this part with the input of the user 
    ]);
    // Change the current page 
    page = await newTarget.page(); // if this fixes the issue...
    await page.waitForNetworkIdle();
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
    const bigTitle = await page.$('div#bs_uni_text');
    console.log(bigTitle); 
    const gender = process.env.GENDER;
    await page.waitForSelector(`input[name="sex"][value="${gender}"]`);
    await page.click(`input[name="sex"][value="${gender}"]`);
    let nameTextField = await page.$('input#BS_F1100');
    if( !nameTextField ) {
      console.debug("Field not found!");
    }
    console.log(process.env.NAME);
    await nameTextField.click();
    await nameTextField.type(process.env.NAME || 'John');
    console.debug("Typed " + process.env.NAME + " into the textField " + nameTextField);

    const surnameTextField = await page.$('input#BS_F1200');
    console.log(process.env.NACHNAME);
    await surnameTextField.click();
    await surnameTextField.type(process.env.NACHNAME || 'Doe');
    console.debug("Typed " + process.env.NACHNAME + " into the textField " + surnameTextField);
  
    const streetNoTextField = await page.$('input#BS_F1300');
    console.log(process.env.STRASSE_NO);
    await streetNoTextField.click();
    await streetNoTextField.type(process.env.STRASSE_NO || 'Main St 123');
    console.debug("Typed " + process.env.STRASSE_NO + " into the textField " + streetNoTextField);

    const plz_cityTextField = await page.$('#BS_F1400');
    console.log(process.env.PLZ_STADT);
    await plz_cityTextField.click();
    await plz_cityTextField.type(process.env.PLZ_STADT || '223 Manhattan');
    console.debug("Typed " + process.env.PLZ_STADT + " into the textField " + plz_cityTextField);

    const status = await page.$('#BS_F1600');
    await status.select('S-TUD');

    
    await page.type('input[name="matnr"], input[name="mitnr"]', process.env.MATRIKEL_NO);

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

    //await page.waitForNavigation();
    await page.waitForNetworkIdle();
    /*await page.waitForSelector('div#bs_foot.bs_form_foot');
    const submit2 = await page.$('input.sub');
    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }),submit2);
    await submit2.click();*/

    await page.waitForSelector('input[type="submit"][value="verbindlich buchen"]');

    // Click the submit button
    await page.click('input[type="submit"][value="verbindlich buchen"]');

    console.log('Clicked the submit button.');

    console.debug("Booking confirmed");
    await page.waitForNavigation();
  }
  finally {
    const screenshot = await page.screenshot({ path: 'example.png' });
    console.log("Closing the browser...");
    browser.close();
  }
};

//await bookSession();
