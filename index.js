import inquirer from 'inquirer';
import InterruptedPrompt from "inquirer-interrupted-prompt";
import boxen from 'boxen';
import chalk from 'chalk';
import { selectCourse } from './src/browser.js';
import { getUpcomingCourses } from './src/database.js';

InterruptedPrompt.fromAll(inquirer);
export let isDebugMode = process.env.DEBUG==="true";


const menuChoices = [
  "Für einen Kurs anmelden",
  "Angemeldete Kurse anzeigen",
  "Program beenden"
];

const banner = `                                                                                 
  mmmm                         m                                #               m   
 #"   " mmmm    mmm    m mm  mm#mm   mmm   m mm    mmmm   mmm   #mmm    mmm   mm#mm 
 "#mmm  #" "#  #" "#   #"  "   #    "   #  #"  #  #" "#  #"  #  #" "#  #" "#    #   
     "# #   #  #   #   #       #    m"""#  #   #  #   #  #""""  #   #  #   #    #   
 "mmm#" ##m#"  "#m#"   #       "mm  "mm"#  #   #  "#m"#  "#mm"  ##m#"  "#m#"    "mm 
        #                                          m  #                             
        "                                           ""                    
`;

export const showBanner = async () => {
    const bannerBoard = boxen(chalk.bold.green(banner));
    return bannerBoard;
}
// TODO: Fix this awful mess of garbage
const checkCredentials = () => {
  try {
    const name = process.env.NAME;
    const nachname = process.env.NACHNAME;
    const street_no = process.env.STRASSE_NO;
    const plz_stadt = process.env.PLZ_STADT;
    const matrikel_no = process.env.MATRIKELNUMMER;
    const email = process.env.EMAIL; 
    const phone_no = process.env.PHONE_NO;
    const status = process.env.STATUS;
    const dl_no = process.env.DIENSTL_NO;
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

    console.log(chalk.greenBright("Persönliche Informationen sind eingegeben!"));
  } catch (error) {
    console.error(error.message); 
    process.exit(1); 
  }
};

export const menu = async () => {
  const banner = await showBanner();
  console.clear();
  console.log(banner);
  checkCredentials();
  const menuScreen = await inquirer.prompt(
    {
      type: "list",
      name: "menuOptions",
      message: chalk.yellow("Wilkommen, was möchten Sie tun?"),
      choices: menuChoices
    })
    .catch((error) => {
    if (error.isTtyError) {
    } else {
      if (error === InterruptedPrompt.EVENT_INTERRUPTED) {
        console.log("\nTschüss...");
        process.exit(0);
      }
    }
  });
    switch(menuScreen.menuOptions)
  {
    case menuChoices[0]:
      await selectCourse();
      break;
    case menuChoices[1]:
      await getUpcomingCourses();
      break;
    case menuChoices[2]:
      console.log(chalk.bold.green("Progream beendet.Tschüss..."));
      process.exit(0);
  }
};

await menu();
