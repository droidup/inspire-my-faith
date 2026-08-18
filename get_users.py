import paramiko

def run_ssh():
    host = '46.28.40.104'
    port = 65002
    username = 'u902643667'
    password = 'InspireFaith2026!'
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, port, username, password)
        # We need to query the database using the env vars from the backend
        cmd = """
        export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
        cd domains/inspiremyfaith.com/backend
        node -e "
        require('dotenv').config();
        const mysql = require('mysql2/promise');
        async function run() {
            const pool = mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            });
            const [rows] = await pool.query('SELECT user_id, email FROM users LIMIT 5');
            console.log(rows);
            process.exit(0);
        }
        run().catch(console.error);
        "
        """
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("STDOUT:", stdout.read().decode())
        print("STDERR:", stderr.read().decode())
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    run_ssh()
