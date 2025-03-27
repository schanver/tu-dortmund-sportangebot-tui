import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { fileURLToPath  } from 'url';

// Get the current file's directory (which is ./src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Move up one level to reach the project root
export const PROJECT_ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(__dirname, './.env') });
