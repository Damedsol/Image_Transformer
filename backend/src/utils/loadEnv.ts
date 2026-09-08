import { config } from "dotenv";

// Load environment variables exactly once, quietly, before any module reads
// process.env at module evaluation time. index.ts imports this module first.
config({ quiet: true });
