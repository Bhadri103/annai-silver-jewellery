import "dotenv/config";
import { mkdir, readdir, stat, unlink } from "fs/promises";
import { createWriteStream } from "fs";
import { spawn } from "child_process";
import path from "path";

const backupDir = path.resolve(process.env.BACKUP_DIR || "backups");
const retentionDays = Math.max(Number(process.env.BACKUP_RETENTION_DAYS || 14), 1);
const backupFilePrefix = String(process.env.BACKUP_FILE_PREFIX || "annai-jewellery")
  .trim()
  .replace(/[^a-z0-9_-]+/gi, "-")
  .replace(/^-+|-+$/g, "") || "annai-jewellery";
const selectedTables = String(process.env.BACKUP_TABLES || "")
  .split(",")
  .map((table) => table.trim())
  .filter((table) => /^[a-z0-9_]+$/i.test(table));
await mkdir(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = path.join(backupDir, `${backupFilePrefix}-${stamp}.sql`);
const databaseName = process.env.DB_NAME || "annai_jewellery";
const args = [
  `--host=${process.env.DB_HOST || "127.0.0.1"}`,
  `--port=${process.env.DB_PORT || "3306"}`,
  `--user=${process.env.DB_USER || "root"}`,
  "--single-transaction",
  "--routines",
  "--triggers",
  "--events",
  databaseName,
  ...selectedTables,
];
const environment = { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || "" };
const dump = spawn(process.env.MYSQLDUMP_PATH || "mysqldump", args, { env: environment, stdio: ["ignore", "pipe", "inherit"] });
dump.stdout.pipe(createWriteStream(target, { flags: "wx" }));
const exitCode = await new Promise((resolve, reject) => {
  dump.once("error", reject);
  dump.once("close", resolve);
});
if (exitCode !== 0) throw new Error(`mysqldump failed with exit code ${exitCode}`);

const cutoff = Date.now() - retentionDays * 86_400_000;
for (const name of await readdir(backupDir)) {
  if (!/^annai-jewellery-.*\.sql$/.test(name)) continue;
  const file = path.join(backupDir, name);
  if ((await stat(file)).mtimeMs < cutoff) await unlink(file);
}
console.log(`Backup created: ${target}`);
