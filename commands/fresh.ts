import pool from "../server/pool";

const table = "hatchery";

const con = await pool.getConnection();

await con.execute(`DROP TABLE IF EXISTS ${table}`);

await con.beginTransaction();

await con.execute(`
  CREATE TABLE IF NOT EXISTS ${table} (
    id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    code char(5) NOT NULL,
    username varchar(32) NOT NULL, 
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);

await con.commit();

con.release();

process.exit(0);
