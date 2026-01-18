const { app, BrowserWindow, nativeImage, shell } = require("electron");
const path = require("path");

const APP_ID = "com.exerinity.voxity";
const APP_NAME = "Voxity";
const START_URL = "https://voxity.dev?electron=true";

const ICON_PATH = path.join(__dirname, "build", "voxity.png");

app.setName("voxity");
app.setAppUserModelId(APP_ID);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: APP_NAME,
    icon: nativeImage.createFromPath(ICON_PATH),
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  win.webContents.on("will-prevent-unload", e => e.preventDefault());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadURL(START_URL);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});