import paramiko
import os

def run_ssh_commands():
    host = '46.28.40.104'
    port = 65002
    username = 'u902643667'
    password = 'vJZ9koQE:7qy*Ua[P0tY'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("Connecting to SSH...")
        ssh.connect(host, port, username, password)
        print("Connected successfully!")
        
        # Open SFTP to upload files
        sftp = ssh.open_sftp()
        print("Uploading server.cjs...")
        sftp.put('dist/server.cjs', 'domains/inspiremyfaith.com/public_html/my/server.cjs')
        print("Uploading .env...")
        sftp.put('.env', 'domains/inspiremyfaith.com/public_html/my/.env')
        sftp.close()
        print("Uploads complete.")
        
        # We need to restart or start PM2 on server.cjs
        # We should cd into the directory, load nvm, and run pm2 start server.cjs
        commands = [
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd domains/inspiremyfaith.com/public_html/my && pm2 delete imf-api || true",
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd domains/inspiremyfaith.com/public_html/my && pm2 start server.cjs --name imf-api",
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 save"
        ]
        
        for cmd in commands:
            print(f"Running: {cmd}")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            exit_status = stdout.channel.recv_exit_status()
            print("STDOUT:", stdout.read().decode())
            print("STDERR:", stderr.read().decode())
            print(f"Exit status: {exit_status}")
            
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    run_ssh_commands()
