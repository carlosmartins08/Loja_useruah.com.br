import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [path.join(root, "app"), path.join(root, "components")];
const violations = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (entry.name.includes('.bak')) continue;
    if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

for (const file of targets.flatMap(walk)) {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("from \"next/image\"") || content.includes("from 'next/image'")) {
    if (!relative(file).endsWith("components/shared/AppImage.tsx")) {
      violations.push(
        `${relative(file)}: use AppImage em vez de importar next/image diretamente.`,
      );
    }
  }

  const imageTags = [...content.matchAll(/<Image\b[\s\S]*?>/g)];
  for (const match of imageTags) {
    if (!/alt\s*=/.test(match[0])) {
      violations.push(`${relative(file)}: componente <Image> sem atributo alt.`);
    }
  }
}

if (violations.length > 0) {
  console.error("Falha no QA de governanca de conteudo/imagem:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("QA de governanca de conteudo/imagem: OK");
