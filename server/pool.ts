import mysql from "mysql2/promise";
import config from "./config";

export default mysql.createPool({
  ...config.db,
  connectionLimit: 10,
});
