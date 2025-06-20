import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath  } from 'url';

// Get the current file's directory (which is ./src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Move up one level to reach the project root
export const PROJECT_ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(PROJECT_ROOT, './.env') });
