import mysql from 'mysql2/promise';

const host = process.env.NUXT_DB_HOST;
const user = process.env.NUXT_DB_USER;
const password = process.env.NUXT_DB_PASSWORD;
const database = process.env.NUXT_DB_DATABASE;
const port = Number(process.env.NUXT_DB_PORT ?? '3306');

if (!host || !user || !database) {
  throw new Error(
    'Missing required env vars: NUXT_DB_HOST, NUXT_DB_USER, NUXT_DB_DATABASE',
  );
}

const identifier = (value: string) => `\`${value.replaceAll('`', '``')}\``;

const connection = await mysql.createConnection({
  host,
  user,
  password,
  port,
  multipleStatements: false,
});

await connection.query(`DROP DATABASE IF EXISTS ${identifier(database)}`);
await connection.query(
  `CREATE DATABASE ${identifier(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
await connection.end();

console.log(`Recreated database: ${database}`);
