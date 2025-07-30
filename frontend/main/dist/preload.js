"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    on: (channel, callback) => {
        electron_1.ipcRenderer.on(channel, callback);
    },
    send: (channel, args) => {
        electron_1.ipcRenderer.send(channel, args);
    }
});
