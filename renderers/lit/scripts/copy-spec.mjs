import { mkdir, readdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.resolve(rootDir, "..", "..", "specification", "0.8", "json");
const destDir = path.resolve(rootDir, "src", "0.8", "schemas");

await mkdir(destDir, { recursive: true });

const entries = await readdir(sourceDir, { withFileTypes: true });
const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));

for (const file of jsonFiles) {
  const sourcePath = path.join(sourceDir, file.name);
  const destPath = path.join(destDir, file.name);
  await copyFile(sourcePath, destPath);
}
