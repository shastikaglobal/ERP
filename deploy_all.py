import os
import sys
import io
import subprocess
import paramiko

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# ── CONFIG ──────────────────────────────────────────────────────────────────
VPS_IP       = "195.35.22.13"
VPS_PORT     = 22
VPS_USER     = "root"
VPS_PASSWORD = "SHASTIKARAM@2026"

REMOTE_FRONTEND = "/var/www/shastika-erp"   # nginx serves this
REMOTE_BACKEND  = "/var/www/adms-sync"

LOCAL_ROOT      = os.path.dirname(os.path.abspath(__file__))
LOCAL_BACKEND   = os.path.join(LOCAL_ROOT, "adms-sync")
LOCAL_DIST      = os.path.join(LOCAL_ROOT, "dist")
# ────────────────────────────────────────────────────────────────────────────

def load_local_env():
    env_vars = {}
    env_path = os.path.join(LOCAL_ROOT, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip().strip('"').strip("'")
    return env_vars


def run_ssh(ssh, cmd, label=""):
    if label:
        print(f"   🏃 {label}...")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if exit_status != 0 and err:
        print(f"   ⚠️  {err[:300]}")
    elif out:
        print(f"   ✔  {out[:200]}")
    return exit_status


def sftp_put_dir(sftp, local_path, remote_path, skip=None):
    skip = skip or []
    try:
        sftp.mkdir(remote_path)
    except IOError:
        pass
    for item in os.listdir(local_path):
        if item in skip:
            continue
        l_item = os.path.join(local_path, item)
        r_item = remote_path + "/" + item
        if os.path.isdir(l_item):
            sftp_put_dir(sftp, l_item, r_item, skip)
        else:
            sftp.put(l_item, r_item)


def step_build_frontend():
    print("\n" + "=" * 60)
    print("📦  STEP 1 – Building React Frontend  (npm run build)")
    print("=" * 60)
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=LOCAL_ROOT,
        capture_output=False,
        shell=True,
    )
    if result.returncode != 0:
        print("❌  Frontend build FAILED. Aborting.")
        sys.exit(1)
    print("✅  Build finished. Output is in /dist")


def main():
    print("=" * 60)
    print("🚀  Shastika Global Impex — Full Deploy")
    print("    Frontend + Backend + DB check")
    print("=" * 60)

    local_env = load_local_env()
    supabase_url = local_env.get("VITE_SUPABASE_URL", "")
    supabase_key = local_env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    # ── STEP 1: Build Frontend ──────────────────────────────────────────────
    step_build_frontend()

    # ── CONNECT SSH ─────────────────────────────────────────────────────────
    print(f"\n📡  Connecting to VPS {VPS_IP}:{VPS_PORT} ...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASSWORD, timeout=20)
    print("✅  SSH connected!")

    sftp = ssh.open_sftp()

    # ── STEP 2: Upload Frontend Build ───────────────────────────────────────
    print("\n" + "=" * 60)
    print("📤  STEP 2 – Uploading Frontend Build → VPS")
    print("=" * 60)

    run_ssh(ssh, f"mkdir -p {REMOTE_FRONTEND}", "Creating remote frontend dir")
    run_ssh(ssh, f"rm -rf {REMOTE_FRONTEND}/*", "Clearing old frontend files")

    print("   📁 Uploading dist/ ...")
    sftp_put_dir(sftp, LOCAL_DIST, REMOTE_FRONTEND)
    print("   ✅ Frontend files uploaded!")

    # ── STEP 3: Upload Backend ──────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("📤  STEP 3 – Uploading Backend (adms-sync) → VPS")
    print("=" * 60)

    run_ssh(ssh, f"mkdir -p {REMOTE_BACKEND}", "Creating remote backend dir")

    skip_backend = [".env", "node_modules", "__pycache__", ".git", ".idea", ".vscode"]
    sftp_put_dir(sftp, LOCAL_BACKEND, REMOTE_BACKEND, skip=skip_backend)
    print("   ✅ Backend files uploaded!")

    # Upload .env for backend
    env_content = (
        f"PORT=8082\n"
        f"SUPABASE_URL={supabase_url}\n"
        f"SUPABASE_SERVICE_ROLE_KEY={supabase_key}\n"
        f"DEVICE_TIMEZONE_OFFSET=+05:30\n"
        f"PG_PASSWORD=Shastika2026\n"
    )
    sftp.putfo(io.BytesIO(env_content.encode("utf-8")), f"{REMOTE_BACKEND}/.env")
    print("   ✅ Backend .env uploaded!")

    # ── STEP 4: Install deps & restart backend ──────────────────────────────
    print("\n" + "=" * 60)
    print("⚙️   STEP 4 – Installing Dependencies & Restarting Backend")
    print("=" * 60)

    cmds = [
        (f"cd {REMOTE_BACKEND} && npm install express dotenv @supabase/supabase-js ws pg cors jsonwebtoken node-cron", "npm install"),
        (f"npm install -g pm2", "Ensure pm2 is installed"),
        (f"cd {REMOTE_BACKEND} && pm2 restart adms-sync || pm2 start server.js --name adms-sync", "Restart pm2 adms-sync"),
        ("pm2 save", "Save pm2 process list"),
    ]
    for cmd, label in cmds:
        run_ssh(ssh, cmd, label)

    # ── STEP 5: Reload Nginx ────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("🌐  STEP 5 – Reloading Nginx")
    print("=" * 60)

    nginx_conf_check = (
        "grep -q 'root /var/www/shastika-erp' /etc/nginx/sites-available/default"
    )
    rc = run_ssh(ssh, nginx_conf_check)

    if rc != 0:
        print("   ⚠️  Nginx root not pointing to frontend yet. Updating config...")
        # Patch nginx to serve frontend from REMOTE_FRONTEND
        stdin, stdout, _ = ssh.exec_command("cat /etc/nginx/sites-available/default")
        nginx_conf = stdout.read().decode("utf-8")

        # Replace root directive
        import re
        new_conf = re.sub(r'root\s+[^;]+;', f'root {REMOTE_FRONTEND};', nginx_conf)
        sftp.putfo(io.BytesIO(new_conf.encode("utf-8")), "/etc/nginx/sites-available/default")
        print("   ✅ Nginx root updated to serve new frontend.")

    run_ssh(ssh, "nginx -t && systemctl reload nginx", "nginx -t && reload")

    # ── STEP 6: DB Health Check ─────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("🗄️   STEP 6 – Database Health Check (PostgreSQL)")
    print("=" * 60)
    run_ssh(ssh, "pg_isready -h localhost -p 5432 -U erp_admin -d shastika_erp", "pg_isready check")

    # ── Done ─────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("🎉  FULL DEPLOYMENT COMPLETE!")
    print(f"🌐  Site:    https://erp.shastikaglobalexport.co.in")
    print(f"🔧  API:     https://erp.shastikaglobalexport.co.in/api/")
    print(f"🗄️   DB:      PostgreSQL @ {VPS_IP} (shastika_erp)")
    print("=" * 60)

    sftp.close()
    ssh.close()


if __name__ == "__main__":
    main()
