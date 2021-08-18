const path = require('path');
const os = require('os');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');
const log = require('electron-log');

process.env.NODE_ENV = 'development';

const isDev = process.env.NODE_ENV !== 'production';

const isMac = process.platform === 'darwin';

let mainWindow;
let aboutWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'ImageShrink',
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    backgroundColor: 'white',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile('./app/index.html');
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 300,
    resizable: false,
    title: 'About ImageShrink',
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    backgroundColor: 'white',
  });

  aboutWindow.loadFile('./app/about.html');
}

const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: createAboutWindow(),
            },
          ],
        },
      ]
    : []),
  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        click: () => app.quit(),
        accelerator: 'CmdOrCtrl+W',
      },
    ],
  },
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' },
          ],
        },
      ]
    : []),
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            {
              label: app.name,
              label: 'About',
              click: () => createAboutWindow(),
            },
          ],
        },
      ]
    : []),
];

app
  .whenReady()
  .then(() => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on('closed', () => (mainWindow = null));

    ipcMain.on('image:minimize', (e, options) => {
      options.dest = path.join(os.homedir(), 'imageshrink');
      shrinkImage(options);
    });

    //Makes sure app quits entirely
    appCleanup(app);
  })
  .catch(err => console.error(err));

//- Helper Functions
function appCleanup(app) {
  app.on('window-all-close', () => {
    if (isMac) app.quit();
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}

async function shrinkImage({ imgPath, quality, dest }) {
  try {
    const pngQuality = quality / 100;
    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngQuality, pngQuality],
        }),
      ],
    });

    log.info(files);

    shell.openPath(dest);

    mainWindow.webContents.send('image:done');
  } catch (error) {
    log.error(error);
  }
}
