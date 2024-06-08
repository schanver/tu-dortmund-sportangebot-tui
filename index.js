import inquirer from 'inquirer';

const menuChoices = [
  "Für einen Kurs anmelden",
  "Von einem Kurs abmelden",
  "Angemeldete Kurse anzeigen",
  "Program beenden"
];

const menu = async () => {
  const menuScreen = await inquirer.prompt(
    {
      type: "list",
      name: "menuOptions",
      message: "Wilkommen, was möchten Sie tun?",
      choices: menuChoices
    });
    switch(menuScreen.menuOptions)
  {
    case menuChoices[0]:
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
