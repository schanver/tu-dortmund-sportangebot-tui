import duckdb from 'duckdb';

const db = new duckdb.Database('./database.db');
const con = db.connect();

const isDebugMode = process.env.DEBUG === 'true';

const createDatabases = async () => {
  try {
    con.run(`
      CREATE TABLE IF NOT EXISTS credentials(
      Name STRING,
      Nachname STRING,
      Geschlecht VARCHAR(1),
      Adresse STRING,
      PLZ INTEGER,
      Stadt STRING,
      Email STRING,
      Telefonnummer STRING,
      Status STRING, Status-Nr.
      PRIMARY KEY (courseName, day, time)
    )`); 
    con.run(`CREATE TABLE IF NOT EXISTS courses(
      courseName STRING,
      day VARCHAR(10),
      time STRING,
      courseID STRING
    )`);
  }
  catch (error) {
    console.log(error);
  }
  finally {
    if(isDebugMode) {
    console.debug("Datenbank wurde erfolgreich erstellt");
    }
  }
};

// This function first compares the ID of the courses with (if exists) the present ID in the database,
const getCourseID = async (courseName, day, time, courseID) => {
  try {
    const queryCheck = `SELECT * from courses WHERE courseName = ? AND day = ? AND time = ?`;
    const checkValues = con.all(queryCheck, [ courseName, day, time]);
    // Check if there is an entry with the given criteria 
    if( checkValues.length > 0 ) {
      if(checkValues[0].courseID !== courseID) {
        const queryUpdate = 'UPDATE courses SET courseID = ? WHERE courseName = ? AND day = ? AND time = ?';
        con.run(queryUpdate, [courseID, courseName, day, time]);
        if (isDebugMode) {
          console.debug("courseID successfully updated for %s on %s at %s.", courseName, day, time);
        }
      }
      else {
        if(isDebugMode) {
        console.debug("Der Wert von courseID ist gleich. Keine Aktualisierung benötigt.");
        }
      }
    }
    else {
      const queryInsert = 'INSERT INTO courses (courseName, day, time, courseID) VALUES (?, ?, ?, ?)';
       con.run(queryInsert, [courseName, day, time, courseID]);
      if (isDebugMode) {
        console.debug("New course %s inserted into the database for %s on %s at %s.", courseName, day, time);
      }

    }
  }
  catch (error) {
    console.error(error);
  } 
};

const testExample = async () => {
  await createDatabases();
  try {
    await getCourseID('Basketball','Donnerstag',"20.30-22.30",'KursID_23524');
    await getCourseID('Basketball','Freitag','18.00-20.00','KursID_9314');
    await getCourseID('Basketball','Freitag','18.00-20.00','KursID_914');
  } catch (error) {
    console.error('Error inserting sample course:', error);
  }
}

await testExample();

