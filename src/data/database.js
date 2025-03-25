import boxen from 'boxen';
import fs from 'fs';
import chalk from 'chalk';

const path = "./data.json"
/**
 * Saves key-value pairs to a JSON file.
 * @param {Object} data - The key-value pairs to save.
 * @param {string} filePath - The JSON file path (default: "data.json").
 */
export function saveToJson(data, filePath = "./data.json") {
  let existingData = {};

  // Read existing data if the file exists
  if (fs.existsSync(filePath)) {
    existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // Merge new data with existing data
  const updatedData = { ...existingData, ...data };

  // Write to file
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

  console.log(`Data saved to ${filePath}`);
}

export function getUpcomingCourses() {
  if (!fs.existsSync(path)) {
    console.error(`File ${path} not found.`);
    return [];
  }

  // Read and parse JSON file
  const courses = JSON.parse(fs.readFileSync(path, "utf8"));

  // Get today's date without time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter upcoming courses
const upcomingCourses = courses
    .filter(course => {
      const [day, month, year] = course.courseDate.split(".").map(Number);
      const courseDate = new Date(year, month - 1, day); 
      return courseDate >= today;
    })
    .map(course => `${course.courseName}, ${course.courseDate} ${course.courseTime}`)
    .join("\n");
  return upcomingCourses;
}

//const upcomingCourses = getUpcomingCourses();
//console.log(boxen(chalk.bold.yellow("Upcoming courses:\n") + chalk.green(upcomingCourses || "No upcoming courses"))); 
