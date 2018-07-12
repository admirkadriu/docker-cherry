const {
  app, BrowserWindow, Tray, Menu,
} = require('electron');
const Store = require('electron-store');
const DockerService = require('./DockerService');

let appTray = null;
let win = null;

const service = new DockerService();

const getMenuItemsFromContainers = containers => containers.map(container => ({
  label: `${container.Names[0]}`,
  submenu: [
    {
      label: 'Restart',
      click: () => {
        service.restartContainer(container.Id);
      },
    },
    {
      label: 'Logs..',
      click: () => {
        service.getContainerLogs(container.Id);
      },
    },
    {
      label: container.State === 'running' ? 'Stop' : 'Start',
      click: () => {
        if (container.State === 'running') {
          service.stopContainer(container.Id);
        } else {
          service.startContainer(container.Id);
        }
      },
    },
  ],
}));


const listContainers = async () => {
  appTray.setToolTip('Loading containers...');

  const containers = await service.fetchContainers({ all: true });

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


  const commonMenu = [
    {
      label: 'Configure',
    },
    {
      label: 'Refresh',
      click: listContainers,
    },
    {
      role: 'quit',
    },
  ];

  const contextMenu = await Menu.buildFromTemplate([
    ...containersMenu,
    { type: 'separator' },
    ...commonMenu,
  ]);

  await appTray.setContextMenu(contextMenu);
  await appTray.setToolTip('Right-click to view containers.');

  console.info('Loaded containers successfully.');
};

app.on('ready', () => {
  win = new BrowserWindow({
    autoHideMenuBar: true,
    webPreferences: {
      devTools: false,
    },
    show: false,
  });

  appTray = new Tray('docker.ico');

  listContainers();
});
