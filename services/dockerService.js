const fs = require('fs');
const Docker = require('dockerode');
const { dialog } = require('electron');

class DockerService {
  constructor(opts) {
    if (opts) {
      const config = {
        host: opts.host,
        port: opts.port,
      };

      if (opts.caPath) {
        Object.assign(config, {
          ca: fs.readFileSync(opts.caPath),
          cert: fs.readFileSync(opts.certPath),
          key: fs.readFileSync(opts.keyPath),
        });
      }

      this.dockerProvider = new Docker(config);
      return;
    }

    this.dockerProvider = new Docker();
  }

  async fetchContainers(opts = {}) {
    const containers = await this.dockerProvider.listContainers(opts);
    return containers;
  }

  async restartContainer(containerId) {
    const container = this.dockerProvider.getContainer(containerId);
    await container.restart();
  }

  async getContainerLogs(containerId) {
    const container = this.dockerProvider.getContainer(containerId);

    const logOpts = {
      stdout: 1,
      stderr: 1,
      tail: 100,
      follow: 0,
    };

    const data = await container.logs(logOpts);

    console.log(data);

    return data;
  }

  async startContainer(containerId) {
    const container = this.dockerProvider.getContainer(containerId);
    await container.start();
  }

  async stopContainer(containerId) {
    const container = this.dockerProvider.getContainer(containerId);
    await container.stop();
  }
}

process.on('unhandledRejection', (reason) => { // Temporary
  dialog.showErrorBox('Error on application', reason.message);
});

module.exports = DockerService;
