"""
Seed du lieu mau cho sach, thanh vien, thong bao.
Chay: python manage.py seed_books_members
"""
from datetime import date
from django.core.management.base import BaseCommand
from api.models import Book, Member, Notification


class Command(BaseCommand):
    help = "Them du lieu mau cho books, members, notifications"

    def handle(self, *args, **options):
        if not Book.objects.exists():
            Book.objects.bulk_create([
                Book(title="Dac Nhan Tam", author="Dale Carnegie", genre="Ky nang song", publisher="NXB Tre", price="86000d", is_borrowed=False),
                Book(title="Nha Gia Kim", author="Paulo Coelho", genre="Van hoc", publisher="NXB Nha Nam", price="79000d", is_borrowed=True),
                Book(title="Sapiens: Luoc Su Loai Nguoi", author="Yuval Noah Harari", genre="Khoa hoc", publisher="NXB Tri Thuc", price="150000d", is_borrowed=False),
                Book(title="Tuoi Tre Dang Gia Bao Nhieu", author="Rosie Nguyen", genre="Ky nang song", publisher="NXB Nha Nam", price="80000d", is_borrowed=False),
                Book(title="De Men Phieu Luu Ky", author="To Hoai", genre="Thieu nhi", publisher="NXB Kim Dong", price="50000d", is_borrowed=False),
            ])
            self.stdout.write(self.style.SUCCESS("OK: books seeded."))
        if not Member.objects.exists():
            Member.objects.bulk_create([
                Member(name="Le Thi Mai", user_id="21004562", department="Ban Quản lý sách", role="Trưởng ban Quản Lý Sách", join_date=date(2021, 9, 12), status="active"),
                Member(name="Tran Van Hung", user_id="21003321", department="Ban Truyền thông - Đối Ngoại", role="Thành viên ban Truyền thông - Đối Ngoại", join_date=date(2022, 10, 5), status="active"),
                Member(name="Nguyen Thi Lan", user_id="22001198", department="Ban Nhân sự - Tài Chính", role="Thành viên ban Nhân sự - Tài Chính", join_date=date(2023, 1, 15), status="inactive"),
                Member(name="Pham Khoa", user_id="22008892", department="Ban Quản lý sách", role="Thành viên ban Quản lý sách", join_date=date(2023, 2, 20), status="active"),
            ])
            self.stdout.write(self.style.SUCCESS("OK: members seeded."))
        if not Notification.objects.exists():
            Notification.objects.create(
                title="Hop dinh ky thang 10",
                summary="Tong ket hoat dong thang 9 va ke hoach thang 10",
                audience="Ban chu nhiem",
                status="sent",
                type="internal",
            )
            Notification.objects.create(
                title="Tuyen thanh vien Gen 10",
                summary="Thong bao mo don dang ky tuyen thanh vien moi",
                audience="Tat ca",
                status="scheduled",
                type="public",
            )
            Notification.objects.create(
                title="Nhac nho tra sach qua han",
                summary="Gui email tu dong cho cac thanh vien muon sach qua han",
                audience="Thanh vien",
                status="draft",
                type="public",
            )
            self.stdout.write(self.style.SUCCESS("OK: notifications seeded."))
        self.stdout.write(self.style.SUCCESS("Seed done."))
