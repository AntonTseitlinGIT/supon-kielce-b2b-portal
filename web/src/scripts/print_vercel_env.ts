import fs from "fs";
import path from "path";

const content = fs.readFileSync(path.join(process.cwd(), ".env.vercel.prod"), "utf-8");
content.split("\n").forEach(line => {
  if (line.startsWith("DATABASE_URL=")) {
    console.log("VERCEL PROD DATABASE_URL:", line.substring("DATABASE_URL=".length));
  }
});
