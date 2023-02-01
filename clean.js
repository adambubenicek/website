import fs from "node:fs/promises";
import { TEMP_DIR, PUBLIC_DIR } from "./constants.js";

await fs.rm(TEMP_DIR, { recursive: true, force: true });
await fs.rm(PUBLIC_DIR, { recursive: true, force: true });
