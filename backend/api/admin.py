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
)


@admin.register(FundTransaction)
class FundTransactionAdmin(admin.ModelAdmin):
    list_display = ("transaction_date", "content", "type", "amount", "requester_name", "status")
    list_filter = ("type", "status")
    search_fields = ("content", "requester_name")
    date_hierarchy = "transaction_date"


admin.site.register(DashboardStats)
admin.site.register(TopReader)
admin.site.register(OverdueBook)
admin.site.register(Book)
admin.site.register(Member)
admin.site.register(Notification)
admin.site.register(BorrowRecord)
