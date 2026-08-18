import paramiko

def check_proxy():
    host = '46.28.40.104'
    port = 65002
    username = 'u902643667'
    password = 'InspireFaith2026!'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, port, username, password)
        sftp = ssh.open_sftp()
        with sftp.file('domains/inspiremyfaith.com/public_html/api/index.php', 'r') as f:
            print(f.read().decode('utf-8'))
        sftp.close()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    check_proxy()
