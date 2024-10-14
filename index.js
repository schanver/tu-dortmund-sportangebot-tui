import inquirer from 'inquirer';
import InterruptedPrompt from "inquirer-interrupted-prompt";
import boxen from 'boxen';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath  } from 'url';
import { selectCourse } from './src/browser/browser.js';

InterruptedPrompt.fromAll(inquirer);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let isDebugMode = process.env.DEBUG==="true";

// Resolve the path to the .env file relative to the index.js file
dotenv.config({ path: path.resolve(__dirname, './.env') });

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
const getCredentials = () => {
  try {
    const name        =   process.env.NAME;
    const nachname    =   process.env.NACHNAME;
    const strasseno   =   process.env.STRASSE_NO;
    const plz_stadt   =   process.env.PLZ_STADT;
    const matrikelno  =   process.env.MATRIKELNUMMER;
    const email       =   process.env.EMAIL; 
    const phone_no    =   process.env.PHONE_NO;
    const status      =   process.env.ZUSTAND;

    if( name.length == 0 || nachname.length == 0 || strasseno.length == 0 || plz_stadt.length == 0 || matrikelno.length == 0 || status.length == 0) {
      throw new Error("Bitte füllen Sie alle Zeile aus! Für Hilfe geben Sie \"./index,js --help\" ein.")
    }
   // console.log(name,nachname, strasseno,plz_stadt,matrikelno,email, phone_no, status);
  }
  catch (error) {
    console.error("Bitte füllen Sie alle Zeile in .env-Datei aus! Für Hilfe geben Sie \"./index.js --help\" ein.");
    process.exit(0);
  }
}

export const menu = async () => {
  const banner = await showBanner();
  console.clear();
  console.log(banner);
  getCredentials();
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
        console.log("\nExiting the program...");
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
      break;
    case menuChoices[2]:
      console.log("Tschüss...");
      process.exit(0);
  }
};

await menu();
