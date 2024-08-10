import mysql from 'mysql2/promise';
const { db } = useRuntimeConfig();

export default mysql.createPool({
  ...db,
  connectionLimit: 10,
});
