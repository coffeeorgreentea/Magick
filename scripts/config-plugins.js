
const DOCKER_BUILD = process.env.DOCKER_BUILD === "true" ? true : false;

try {
  const dotenv = require('dotenv-flow')
  dotenv.config('../');
} catch {
  console.log(
    '`npm install` is likely running with `--dry-run` or `---package-lock-only` flags. Exiting.'
  )
  process.exit(0)
}

console.log('Server plugins', process.env.SERVER_PLUGINS)
console.log('Client plugins', process.env.CLIENT_PLUGINS)

const serverPlugins = process.env.SERVER_PLUGINS ? process.env.SERVER_PLUGINS.split(',').map(
  (plugin) => {
    return `@magickml/plugin-${plugin}-server`;
  }
) : [];
const clientPlugins = process.env.CLIENT_PLUGINS ? process.env.CLIENT_PLUGINS.split(',').map(
  (plugin) => {
    return `@magickml/plugin-${plugin}-client`;
  }
) : [];

const path = require('path');
const fs  = require('fs');

// Define base paths depending on whether GCP is true or not.
const basePathClient = isGCP ? ['..', 'client', 'src'] : ['..', 'apps', 'client', 'src'];
const basePathServer = isGCP ? ['..', 'server', 'src'] : ['..', 'apps', 'server', 'src'];
const basePathAgent = isGCP ? ['..', 'agent', 'src'] : ['..', 'apps', 'agent', 'src'];
const basePathCloudAgentWorker = isGCP ? ['..', 'cloud-agent-worker', 'src'] : ['..', 'apps', 'cloud-agent-worker', 'src'];

// Construct paths using the base paths defined above.
const pluginsJsPathClient = path.join(__dirname, ...basePathClient, 'plugins.ts');
const pluginsJsPathServer = path.join(__dirname, ...basePathServer, 'plugins.ts');
const pluginsJsPathAgent = path.join(__dirname, ...basePathAgent, 'plugins.ts');
const pluginsJsPathCloudAgentWorker = path.join(__dirname, ...basePathCloudAgentWorker, 'plugins.ts');

console.log(pluginsJsPathClient);
console.log(pluginsJsPathServer);
console.log(pluginsJsPathAgent);
console.log(pluginsJsPathCloudAgentWorker);

function copyExamplePluginsJson() {

  let i = 0;

  let importString = 'const plugins = {}\n';
  for (const plugin of serverPlugins) {
    importString += `import {default as plugin${i}} from '${plugin}';\nplugins['${plugin}'] = plugin${i};\n`;
    i++;
  }
  importString += 'export default plugins;';

  fs.writeFileSync(pluginsJsPathServer, importString);
  fs.writeFileSync(pluginsJsPathAgent, importString);
  fs.writeFileSync(pluginsJsPathCloudAgentWorker, importString);

  importString = 'const plugins = {}\n';
  for (const plugin of clientPlugins) {
    importString += `import {default as plugin${i}} from '${plugin}';\nplugins['${plugin}'] = plugin${i};\n`;
    i++;
  }
  importString += 'export default plugins;';

  fs.writeFileSync(pluginsJsPathClient, importString);

}

copyExamplePluginsJson();
