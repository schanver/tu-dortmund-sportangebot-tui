import puppeteer from 'puppeteer';
import inquirer  from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete',autocompletePrompt);

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
      searchText: 'Suche nach dem Kurs...',
      emptyText: 'Keine Kurse gefunden!',
      source: searchCourses,
      pageSize: 20
    }); 
    console.log(courses.courseName); 

  const browser = await puppeteer.launch({headless: 'shell' });
  const page = await browser.newPage();
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
     // waitUntil: 'networkidle0', // Ensure the page is fully loaded
      timeout: 20000
    });
  //await page.setViewport({ width: 1080, height: 1024 });
  try {
    // Wait for the main div to load
    await page.waitForSelector('div#bs_content dl.bs_menu', { timeout: 6000 });
    const container = await page.$('div#bs_content dl.bs_menu');
    if( container ) {
      console.log("Found the container, looking through the courses for " + courses.courseName);
      const anchors = await page.$$('a');
      if( anchors.length > 0 ) 
      {
        let found = false;
        for (const anchor of anchors) {
          const anchorText = await page.evaluate(el => el.textContent.trim(), anchor); // Use trim to remove any extra spaces
          if (anchorText.toLowerCase() === courses.courseName.toLowerCase()) {
            // Scroll into view of the anchor element
            await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), anchor);
            console.log('Clicking on anchor with text ' + courses.courseName + '...');
            await anchor.click();
            found = true;
            console.log('Clicked on anchor with text:', anchorText);
            // Wait for the navigation to complete
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 200000 });
            break;
          }  
        }
        if( !found ) { 
          console.log("No course with this name has been found!");
        }
      }
    }
    const bookingMenu = await page.$('.bs_kurse');
    if( bookingMenu ) {
      console.log("Found the booking menu");
      await page.evaluate(el => el.scrollIntoView({behavior: 'smooth', block: 'center'}), bookingMenu);
    }
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
    console.log(tableData);
  } catch(error)  {
    console.log(error);
  }
  finally {
    console.log("Closing the browser...");
    browser.close();
  }
};

await bookSession();
