"""
Lệnh seed dữ liệu mẫu cho dashboard.
Chạy: python manage.py seed_dashboard
"""
from datetime import date
from django.core.management.base import BaseCommand
from api.models import DashboardStats, TopReader, OverdueBook


class Command(BaseCommand):
    help = "Thêm dữ liệu mẫu cho dashboard nếu bảng trống"

    def handle(self, *args, **options):
        if not DashboardStats.objects.exists():
            DashboardStats.objects.create(
                borrow_today=12,
                borrow_month=345,
                overdue_count=8,
                active_members=120,
                borrow_today_change=20,
                borrow_month_change=5,
                active_members_change=12,
            )
            self.stdout.write(self.style.SUCCESS("OK: dashboard_stats seeded."))
        if not TopReader.objects.exists():
            for name, book_count, rank in [
                ("Độc giả 1", 15, 1),
                ("Trần Thị B", 12, 2),
                ("Lê Văn C", 10, 3),
                ("Phạm D", 8, 4),
            ]:
                TopReader.objects.create(name=name, book_count=book_count, rank=rank)
            self.stdout.write(self.style.SUCCESS("OK: top_readers seeded."))
        if not OverdueBook.objects.exists():
            OverdueBook.objects.bulk_create([
                OverdueBook(book_title="Clean Code", member_name="Lê Văn C", due_date=date(2023, 10, 10), days_overdue=5),
                OverdueBook(book_title="Design Patterns", member_name="Phạm Thị E", due_date=date(2023, 10, 12), days_overdue=3),
                OverdueBook(book_title="Pragmatic Programmer", member_name="Hoàng Văn F", due_date=date(2023, 10, 14), days_overdue=1),
            ])
            self.stdout.write(self.style.SUCCESS("OK: overdue_books seeded."))
        self.stdout.write(self.style.SUCCESS("Seed done."))
