import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbName = process.env.DB_NAME || "annai_jewellery";

function quoteDatabaseName(value) {
  if (!/^[A-Za-z0-9_$]+$/.test(value)) {
    throw new Error("DB_NAME can only contain letters, numbers, underscore, and dollar sign.");
  }
  return `\`${value}\``;
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: dbName,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  namedPlaceholders: true,
  decimalNumbers: true,
});

export async function ensureBaseSchema() {
  const schemaPath = path.resolve(__dirname, "../schema.sql");
  const configuredDb = quoteDatabaseName(dbName);
  let schema = (await fs.readFile(schemaPath, "utf8"))
    .replace(/CREATE DATABASE IF NOT EXISTS\s+`?[A-Za-z0-9_$]+`?[^;]*;/i, `CREATE DATABASE IF NOT EXISTS ${configuredDb} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    .replace(/USE\s+`?[A-Za-z0-9_$]+`?;/i, `USE ${configuredDb};`);
  if (process.env.NODE_ENV === "production") {
    schema = schema
      .replace(/CREATE DATABASE IF NOT EXISTS\s+`?[A-Za-z0-9_$]+`?[^;]*;/i, "")
      .replace(/USE\s+`?[A-Za-z0-9_$]+`?;/i, "");
  }

  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.NODE_ENV === "production" ? dbName : undefined,
  });
  try {
    const statements = schema
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await bootstrap.query(statement);
      } catch (error) {
        if (error.code !== "ER_TABLE_EXISTS_ERROR") throw error;
      }
    }
  } finally {
    await bootstrap.end();
  }
}

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function transaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
