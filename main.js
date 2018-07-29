const {
  app, BrowserWindow, Tray, Menu, ipcMain, dialog, nativeImage,
} = require('electron');
const path = require('path');
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');

const cherryAutoLaunch = new AutoLaunch({
  name: 'DockerCherry',
});

const DockerService = require('./services/dockerService');

let win;
let configureWindow;
let appTray;

const config = new Store({
  defaults: {
    remoteDockerConfig: {
      host: '',
      port: 2736,
      caPath: '',
      certPath: '',
      keyPath: '',
    },
    isLocalDocker: false,
    startOnStartup: false,
    first_time: true,
  },
});

let dockerService = new DockerService(config.get('isLocalDocker') ? null : config.get('remoteDockerConfig'));

const configureHelper = () => {
  if (configureWindow) {
    configureWindow.focus();
    return;
  }

  configureWindow = new BrowserWindow({
    width: 600,
    height: 500,
    title: 'Configure Docker Cherry',
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: false,
    },
    alwaysOnTop: false,
    frame: true,
  });

  configureWindow.loadURL(`file://${path.join(__dirname, 'public', 'configure.html')}`);
  configureWindow.webContents.on('did-finish-load', () => {
    configureWindow.webContents.send('fill-values', config.store);
  });

  ipcMain.on('updated-values', (event, args) => {
    config.set('first_time', false);
    config.set(args);


    dockerService = new DockerService(args.isLocalDocker ? null : args.remoteDockerConfig);

    if (args.startOnStartup) {
      cherryAutoLaunch.enable();
    } else {
      cherryAutoLaunch.disable();
    }

    event.returnValue = true;
    listContainers();
  });

  configureWindow.on('closed', () => {
    configureWindow = null;
  });
};


const getMenuItemsFromContainers = containers => containers.map(container => ({
  label: `${container.Names[0]}`,
  submenu: [
    {
      label: 'Restart',
      click: () => {
        dockerService.restartContainer(container.Id);
        listContainers();
      },
    },
    {
      label: 'Logs..',
      click: async () => {
        const data = await dockerService.getContainerLogs(container.Id);
        dialog.showMessageBox({
          message: data,
          buttons: ['OK'],
        });
      },
    },
    {
      label: container.State === 'running' ? 'Stop' : 'Start',
      click: () => {
        if (container.State === 'running') {
          dockerService.stopContainer(container.Id);
        } else {
          dockerService.startContainer(container.Id);
        }
        listContainers();
      },
    },
  ],
}));

const listContainers = async () => {
  appTray.setContextMenu(Menu.buildFromTemplate(commonMenu));

  appTray.setToolTip('Loading containers...');

  const containers = await dockerService.fetchContainers({ all: true });

  const runningContainers = [];
  const stoppedContainers = [];

  containers.forEach((container) => {
    if (container.State === 'running') {
      runningContainers.push(container);
    } else {
      stoppedContainers.push(container);
    }
  });

  const containersMenu = [
    {
      label: 'Running containers',
      submenu: getMenuItemsFromContainers(runningContainers),
    }, {
      label: 'Stopped containers',
      submenu: getMenuItemsFromContainers(stoppedContainers),
    }];

  const contextMenu = await Menu.buildFromTemplate([
    ...containersMenu,
    { type: 'separator' },
    ...commonMenu,
  ]);

  await appTray.setContextMenu(contextMenu);
  await appTray.setToolTip('Right-click to view containers.');

  console.info('Loaded containers successfully.');
};


const commonMenu = [
  {
    label: 'Configure',
    click: configureHelper,
  },
  {
    label: 'Refresh',
    click: listContainers,
  },
  {
    role: 'quit',
  },
];

app.on('ready', () => {
  win = new BrowserWindow({
    autoHideMenuBar: true,
    webPreferences: {
      devTools: false,
    },
    show: false,
  });

  const iconPath = path.join(__dirname, 'build', 'docker.ico');
  appTray = new Tray(nativeImage.createFromPath(iconPath));

  if (config.get('first_time')) {
    configureHelper();
  } else {
    listContainers();
  }
});
