"""
Lệnh kiểm tra gửi email: python manage.py test_email your@email.com
"""
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = "Gửi email thử để kiểm tra cấu hình SMTP"

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Email nhận thư thử")

    def handle(self, *args, **options):
        email = options["email"]
        subject = "Test Email - BnA Lục Nam"
        body = "Email này được gửi từ hệ thống để kiểm tra cấu hình SMTP. Nếu bạn nhận được thư này thì cấu hình đã đúng."
        try:
            sent = send_mail(
                subject,
                body,
                getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@local"),
                [email],
                fail_silently=False,
            )
            if sent:
                self.stdout.write(self.style.SUCCESS(f"Da gui email thu den {email}. Kiem tra hop thu (va thu rac)."))
            else:
                self.stdout.write(self.style.WARNING("Gui that bai (SMTP tra 0). Kiem tra EMAIL_HOST_PASSWORD trong .env"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Loi: {repr(e)}"))
            self.stdout.write("Xem huong dan tai backend/HUONG-DAN-EMAIL.md")
