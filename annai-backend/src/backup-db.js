import "dotenv/config";
import { mkdir, readdir, stat, unlink } from "fs/promises";
import { createWriteStream } from "fs";
import { spawn } from "child_process";
import path from "path";

const backupDir = path.resolve(process.env.BACKUP_DIR || "backups");
const retentionDays = Math.max(Number(process.env.BACKUP_RETENTION_DAYS || 14), 1);
await mkdir(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = path.join(backupDir, `annai-jewellery-${stamp}.sql`);
const args = [
  `--host=${process.env.DB_HOST || "127.0.0.1"}`,
  `--port=${process.env.DB_PORT || "3306"}`,
  `--user=${process.env.DB_USER || "root"}`,
  "--single-transaction",
  "--routines",
  "--triggers",
  "--events",
  "--set-gtid-purged=OFF",
  process.env.DB_NAME || "annai_jewellery",
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
