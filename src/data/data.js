import duckdb from 'duckdb';

const db = new duckdb.Database('./courses.db');
const con = db.connect();
const isDebugMode = process.env.DEBUG === 'true';

const createDatabases = async () => {
  try {
    con.run(`CREATE TABLE IF NOT EXISTS courses(
      courseName STRING,
      day VARCHAR(10),
      time VARCHAR,
      courseDate datetime 
    )`);
  }
  catch (error) {
    console.log(error);
  }
  finally {
    if(isDebugMode) {
    console.debug('Datenbank wurde erfolgreich erstellt');
    }
  }
};

// This function first compares the ID of the courses with (if exists) the present ID in the database,
const checkDB =  () => {
  const searchResult =  db.all(`
  SELECT courseName, courseDate 
  FROM courses 
  WHERE courseName = 'Basketball';
  `);
console.log(checkDB);
}

const main = async () => {
  await createDatabases();

  db.all(`INSERT INTO TABLE courses (courseName,"day",time,courseDate) VALUES ('Volleyball','sds','sdgree','2024-05-30');`);
 

  db.all(`INSERT INTO TABLE courses (courseName,"day",time,courseDate) VALUES ('Basketball','ssdfs','sdgree','2024-05-30');`);


  db.all(`INSERT INTO TABLE courses (courseName,"day",time,courseDate) VALUES ('Basketball','s3ewsd','sdgree','2024-06-10');`);

  checkDB();
}


await main();
