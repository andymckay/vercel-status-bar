const xbar_plugins = `${process.env.HOME}/Library/Application Support/xbar/plugins`;
const fs = require('fs');
const path = require('path');

/* Confirm the xbar plugins directory exists
   and fail if it doesn't */
if (!fs.existsSync(xbar_plugins)) {
    console.error(`❌ xbar plugins directory not found at ${xbar_plugins}`);
    process.exit(1);
}

/* Confirm that is installed */
const { execSync } = require('child_process');
try {
    execSync('which npm');
} catch (e) {
    console.error('❌ npm not installed');
    process.exit(1);
}

/* Install the node dependencies */
execSync('npm install', { cwd: path.resolve(__dirname, 'plugins') });
console.log('👍 node modules installed');

/* Create a symlink to the plugins in the xbar plugins directory */
if (!fs.existsSync(path.resolve(xbar_plugins, 'status.1m.bash'))) {
    fs.symlinkSync(
        path.resolve(__dirname, 'plugins', 'status.1m.bash'),
        path.resolve(xbar_plugins, 'status.1m.bash'),
    );
    console.log('👍 xbar plugins status.1m.bash into the xbar plugins directory');
}
if (!fs.existsSync(path.resolve(xbar_plugins, 'vercel.1m.bash'))) {
    fs.symlinkSync(
        path.resolve(__dirname, 'plugins', 'vercel.1m.bash'),
        path.resolve(xbar_plugins, 'vercel.1m.bash'),
    );
    console.log('👍 xbar plugins vercel.1m.bash into the xbar plugins directory');
}

/* Make sure that each bash script is executable */
fs.readdirSync(path.resolve(__dirname, 'plugins')).forEach(file => {
    if (file.endsWith('.sh')) {
        fs.chmodSync(path.resolve(__dirname, 'plugins', file), 0o755);
    }
});
console.log('👍 xbar plugins are made executable');

/* Copy .env.sample to .env so that it's available to configure */
console.log(path.resolve(__dirname, '.env'))
if (!fs.existsSync(path.resolve(__dirname, '.env'))) {
    fs.copyFileSync(path.resolve(__dirname, '.env.sample'), path.resolve(__dirname, '.env'));
    console.log('👍 .env file created');
}