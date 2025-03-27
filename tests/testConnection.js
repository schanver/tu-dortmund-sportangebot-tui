import https from 'https';
import chalk from 'chalk';

const checkInternetConnection = () => {
  https.get('https://www.buchsys.ahs.tu-dortmund.de/angebote/aktueller_zeitraum/', (res) => {
    console.log(chalk.bold.green("Internet funktioniert\n"));
    }).on('error', () => {
    console.log(chalk.bold.red("Keine Internetvebindung ist verfügbar!"));
    });
}

checkInternetConnection();
