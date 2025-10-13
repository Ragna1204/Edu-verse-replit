const { spawn } = require('child_process');

function run(name, cmd, args) {
  console.log(`Starting ${name}: ${cmd} ${args.join(' ')}`);
  const child = spawn(cmd, args, {
    shell: 'powershell.exe',
    stdio: 'inherit',
    windowsHide: false,
  });

  child.on('exit', (code, signal) => {
    console.log(`${name} exited with code ${code}${signal ? ` signal ${signal}` : ''}`);
  });

  child.on('error', (err) => {
    console.error(`${name} spawn error:`, err);
    process.exit(1);
  });

  return child;
}

const server = run('server', 'npm', ['run', 'server:dev']);
const client = run('client', 'npm', ['run', 'client:dev']);

function shutdown() {
  try { server.kill(); } catch (e) {}
  try { client.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
