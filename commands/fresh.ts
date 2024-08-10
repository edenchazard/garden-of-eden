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

await con.execute(`
  ALTER TABLE \`users\`
	ADD COLUMN \`registered_on\` DATETIME NOT NULL DEFAULT NOW() AFTER \`role\`;
`);

await con.execute(`
  ALTER TABLE \`hatchery\`
	DROP COLUMN \`id\`,
	DROP PRIMARY KEY,
	DROP INDEX \`code\`,
	ADD PRIMARY KEY (\`code\`);
`);

await con.execute(`
  ALTER TABLE \`users\`
	CHANGE COLUMN \`id\` \`id\` MEDIUMINT UNSIGNED NOT NULL FIRST;
`);

await con.execute(`
  CREATE TABLE \`recordings\` (
	\`recorded_on\` DATETIME NULL DEFAULT NULL,
	\`value\` BIGINT UNSIGNED NOT NULL,
	\`record_type\` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_general_ci',
  \`extra\` LONGTEXT NULL DEFAULT NULL COLLATE 'utf8mb4_bin',
	INDEX \`record_type\` (\`record_type\`) USING BTREE,
	INDEX \`recorded_on\` (\`recorded_on\`) USING BTREE,
	CONSTRAINT \`extra\` CHECK (json_valid(\`extra\`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;`);

await con.execute(`
  ALTER TABLE \`user_settings\`
	ADD CONSTRAINT \`FK_user_settings_users\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON UPDATE RESTRICT ON DELETE CASCADE;
`);

await con.execute(`
  ALTER TABLE \`user_settings\`
	ADD COLUMN \`hatchlingMinAge\` tinyint UNSIGNED NOT NULL DEFAULT 0 AFTER \`sort\`,
	ADD COLUMN \`eggMinAge\` tinyint UNSIGNED NOT NULL DEFAULT 0 AFTER \`hatchlingMinAge\`,
	ADD COLUMN \`showScrollRatio\` tinyint UNSIGNED NOT NULL DEFAULT 0 AFTER \`eggMinAge\`;
`);

await con.execute(`
  alter table user_settings change column perPage perPage smallint(5) unsigned not null default 100 after \`sort\`;
`);

await con.commit();

con.release();

process.exit(0);
