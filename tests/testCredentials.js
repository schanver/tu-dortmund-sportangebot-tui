import chalk from 'chalk';

import 'dotenv/config';
import { PROJECT_ROOT } from './../src/config.js';

const testCredentials = () => {
  if(!fs.existsSync(`${PROJECT_ROOT}/.env`)) {
    console.log(chalk.bold.red("Keine .env-Datei gefunden! Bitte erstellen Sie eine .env-Datei im Projektquelle und füllen Sie die je nach dem .env-example.md Datei!"));
  } else {
    console.log(chalk.green.bold(".env-Datei ist erfolgreich geladen"));
    try {
      const name = process.env.NAME;
      const nachname = process.env.NACHNAME;
      const street_no = process.env.STRASSE_NR;
      const plz_stadt = process.env.PLZ_STADT;
      const matrikel_no = process.env.MATRIKEL_NR;
      const email = process.env.EMAIL; 
      const phone_no = process.env.TELEFON_NR;
      const status = process.env.STATUS;
      const dl_no = process.env.DIENSTL_NR;
      const iban = process.env.IBAN;
      const geschlecht = process.env.GESCHLECHT;

      // Check if the mandatory values are present
      if (!name || !nachname || !street_no || !plz_stadt || !email || !phone_no || !status || !geschlecht) {
        throw new Error("Bitte füllen Sie die benötigte Informationen aus!");
      }

      if ([1, 2, 3, 4].includes(parseInt(status)) && (!matrikel_no || matrikel_no.length === 0)) {
        throw new Error(chalk.red.bold("Bitte geben Sie ihre Matrikelnummer ein!"));
      }

      if ([5, 6, 7, 8, 11, 12].includes(parseInt(status)) && (!dl_no || dl_no.length === 0)) {
        throw new Error(chalk.red.bold("Bitte geben Sie ihre Dienstleistungsnummer ein!"));
      }
      if (parseInt(status) < 1 || parseInt(status) > 12) {
        throw new Error(chalk.red.bold("Bitte geben Sie eine gültiges Status ein!"));
      }

      console.debug(chalk.greenBright("Persönliche Informationen sind eingegeben!"));
      console.log(chalk.yellow("Bitte überprüfen Sie die ausgefüllte Daten!"));
      console.log(`
Name: ${name} 
Nachname: ${nachname}
Straßenummer: ${street_no}
PLZ & Stadt: ${plz_stadt}
Matrikelnummer: ${matrikel_no}
Email: ${email}
Telefonnumer: ${phone_no}
Dienstleistungnummer: ${dl_no}
Zustand: ${status}
Geschlecht: ${geschlecht}
`);
      process.exit(0);
    } catch (error) {
      console.error(error.message); 
      process.exit(1); 
    }
  }
};






testCredentials();
