import https from 'https';
import chalk from 'chalk';

const checkInternetConnection = () => {
  https.get('https://www.buchsys.ahs.tu-dortmund.de/angebote/aktueller_zeitraum/', (res) => {
    console.log(("Internetverbindung: " + chalk.bold.green("erfolgreich.\n")));
    process.exit(0);
    }).on('error', () => {
    console.log(("Internetverbindung: " + chalk.bold.red("fehlgeschlagen.\n")));
    process.exit(1);
    });
}

checkInternetConnection();
