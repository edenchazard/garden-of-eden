import pool from "../server/pool";

const table = "hatchery";

const con = await pool.getConnection();

await con.execute(`DROP TABLE IF EXISTS ${table}`);
await con.execute(`DROP TABLE IF EXISTS users`);
await con.execute(`DROP TABLE IF EXISTS user_settings`);

await con.beginTransaction();

await con.execute(`
  CREATE TABLE IF NOT EXISTS ${table} (
    id int UNSIGNED NOT NULL AUTO_INCREMENT,
    code char(5) NOT NULL,
    user_id mediumint NOT NULL, 
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);

await con.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id mediumint UNSIGNED NOT NULL AUTO_INCREMENT,
    username varchar(32) NOT NULL,
    role varchar(11) NOT NULL DEFAULT 'user',
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);

await con.execute(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id mediumint UNSIGNED NOT NULL,
    frequency smallint UNSIGNED NOT NULL DEFAULT 30,
    perPage smallint UNSIGNED NOT NULL DEFAULT 50,
    sort varchar(32) NOT NULL DEFAULT 'Youngest First',
    PRIMARY KEY (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);

await con.commit();

con.release();

process.exit(0);
