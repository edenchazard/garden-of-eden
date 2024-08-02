import pool from "../server/pool";

const con = await pool.getConnection();

await con.execute(`DROP TABLE IF EXISTS hatchery`);
await con.execute(`DROP TABLE IF EXISTS users`);
await con.execute(`DROP TABLE IF EXISTS user_settings`);

await con.beginTransaction();

await con.execute(`
  CREATE TABLE IF NOT EXISTS hatchery (
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

await con.execute(`
  ALTER TABLE \`hatchery\`
	CHANGE COLUMN \`user_id\` \`user_id\` mediumint UNSIGNED NOT NULL AFTER \`code\`,
	ADD INDEX \`user_id\` (\`user_id\`),
	ADD UNIQUE INDEX \`code\` (\`code\`);
`);

await con.execute(`
  ALTER TABLE \`hatchery\`
	ADD CONSTRAINT \`FK_hatchery_users\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON UPDATE RESTRICT ON DELETE CASCADE;
`);

await con.execute(`
  ALTER TABLE \`user_settings\`
	ADD CONSTRAINT \`FK_user_settings_users\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON UPDATE RESTRICT ON DELETE CASCADE;
`);

await con.commit();

con.release();

process.exit(0);
