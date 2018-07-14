const { ipcRenderer } = require('electron');

const $hostInput = document.getElementById('host');
const $portInput = document.getElementById('port');
const $caPathInput = document.getElementById('caPath');
const $certPathInput = document.getElementById('certPath');
const $keyPathInput = document.getElementById('keyPath');
const $okButton = document.getElementById('ok');
const $cancelButton = document.getElementById('cancel');
const $isLocalDockerCheckBox = document.getElementById('isLocalDocker');
const $startOnStartupCheckBox = document.getElementById('startOnStartup');
const $remoteDockerDiv = document.getElementById('remoteDocker');

ipcRenderer.on('fill-values', (event, arg) => {
  $hostInput.value = arg.remoteDockerConfig.host;
  $portInput.value = arg.remoteDockerConfig.port;
  $caPathInput.value = arg.remoteDockerConfig.caPath;
  $certPathInput.value = arg.remoteDockerConfig.certPath;
  $keyPathInput.value = arg.remoteDockerConfig.keyPath;
  $isLocalDockerCheckBox.checked = arg.isLocalDocker;
  $startOnStartupCheckBox.checked = arg.startOnStartup;

  if (!arg.isLocalDocker) {
    $remoteDockerDiv.classList.remove('disabledDiv');
  }
});

$okButton.addEventListener('click', () => {
  const values = {
    remoteDockerConfig: {
      host: $hostInput.value,
      port: $portInput.value,
      caPath: $caPathInput.value,
      certPath: $certPathInput.value,
      keyPath: $keyPathInput.value,
    },
    isLocalDocker: $isLocalDockerCheckBox.checked,
    startOnStartup: $startOnStartupCheckBox.checked,
  };

  ipcRenderer.sendSync('updated-values', values);

  window.close();
});

$cancelButton.addEventListener('click', () => {
  window.close();
});

$isLocalDockerCheckBox.addEventListener('click', () => {
  if ($isLocalDockerCheckBox.checked) {
    $remoteDockerDiv.classList.add('disabledDiv');
  } else {
    $remoteDockerDiv.classList.remove('disabledDiv');
  }
});
