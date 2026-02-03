from django.contrib import admin
from .models import (
    DashboardStats,
    TopReader,
    OverdueBook,
    Book,
    Member,
    Notification,
    BorrowRecord,
    FundTransaction,
    DonationCampaign,
    Donation,
    EmailVerificationCode,
)


@admin.register(FundTransaction)
class FundTransactionAdmin(admin.ModelAdmin):
    list_display = ("transaction_date", "content", "type", "amount", "requester_name", "status")
    list_filter = ("type", "status")
    search_fields = ("content", "requester_name")
    date_hierarchy = "transaction_date"


admin.site.register(DashboardStats)
admin.site.register(TopReader)
admin.site.register(EmailVerificationCode)
admin.site.register(OverdueBook)
admin.site.register(Book)
admin.site.register(Member)
admin.site.register(Notification)
admin.site.register(BorrowRecord)


@admin.register(DonationCampaign)
class DonationCampaignAdmin(admin.ModelAdmin):
    list_display = ("title", "goal", "start_date", "end_date", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("title", "description")
    date_hierarchy = "created_at"


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ("donor_name", "amount", "campaign", "is_anonymous", "created_at")
    list_filter = ("is_anonymous", "campaign")
    search_fields = ("donor_name", "message")
    date_hierarchy = "created_at"
