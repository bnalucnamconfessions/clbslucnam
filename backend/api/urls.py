"""
URL routing cho API.
"""
from django.urls import path
from . import views

urlpatterns = [
    path("", views.root),
    path("health", views.health),
    path("api/auth/login", views.login),
    path("api/auth/me", views.auth_me),
    path("api/auth/register", views.register),
    path("api/auth/forgot-password", views.forgot_password),
    path("api/auth/reset-password", views.reset_password),
    path("api/auth/google/debug", views.google_oauth_debug),
    path("api/auth/google/start", views.google_auth_start),
    path("api/auth/google/exchange", views.google_auth_exchange),
    path("api/auth/google/callback", views.google_auth_callback),
    path("api/accounts", views.account_list),
    path("api/accounts/profile", views.account_update_profile),
    path("api/accounts/upload-avatar", views.account_upload_avatar),
    path("api/accounts/<int:account_id>/permission", views.account_update_permission),
    path("api/accounts/<int:account_id>/delete", views.account_delete),
    path("api/dashboard/stats", views.dashboard_stats),
    path("api/dashboard/top-readers", views.top_readers),
    path("api/dashboard/overdue", views.overdue_books),
    path("api/books", views.book_list),
    path("api/books/create", views.book_create),
    path("api/books/bulk-create", views.book_bulk_create),
    path("api/books/<int:book_id>/delete", views.book_delete),
    path("api/books/<int:book_id>", views.book_update),
    path("api/members", views.member_list),
    path("api/members/create", views.member_create),
    path("api/members/<int:member_id>/delete", views.member_delete),
    path("api/members/<int:member_id>", views.member_update),
    path("api/notifications", views.notification_list),
    path("api/notifications/create", views.notification_create),
    path("api/notifications/<int:notif_id>/delete", views.notification_delete),
    path("api/notifications/<int:notif_id>/read", views.notification_mark_read),
    path("api/notifications/<int:notif_id>", views.notification_update),
    path("api/activity-log", views.activity_log_list),
    path("api/activity-log/create", views.activity_log_create),
    path("api/borrow", views.borrow_list),
    path("api/borrow/create", views.borrow_create),
    path("api/return", views.return_book),
    path("api/fund/stats", views.fund_stats),
    path("api/fund/transactions", views.fund_transaction_list),  # GET list
    path("api/fund/transactions/create", views.fund_transaction_create),  # POST create
    path("api/fund/transactions/<int:transaction_id>", views.fund_transaction_detail),
    path("api/fund/transactions/<int:transaction_id>/update", views.fund_transaction_update),
]
