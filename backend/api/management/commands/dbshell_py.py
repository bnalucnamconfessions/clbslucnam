"""
Shell SQL tương tác qua PyMySQL (không cần cài mysql CLI).
Dùng khi: python manage.py dbshell báo lỗi 'mysql' program not found.
Chạy: python manage.py dbshell_py
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Interactive SQL shell via PyMySQL (no mysql CLI required)."

    def handle(self, *args, **options):
        db_name = connection.settings_dict.get("NAME", "?")
        self.stdout.write(
            self.style.NOTICE(
                f"PyMySQL shell — database: {db_name}. Gõ SQL rồi Enter. 'exit' hoặc 'quit' để thoát."
            )
        )
        buffer: list[str] = []
        try:
            with connection.cursor() as cursor:
                while True:
                    try:
                        line = input("mysql> " if not buffer else "    -> ")
                    except EOFError:
                        break
                    line_stripped = line.strip()
                    if not line_stripped:
                        continue
                    if line_stripped.lower() in ("exit", "quit", "\\q"):
                        break
                    buffer.append(line)
                    stmt = " ".join(buffer).strip()
                    if not stmt.endswith(";"):
                        continue
                    buffer = []
                    try:
                        cursor.execute(stmt)
                        if cursor.description:
                            rows = cursor.fetchall()
                            if rows:
                                col_count = len(cursor.description)
                                for row in rows:
                                    self.stdout.write("\t".join(str(x) for x in row))
                                self.stdout.write(self.style.SUCCESS(f"({len(rows)} row(s))"))
                            else:
                                self.stdout.write("Empty set")
                        else:
                            self.stdout.write(self.style.SUCCESS(f"OK ({cursor.rowcount} row(s) affected)"))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(str(e)))
        except Exception as e:
            raise
        self.stdout.write("Bye.")
