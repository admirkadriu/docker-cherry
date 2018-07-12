const {
  app, BrowserWindow, Tray, Menu,
} = require('electron');
const Store = require('electron-store');
const DockerService = require('./DockerService');

let appTray = null;
let win = null;

const service = new DockerService();

async function listContainers() {
  appTray.setToolTip('Loading your issues...');
  // appTray.setContextMenu(Menu.buildFromTemplate(commonMenu));

  const containers = await service.fetchContainers();

  const items = containers.map(container => ({
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

  const contextMenu = await Menu.buildFromTemplate(items);
  await appTray.setContextMenu(contextMenu);
  await appTray.setToolTip('Right-click to view containers.');

  console.info('Loaded containers succesfully.');
}

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
