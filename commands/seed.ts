import pool from "../server/pool.js";

const table = "hatchery";

const con = await pool.getConnection();

await con.beginTransaction();

await con.execute(`TRUNCATE TABLE ${table}`);

await con.execute(`
  INSERT INTO ${table} (code, username) VALUES ('lYqC2', '42')`);

console.log((await con.query(`SELECT COUNT(*) AS row_count FROM ${table}`))[0]);

await con.commit();

con.release();

process.exit(0);
