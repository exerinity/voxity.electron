const { app, BrowserWindow, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_ID = "com.exerinity.voxity"; // this should be "com.exerinity.audion" (matching the webmanifest), but this electron build is brand-new, so...
const START_URL = "https://voxity.exerinity.com";
const ICON_PATH = path.join(__dirname, "build", "APP.ico");

function ensureStartMenuShortcut() {
  if (app.isPackaged || process.platform !== "win32") return;

  const shortcutPath = path.join(
    process.env.APPDATA,
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "Voxity.lnk"
  );

  if (!fs.existsSync(shortcutPath)) {
    try {
      const ws = require("windows-shortcuts");
      ws.create(shortcutPath, {
        target: process.execPath,
        appUserModelId: APP_ID,
      });
    } catch (err) {
      console.warn("could not create start shortcut:\n", err);
    }
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Voxity",
    icon: nativeImage.createFromPath(ICON_PATH),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.webContents.on("will-prevent-unload", (e) => e.preventDefault());

  win.loadURL(START_URL);
}

app.setAppUserModelId(APP_ID);

app.whenReady().then(() => {
  ensureStartMenuShortcut();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
