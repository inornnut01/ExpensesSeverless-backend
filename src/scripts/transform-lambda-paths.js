import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "../dist/expenses");

function transformPaths(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      transformPaths(filePath);
    } else if (file.name.endsWith(".js")) {
      let content = fs.readFileSync(filePath, "utf8");

      // Transform relative imports to Lambda Layer paths
      content = content.replace(
        /from ["']\.\.\/services\/([^"']+)["']/g,
        'from "/opt/nodejs/services/$1"'
      );
      content = content.replace(
        /from ["']\.\.\/utils\/([^"']+)["']/g,
        'from "/opt/nodejs/utils/$1"'
      );

      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✓ Transformed: ${filePath}`);
    }
  }
}

console.log("🔄 Transforming Lambda paths...");
transformPaths(distDir);
console.log("✅ Path transformation completed!");
