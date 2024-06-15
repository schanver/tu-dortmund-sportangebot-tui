import inquirer from 'inquirer';
import boxen from 'boxen';
import chalk from 'chalk';
import { bookSession } from './src/browser/browser.js';

const menuChoices = [
  "Für einen Kurs anmelden",
  "Von einem Kurs abmelden",
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

const showBanner = async () => {
    const bannerBoard = boxen(chalk.bold.green(banner));
    return bannerBoard;
}

const menu = async () => {
  const banner = await showBanner();
  console.clear();
  console.log(banner);
  const menuScreen = await inquirer.prompt(
    {
      type: "list",
      name: "menuOptions",
      message: chalk.yellow("Wilkommen, was möchten Sie tun?"),
      choices: menuChoices
    });
    switch(menuScreen.menuOptions)
  {
    case menuChoices[0]:
      await bookSession();
      break;
    case menuChoices[1]:
      break;
    case menuChoices[2]:
      break;
    case menuChoices[3]:
      console.log("Tschüss...");
      return;
  }
}
 
await menu();
