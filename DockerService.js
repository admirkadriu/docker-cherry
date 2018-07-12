const fs = require('fs');
const Docker = require('dockerode');

const docker = new Docker();


class DockerService {
  async fetchContainers() {
    const containers = await docker.listContainers();
    return containers;
  }

  async restartContainer(containerId) {
    const container = docker.getContainer(containerId);
    await container.restart();
  }

  async getContainerLogs(containerId) {
    const container = docker.getContainer(containerId);

    const data = await container.logs();

    console.log(data);
  }

  async startContainer(containerId) {
    const container = docker.getContainer(containerId);
    await container.start();
  }

  async stopContainer(containerId) {
    const container = docker.getContainer(containerId);
    await container.stop();
  }
}

module.exports = DockerService;
