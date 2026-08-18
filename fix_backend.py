import paramiko

def fix_backend():
    host = '46.28.40.104'
    port = 65002
    username = 'u902643667'
    password = 'InspireFaith2026!'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, port, username, password)
        # Start the backend via PM2
        cmd = """
        export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
        cd domains/inspiremyfaith.com/backend
        npm install
        pm2 start dist/server.cjs --name "api-server"
        pm2 save
        pm2 status
        """
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
        print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    fix_backend()
