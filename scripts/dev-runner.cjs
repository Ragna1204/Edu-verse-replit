const { spawn } = require('child_process');

function run(name, cmd, args) {
  const full = `${cmd} ${args.join(' ')}`;
  console.log(`Starting ${name}: ${full}`);
  // Use the system shell to execute the full command string so the shell resolves the `npm` binary
  const child = spawn(full, {
    stdio: 'inherit',
    shell: true,
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
