const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const APP_NAME = "Voxity";
const START_URL = "https://voxity.dev?electron=true";
const ICON_PATH = path.join(__dirname, "voxity.png");

app.setName(APP_NAME);
app.setAppUserModelId("com.exerinity.voxity");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: APP_NAME,
    icon: ICON_PATH,
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.webContents.on("will-prevent-unload", e => e.preventDefault());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(START_URL);

  createMenu(mainWindow);
}

function createMenu(win) {
  const run = (code) => {
    if (!win || win.isDestroyed()) return;
    win.webContents.executeJavaScript(code).catch(() => {});
  };

  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "About",
          click: () => run(`msg?.(about_content);`)
        },
        {
          label: "Rewelcome",
          click: () => run(`welcome?.();`)
        },
        {
          label: "Open sleep timer",
          click: () => run(`openSleepTimerModal?.();`)
        },
        {
          label: "Open settings",
          click: () => run(`document.getElementById('settings')?.click();`)
        },
        { type: "separator" },
        { role: "quit", label: "Exit Voxity" }
      ]
    },
    {
      label: "Playback",
      submenu: [
        {
          label: "Previous Track",
          click: () => run(`previ?.();`)
        },
        {
          label: "Back 10 Seconds",
          click: () => run(`document.getElementById('rwd')?.click();`)
        },
        {
          label: "Toggle Playback",
          click: () => run(`document.getElementById('plps')?.click();`)
        },
        {
          label: "Forward 10 Seconds",
          click: () => run(`document.getElementById('fwd')?.click();`)
        },
        {
          label: "Next",
          click: () => run(`contin?.();`)
        },
        { type: "separator" },
        {
          label: "Shuffle",
          click: () => run(`document.getElementById('shuffle')?.click();`)
        },
        {
          label: "Loop",
          click: () => run(`document.getElementById('loop')?.click();`)
        }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "Miscellaneous",
      submenu: [
        {
          label: "Email",
          click: () => shell.openExternal("https://exerinity.com/email")
        },
        {
          label: "Reinject Font Awesome",
          click: () => run(`loadFA?.();`)
        },
        {
          label: "View release notes",
          click: () => run(`relnote?.();`)
        },
        {
          label: "Recalculate queue duration",
          click: () => run(`calqueue?.();`)
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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