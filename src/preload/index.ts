import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import path from "path";
import { join } from "path";
import fs from "fs/promises";

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld("electron", electronAPI);
        contextBridge.exposeInMainWorld("path", path);
        contextBridge.exposeInMainWorld("fs", fs);
    } catch (error) {
        console.error(error);
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI;
    // @ts-ignore (define in dts)
    window.path = {
        join,
    };
    // @ts-ignore (define in dts)
    window.fs = fs;
}
