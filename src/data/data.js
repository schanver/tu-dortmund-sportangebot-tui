import duckdb from 'duckdb';

const db = duckdb.Database(':memory:');
const con = db.connect();

const createCredentials = async () => {
  try {
  await con.run('CREATE TABLE credentials( name STRING, nachname STRING, gender VARCHAR(1), Adresse STRING, PLZ INTEGER, stadt STRING, email STRING, TELEFONNUMMER STRING, matrikelnummer STRING)'); 

  }
  finally {

  }

};
