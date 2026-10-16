import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "./db";

async function main() {
  await pool.query(readFileSync(join(__dirname, "..", "schema.sql"), "utf8"));
  console.log("todos table ready");
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
