import inquirer from 'inquirer';
import InterruptedPrompt from "inquirer-interrupted-prompt";
import boxen from 'boxen';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import { selectCourse, bookSportsCard } from './src/browser.js';
import { getUpcomingCourses } from './src/database.js';
import { PROJECT_ROOT } from './src/config.js';

InterruptedPrompt.fromAll(inquirer);

dotenv.config({ path: path.resolve(PROJECT_ROOT, '.env') });

export let isDebugMode = process.env.DEBUG==="true";

const menuChoices = [
  "Für einen Kurs anmelden",
  "Sportkarte erwerben",
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
        "                                           ""   v1.0.1                 
`; 


export const showBanner = async () => {
    const bannerBoard = boxen(chalk.bold.green(banner), { borderStyle: 'singleDouble', align : 'left' });
    return bannerBoard;
}


export const menu = async () => {
  const banner = await showBanner();
  console.clear();
  console.log(banner);
  if(isDebugMode) console.log(chalk.gray("DEBUG MODE is on"));
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
      await bookSportsCard();
      break;
    case menuChoices[2]:
      await getUpcomingCourses();
      break;
    case menuChoices[3]:
      console.log(chalk.bold("Program beendet.Tschüss..."));
      process.exit(0);
  }
};

await menu();
