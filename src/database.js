import boxen from 'boxen';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { PROJECT_ROOT } from './config.js';
import { selectCourse } from './browser.js';
import { isDebugMode } from '../index.js';
const filePath = path.resolve(PROJECT_ROOT, ".data.json");

/**
 * Saves key-value pairs to a JSON file.
 * @param {Object} data - The key-value pairs to save.
**/

export async function saveToJson(data) {
  try {
    let existingData = [];

    // Check if the file exists and read its content, if not create a new file at the same location
    if (!fs.existsSync(filePath)) {
      if(isDebugMode) console.debug("Erstellen einer JSON-Datei...");
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
      const fileContent = fs.readFileSync(filePath, "utf8");

      // Parse existing data, ensuring it's an array
      existingData = JSON.parse(fileContent);
      if (!Array.isArray(existingData)) {
        existingData = [existingData]; 
      }
    
    // Append new data as a separate entry
    existingData.push(data);

    // Write updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    if(isDebugMode) console.debug(`Datei ist zum ${chalk.bold.green(filePath)} gespeichert.`);
  } catch (error) {
    console.error("Fehler beim Speichern des JSON-Datei", error);
  }
}
// TODO: Check if the JSON file is empty
export async function getUpcomingCourses() {
  if (!fs.existsSync(filePath)) {
    console.error(`Datei ${chalk.bold.yellow(filePath)} nicht gefunden.`);
    return [];
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    let courses = JSON.parse(fileContent);
    if(!courses) {
      console.error(`Keine angemeldete Kurse gefunden!`);
      return [];
    }

    if (!Array.isArray(courses)) {
      courses = [courses]; 
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter upcoming courses
    const upcomingCourses = courses
    .filter(course => {
      if (!course.courseDate) return false;

      const [day, month, year] = course.courseDate.split(".").map(Number);
      if (!day || !month || !year) return false;

      const courseDate = new Date(year, month - 1, day);
      return courseDate >= today;
    })
    .map(course => `${course.courseName}, ${course.courseDate} ${course.courseTime}`)
    .join("\n");

    console.log(
    boxen(chalk.bold.yellow("Kommende Kurse:\n") + chalk.green(upcomingCourses || "Keine kommende Kurse"), { padding: 1, borderStyle: 'doubleSingle'  }));

    const choicesForBookedCourses = ["Für einen Kurs anmelden", "Program beenden"];
    const bookedCourses = await inquirer.prompt(
    {
      type: "list",
      name: "listOptions",
      message: chalk.yellow("Was möchten Sie tun?"),
      choices: choicesForBookedCourses
    })
    switch(bookedCourses.listOptions) {
      case choicesForBookedCourses[0]:
        await selectCourse();
        break;
      case choicesForBookedCourses[1]:
        console.log(chalk.bold.green("Program beendet. Tschüss..."));
        process.exit(0);
    }

  } catch (error) {
    console.error("Fehler beim Verarbeitung der JSON-Datei!", error);
    return "Keine vorkommende Kurse.";
  }
}

