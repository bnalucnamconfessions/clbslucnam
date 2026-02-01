"""
Lệnh debug cho dbshell: ghi log PATH, executable, args trước khi chạy mysql.
Chạy: python manage.py dbshell_debug
"""
import json
import os
import shutil
import subprocess
import time
from django.core.management.base import BaseCommand
from django.db import connection

LOG_PATH = r"d:\code\clbslucnam\.cursor\debug.log"


def write_log(hypothesis_id: str, message: str, data: dict):
    # #region agent log
    payload = {
        "hypothesisId": hypothesis_id,
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
        "sessionId": "debug-session",
        "location": "dbshell_debug.py",
    }
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception:
        pass
    # #endregion


class Command(BaseCommand):
    help = "Debug dbshell: log PATH, mysql executable, args; then run mysql or show error."

    def handle(self, *args, **options):
        # HYP A,B: PATH và tìm mysql / mysql.exe
        path_env = os.environ.get("PATH", "")
        which_mysql = shutil.which("mysql")
        which_mysql_exe = shutil.which("mysql.exe")
        write_log(
            "A",
            "PATH and which(mysql)",
            {
                "PATH_len": len(path_env),
                "PATH_preview": path_env[:500] if path_env else "",
                "which_mysql": which_mysql,
                "which_mysql_exe": which_mysql_exe,
            },
        )

        # Lấy args/env giống Django MySQL client
        from django.db.backends.mysql.client import DatabaseClient

        client = DatabaseClient(connection)
        settings_dict = connection.settings_dict
        args, env = client.settings_to_cmd_args_env(settings_dict, [])

        # HYP C,D: args (không log password), executable
        args_safe = [a for a in args if not a.startswith("--password") and "PWD" not in a]
        write_log(
            "C",
            "subprocess args and env keys",
            {
                "executable_name": getattr(DatabaseClient, "executable_name", None),
                "args": args_safe,
                "env_keys": list(env.keys()) if env else [],
                "env_has_PATH": "PATH" in (env or {}) or True,
            },
        )

        # Merge env như Django: env = {**os.environ, **env}
        run_env = {**os.environ, **env} if env else None
        write_log(
            "E",
            "merged env PATH len",
            {"merged_PATH_len": len(run_env.get("PATH", "")) if run_env else 0},
        )

        # Chạy subprocess và bắt lỗi (HYP: subprocess fail)
        try:
            subprocess.run(args, env=run_env, check=True)
            write_log("RUN", "subprocess.run succeeded", {})
        except FileNotFoundError as e:
            write_log("A", "FileNotFoundError", {"err": str(e), "args0": args[0] if args else None})
            from django.core.management.base import CommandError
            raise CommandError(
                "You appear not to have the 'mysql' program installed or on your path."
            ) from e
        except subprocess.CalledProcessError as e:
            write_log("RUN", "CalledProcessError", {"returncode": e.returncode, "err": str(e)})
            from django.core.management.base import CommandError
            raise CommandError(str(e)) from e
