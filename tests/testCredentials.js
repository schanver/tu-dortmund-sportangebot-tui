import chalk from 'chalk';
import fs from 'fs';

import 'dotenv/config';
import { PROJECT_ROOT } from './../src/config.js';

const testCredentials = () => {
  if(!fs.existsSync(`${PROJECT_ROOT}/.env`)) {
    console.log(chalk.bold.red("Keine .env-Datei gefunden! Bitte erstellen Sie eine .env-Datei im Projektquell und füllen Sie die je nach dem .env-example.md Datei!"));
  } else {
    console.log(chalk.green.bold("Lauft :) "));
  }

}




testCredentials();
