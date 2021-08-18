const { app, BrowserWindow, Menu } = require('electron');

process.env.NODE_ENV = 'development';

const isDev = process.env.NODE_ENV !== 'production';

const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';

let mainWindow;
let aboutWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    title: 'ImageShrink',
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    backgroundColor: 'white',
  });

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
