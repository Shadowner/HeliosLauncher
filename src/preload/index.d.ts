import { ElectronAPI } from "@electron-toolkit/preload";
import type { join } from "path";
import fs from "fs/promises";

declare global {
    interface Window {
        electron: ElectronAPI;
        path: {
            join: join;
        };
        fs: fs;
    }
}
