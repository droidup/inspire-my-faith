import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const conn = new Client();
const USER = 'u902643667';
const HOST = 'inspiremyfaith.com';
const PORT = 65002;
const PASS = 'vJZ9koQE:7qy*Ua[P0tY';

conn.on('ready', () => {
    console.log('SSH connection established');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        console.log('SFTP session started');
        
        // Define remote paths
        const remoteDir = './backend';
        const serverFile = `${remoteDir}/server.cjs`;
        const envFile = `${remoteDir}/.env`;
        const packageJsonFile = `${remoteDir}/package.json`;

        // We will execute a chain of commands
        conn.exec(`mkdir -p ${remoteDir}`, (err, stream) => {
            if (err) throw err;
            stream.on('close', () => {
                console.log('Created ~/backend directory');
                
                // Upload files
                sftp.fastPut('dist/server.cjs', serverFile, (err) => {
                    if (err) throw err;
                    console.log('Uploaded server.cjs');
                    
                    sftp.fastPut('.env', envFile, (err) => {
                        if (err) throw err;
                        console.log('Uploaded .env');
                        
                        sftp.fastPut('package.json', packageJsonFile, (err) => {
                            if (err) throw err;
                            console.log('Uploaded package.json');
                            
                            // Now run the installation commands
                            const cmds = [
                                'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash',
                                'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"',
                                'nvm install 20',
                                'nvm use 20',
                                'npm install -g pm2',
                                `cd ${remoteDir} && npm install --production`,
                                `pm2 stop server || true`,
                                `cd ${remoteDir} && pm2 start server.cjs --name "server"`
                            ].join(' && ');

                            console.log('Running installation commands on server... (this might take a few minutes)');
                            
                            conn.exec(cmds, (err, stream) => {
                                if (err) throw err;
                                stream.on('close', (code, signal) => {
                                    console.log('Server deployment completed with code: ' + code);
                                    conn.end();
                                }).on('data', (data) => {
                                    console.log('STDOUT: ' + data);
                                }).stderr.on('data', (data) => {
                                    console.log('STDERR: ' + data);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}).connect({
    host: HOST,
    port: PORT,
    username: USER,
    password: PASS,
    readyTimeout: 30000
});
