const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voxityMpris", {
  updateState: (state) => ipcRenderer.send("mpris:state", state),
  onControl: (callback) => {
    ipcRenderer.on("mpris", (_event, channel, payload) => callback(channel, payload));
  },

  offControl: () => {
    ipcRenderer.removeAllListeners("mpris");
  },
});