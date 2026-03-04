"""
Models cho dashboard và API CLB Thư viện.
"""
from django.db import models


class DashboardStats(models.Model):
    """Thống kê tổng quan dashboard."""

    borrow_today = models.IntegerField(default=0)
    borrow_month = models.IntegerField(default=0)
    overdue_count = models.IntegerField(default=0)
    active_members = models.IntegerField(default=0)
    borrow_today_change = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    borrow_month_change = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    active_members_change = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dashboard_stats"
        ordering = ["-id"]


class TopReader(models.Model):
    """Độc giả tích cực (top mượn sách)."""

    name = models.CharField(max_length=255)
    book_count = models.IntegerField(default=0)
    rank = models.IntegerField(default=0)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = "top_readers"
        ordering = ["rank"]


class RankingGiftConfig(models.Model):
    """Cấu hình quà tặng tháng (bảng xếp hạng). Một bản ghi = cấu hình hiện tại."""

    intro = models.TextField(blank=True)
    items = models.JSONField(default=list)  # [{"title":"...","subtitle":"...","imageUrl":"..."}, ...]
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ranking_gift_config"
        ordering = ["-id"]


class OverdueBook(models.Model):
    """Sách quá hạn chưa trả."""

    book_title = models.CharField(max_length=255)
    member_name = models.CharField(max_length=255)
    due_date = models.DateField()
    days_overdue = models.IntegerField(default=0)

    class Meta:
        db_table = "overdue_books"


class Book(models.Model):
    """Sách trong kho. code: mã 12 chữ số dùng cho QR và hiển thị (nếu có)."""

    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    genre = models.CharField(max_length=100, blank=True)
    publisher = models.CharField(max_length=255, blank=True)
    price = models.CharField(max_length=50, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    is_borrowed = models.BooleanField(default=False)
    code = models.CharField(max_length=12, unique=True, null=True, blank=True)

    class Meta:
        db_table = "books"
        ordering = ["title"]


class Member(models.Model):
    """Thành viên CLB."""

    name = models.CharField(max_length=255)
    user_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=100, blank=True)
    join_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default="active")  # active, inactive
    avatar_url = models.URLField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = "members"
        ordering = ["name"]


class Notification(models.Model):
    """Thông báo."""

    URGENCY_CHOICES = [
        ("urgent", "Khẩn"),
        ("important", "Quan trọng"),
        ("normal", "Thường"),
    ]

    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    audience = models.CharField(max_length=255, blank=True)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="draft")  # sent, scheduled, draft
    type = models.CharField(max_length=20, default="internal")  # internal, public
    urgency = models.CharField(max_length=20, default="normal", blank=True)  # urgent, important, normal
    sender_label = models.CharField(max_length=255, blank=True)  # Người gửi: Quản trị viên, Chủ nhiệm, ...

    class Meta:
        db_table = "notifications"
        ordering = ["-id"]


class Account(models.Model):
    """Tài khoản đăng nhập / đăng ký (email hoặc Google)."""

    ROLE_CHOICES = [
        ("admin", "Quản trị viên"),
        ("chairperson", "Chủ nhiệm"),
        ("vice_chairperson", "Phó chủ nhiệm"),
        ("head_book", "Trưởng ban Quản Lý Sách"),
        ("vice_head_book", "Phó ban Quản Lý Sách"),
        ("head_communication", "Trưởng ban Truyền thông - Đối Ngoại"),
        ("vice_head_communication", "Phó ban Truyền thông - Đối Ngoại"),
        ("head_hr_finance", "Trưởng ban Nhân sự - Tài Chính"),
        ("vice_head_hr_finance", "Phó ban Nhân sự - Tài Chính"),
        ("member_book", "Thành viên ban Quản lý sách"),
        ("member_communication", "Thành viên ban Truyền thông - Đối Ngoại"),
        ("member_hr_finance", "Thành viên ban Nhân sự - Tài Chính"),
        ("user", "Người dùng"),
    ]

    email = models.CharField(max_length=255, blank=True, db_index=True)
    password_hash = models.CharField(max_length=128, blank=True, null=True)  # bcrypt/pbkdf2 cho đăng nhập email
    display_email = models.CharField(max_length=255, blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    provider = models.CharField(max_length=50, default="email")  # email, google
    club_permission = models.CharField(
        max_length=35, choices=ROLE_CHOICES, default="user"
    )
    student_id_image_url = models.URLField(max_length=500, blank=True, null=True)
    last_login_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "accounts"
        ordering = ["-last_login_at"]
        unique_together = [["email", "provider"]]


class NotificationRead(models.Model):
    """Đánh dấu đã đọc thông báo (notification_id + account_id)."""

    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name="read_receipts")
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="notification_reads")
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification_reads"
        ordering = ["-read_at"]
        constraints = [
            models.UniqueConstraint(fields=["notification", "account"], name="unique_notif_read"),
        ]


class ActivityLog(models.Model):
    """Log thao tác của tài khoản (lưu 30 ngày)."""

    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="activity_logs")
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]


class PasswordResetToken(models.Model):
    """Token để đặt lại mật khẩu (quên mật khẩu)."""
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "password_reset_tokens"
        ordering = ["-created_at"]


class EmailVerificationCode(models.Model):
    """Mã xác thực 6 chữ số gửi qua email khi đăng ký."""
    email = models.CharField(max_length=255, db_index=True)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "email_verification_codes"
        ordering = ["-created_at"]


class BorrowRecord(models.Model):
    """Phiếu mượn sách."""

    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Thành viên có tài khoản; null nếu người mượn là khách (không tài khoản).",
    )
    guest_name = models.CharField(max_length=255, blank=True, help_text="Tên người mượn khi không có tài khoản.")
    guest_class = models.CharField(max_length=255, blank=True, help_text="Lớp (ghi chú) khi mượn không tài khoản.")
    borrow_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    return_notes = models.TextField(blank=True, help_text="Ghi chú tình trạng sách khi trả (hư hỏng, v.v.)")
    recorded_by = models.ForeignKey(
        "Account",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="borrow_records_recorded",
        help_text="Tài khoản ghi nhận phiếu mượn (người ghi mượn sách).",
    )

    class Meta:
        db_table = "borrow_records"
        ordering = ["-borrow_date"]


class FundTransaction(models.Model):
    """Giao dịch thu chi quỹ (Ban NS-TC)."""

    TYPE_INCOME = "income"
    TYPE_EXPENSE = "expense"
    TYPE_CHOICES = [
        (TYPE_INCOME, "Thu"),
        (TYPE_EXPENSE, "Chi"),
    ]
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Chờ CN duyệt"),
        (STATUS_CONFIRMED, "Đã xác nhận"),
    ]

    transaction_date = models.DateField()
    content = models.CharField(max_length=500)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=0)  # VND, luôn dương
    requester_name = models.CharField(max_length=255)  # Tên người/đơn vị yêu cầu
    requester_account = models.ForeignKey(
        Account, on_delete=models.SET_NULL, null=True, blank=True, related_name="fund_requests"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fund_transactions"
        ordering = ["-transaction_date", "-id"]


class DoiTacData(models.Model):
    """Nội dung trang Nhà tài trợ & Đối tác (một bản ghi, lưu JSON)."""
    key = models.CharField(max_length=50, default="data", unique=True)
    data = models.JSONField(default=dict, blank=True)  # sponsorsGold, partnersStrategic, partnersCommunity
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "doi_tac_data"
        ordering = ["key"]


class WebsiteConfig(models.Model):
    """Cấu hình website (một bản ghi, chỉ Ban chủ nhiệm chỉnh sửa)."""
    key = models.CharField(max_length=50, default="main", unique=True)
    data = models.JSONField(default=dict, blank=True)  # siteName, logoUrl, contactEmail, footerText, ...
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "website_config"
        ordering = ["key"]


class DonationCampaign(models.Model):
    """Chiến dịch quyên góp (mục tiêu, thời hạn, nội dung)."""

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    goal = models.DecimalField(max_digits=14, decimal_places=0, default=0)  # VND
    banner_url = models.URLField(max_length=500, blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "donation_campaigns"
        ordering = ["-created_at"]


class Donation(models.Model):
    """Khoản quyên góp (người ủng hộ, số tiền, ẩn danh)."""

    campaign = models.ForeignKey(
        DonationCampaign, on_delete=models.CASCADE, related_name="donations", null=True, blank=True
    )
    donor_name = models.CharField(max_length=255)  # "Ẩn danh" nếu is_anonymous
    amount = models.DecimalField(max_digits=14, decimal_places=0)  # VND
    message = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=False)
    account = models.ForeignKey(
        Account, on_delete=models.SET_NULL, null=True, blank=True, related_name="donations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "donations"
        ordering = ["-created_at"]
