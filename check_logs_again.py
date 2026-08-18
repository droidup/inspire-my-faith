import paramiko

def check_logs():
    host = '46.28.40.104'
    port = 65002
    username = 'u902643667'
    password = 'InspireFaith2026!'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, port, username, password)
        commands = [
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 logs --lines 200 --nostream"
        ]
        
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            print("STDOUT:\n", stdout.read().decode('utf-8', errors='replace'))
            print("STDERR:\n", stderr.read().decode('utf-8', errors='replace'))
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    check_logs()
