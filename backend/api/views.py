"""
API views cho dashboard và auth.
"""
import os
import uuid
from datetime import date, timedelta
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.db.models import Q

from .models import (
    Account,
    PasswordResetToken,
    EmailVerificationCode,
    DashboardStats,
    TopReader,
    RankingGiftConfig,
    OverdueBook,
    Book,
    Member,
    Notification,
    NotificationRead,
    ActivityLog,
    BorrowRecord,
    FundTransaction,
    DoiTacData,
    DonationCampaign,
    Donation,
)

# Map club_permission -> display label (dùng chung cho login, auth_me, google_auth_exchange)
_ROLE_DISPLAY = {
    "admin": "Quản trị viên",
    "chairperson": "Chủ nhiệm",
    "vice_chairperson": "Phó chủ nhiệm",
    "head_book": "Trưởng ban Quản Lý Sách",
    "vice_head_book": "Phó ban Quản Lý Sách",
    "head_communication": "Trưởng ban Truyền thông - Đối Ngoại",
    "vice_head_communication": "Phó ban Truyền thông - Đối Ngoại",
    "head_hr_finance": "Trưởng ban Nhân sự - Tài Chính",
    "vice_head_hr_finance": "Phó ban Nhân sự - Tài Chính",
    "member_book": "Thành viên ban Quản lý sách",
    "member_communication": "Thành viên ban Truyền thông - Đối Ngoại",
    "member_hr_finance": "Thành viên ban Nhân sự - Tài Chính",
    "user": "Người dùng",
}


@api_view(["GET"])
def root(request):
    return Response({"message": "CLB Thư viện API", "docs": "/admin/"})

@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@csrf_exempt
@api_view(["POST"])
def login(request):
    """Đăng nhập - email + password từ Account. CSRF exempt để frontend gọi được. Dùng constant-time so sánh mật khẩu để tránh timing leak."""
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password", "")

    acc = Account.objects.filter(email__iexact=username, provider="email").first()
    # Luôn chạy check_password (kể cả khi không tìm thấy tài khoản) để tránh timing attack (phân biệt "email tồn tại" vs "email không tồn tại").
    if not acc or not acc.password_hash:
        check_password(password, make_password(""))
        return Response(
            {"detail": "Tên đăng nhập hoặc mật khẩu không đúng."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if not check_password(password, acc.password_hash):
        return Response(
            {"detail": "Tên đăng nhập hoặc mật khẩu không đúng."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    acc.last_login_at = timezone.now()
    acc.save(update_fields=["last_login_at"])
    role_display = _ROLE_DISPLAY.get(acc.club_permission or "user", "Người dùng")
    return Response({
        "token": f"email-{acc.id}",
        "fullName": acc.full_name or acc.email or "User",
        "email": acc.email or "",
        "role": role_display,
        "clubPermission": acc.club_permission or "user",
    })


@api_view(["GET"])
def auth_me(request):
    """Trả về quyền hiện tại của user. Ưu tiên Authorization: Bearer <token> (token dạng email-<id>), nếu không có thì dùng query email (kém bảo mật hơn)."""
    # #region agent log
    import json
    _ah = request.META.get("HTTP_AUTHORIZATION") or ""
    _token_pre = (_ah[7:].strip()[:12] + "..") if _ah.startswith("Bearer ") and len(_ah) > 7 else "none"
    _g = dict(request.GET)
    try:
        with open(r"d:\code\clbslucnam\.cursor\debug.log", "a", encoding="utf-8") as _f:
            _f.write(json.dumps({"location": "auth_me:entry", "message": "auth_me request", "data": {"auth_prefix": _token_pre, "GET_keys": list(_g.keys()), "email_val": (request.GET.get("email") or request.GET.get("accountEmail") or "").strip()[:50], "has_email_param": bool((request.GET.get("email") or request.GET.get("accountEmail") or "").strip())}, "hypothesisId": "H1,H5", "timestamp": __import__("time").time() * 1000}) + "\n")
    except Exception:
        pass
    # #endregion
    acc = None
    auth_header = request.META.get("HTTP_AUTHORIZATION") or ""
    if auth_header.startswith("Bearer "):
        token = (auth_header[7:] or "").strip()
        if token.startswith("email-") and token[6:].isdigit():
            try:
                acc = Account.objects.get(pk=int(token[6:]))
            except (ValueError, Account.DoesNotExist):
                pass
    if acc is None:
        email = (request.GET.get("email") or request.GET.get("accountEmail") or "").strip()
        if not email:
            # #region agent log
            try:
                with open(r"d:\code\clbslucnam\.cursor\debug.log", "a", encoding="utf-8") as _f:
                    _f.write(json.dumps({"location": "auth_me:400", "message": "Returning 400 - no email no acc", "data": {"reason": "acc_is_none_and_email_empty"}, "hypothesisId": "H1", "timestamp": __import__("time").time() * 1000}) + "\n")
            except Exception:
                pass
            # #endregion
            return Response({"detail": "Thiếu email hoặc token (Authorization: Bearer email-<id>)."}, status=status.HTTP_400_BAD_REQUEST)
        acc = Account.objects.filter(Q(email=email) | Q(display_email=email)).first()
        if not acc:
            return Response({"detail": "Không tìm thấy tài khoản"}, status=status.HTTP_404_NOT_FOUND)
    perm = acc.club_permission or "user"
    role_display = _ROLE_DISPLAY.get(perm, "Người dùng")
    join_date_str = None
    member = Member.objects.filter(user_id__in=[_account_user_id(acc), f"acc-{acc.id}"]).first()
    if member and member.join_date:
        join_date_str = member.join_date.strftime("%d/%m/%Y")
    return Response({
        "clubPermission": perm,
        "fullName": acc.full_name or acc.email or "User",
        "role": role_display,
        "email": (getattr(acc, "display_email", "") or "").strip() or acc.email or "",
        "joinDate": join_date_str,
    })


@csrf_exempt
@api_view(["POST"])
def register(request):
    """Bước 1 đăng ký: gửi mã xác thực 6 chữ số qua email. Chưa tạo tài khoản."""
    import secrets
    from datetime import timedelta
    from django.core.mail import send_mail

    data = request.data
    email = (data.get("email") or "").strip().lower()[:255]
    password = data.get("password", "")

    if not email:
        return Response({"detail": "Vui lòng nhập email."}, status=status.HTTP_400_BAD_REQUEST)
    if len(email) > 254:
        return Response({"detail": "Email không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
    if not password or len(password) < 8:
        return Response({"detail": "Mật khẩu phải có ít nhất 8 ký tự."}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) > 128:
        return Response({"detail": "Mật khẩu không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
    if Account.objects.filter(email=email, provider="email").exists():
        return Response({"detail": "Email đã được đăng ký."}, status=status.HTTP_400_BAD_REQUEST)
    if Account.objects.filter(email=email, provider="google").exists():
        return Response(
            {"detail": "Email này đã được đăng ký qua Google. Vui lòng đăng nhập bằng Google.", "code": "already_google"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Xóa mã cũ cùng email (nếu có)
    EmailVerificationCode.objects.filter(email=email).delete()
    code = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = timezone.now() + timedelta(minutes=15)
    EmailVerificationCode.objects.create(email=email, code=code, expires_at=expires_at)

    subject = "Mã xác thực đăng ký - BnA Lục Nam"
    body = f"""Xin chào,

Bạn đang đăng ký tài khoản CLB Sách và Hành động.

Mã xác thực của bạn là: {code}

Mã có hiệu lực trong 15 phút. Không chia sẻ mã này với bất kỳ ai.

— CLB Sách và Hành động THPT Lục Nam
"""
    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f0f4f8;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f4f8;padding:24px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(19,127,236,0.15);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#137fec 0%,#0d5bb5 100%);padding:28px 24px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">Mã xác thực đăng ký</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">BnA Lục Nam</p>
</td></tr>
<tr><td style="padding:32px 24px;text-align:center;">
<p style="margin:0 0 16px;color:#1e293b;font-size:16px;line-height:1.6;">Mã xác thực của bạn là:</p>
<p style="margin:0 0 24px;font-size:32px;font-weight:800;letter-spacing:8px;color:#137fec;">{code}</p>
<p style="margin:0 0 8px;color:#64748b;font-size:14px;">Mã có hiệu lực trong <strong>15 phút</strong>.</p>
<p style="margin:0;color:#94a3b8;font-size:13px;">Không chia sẻ mã này với bất kỳ ai.</p>
</td></tr>
<tr><td style="padding:16px 24px;background:#f8fafc;text-align:center;color:#64748b;font-size:12px;">
— CLB Sách và Hành động THPT Lục Nam
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
"""
    email_sent = True
    try:
        sent = send_mail(
            subject,
            body,
            getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@clbslucnam.local"),
            [email],
            fail_silently=False,
            html_message=html_body,
        )
        if sent == 0:
            email_sent = False
    except Exception as e:
        email_sent = False
        if settings.DEBUG:
            _safe_print(f"[DEBUG] Gửi email xác thực thất bại: {e}. Mã: {code}")
    if not email_sent and settings.DEBUG:
        _safe_print(f"\n[DEBUG] Mã xác thực đăng ký (không gửi được email): {code}\n")

    return Response({
        "sent": True,
        "message": "Mã xác thực 6 chữ số đã gửi đến email của bạn. Vui lòng nhập mã để hoàn tất đăng ký.",
    })


@csrf_exempt
@api_view(["POST"])
def register_verify(request):
    """Bước 2 đăng ký: xác thực mã 6 chữ số và tạo tài khoản."""
    data = request.data
    email = (data.get("email") or "").strip().lower()[:255]
    code = (data.get("code") or "").strip()
    password = data.get("password", "")
    full_name = (data.get("fullName") or data.get("full_name") or "").strip()[:255]

    if not email:
        return Response({"detail": "Vui lòng nhập email."}, status=status.HTTP_400_BAD_REQUEST)
    if not code or len(code) != 6 or not code.isdigit():
        return Response({"detail": "Mã xác thực phải là 6 chữ số."}, status=status.HTTP_400_BAD_REQUEST)
    if not password or len(password) < 8:
        return Response({"detail": "Mật khẩu phải có ít nhất 8 ký tự."}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) > 128:
        return Response({"detail": "Mật khẩu không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
    if Account.objects.filter(email=email, provider="email").exists():
        return Response({"detail": "Email đã được đăng ký."}, status=status.HTTP_400_BAD_REQUEST)
    if Account.objects.filter(email=email, provider="google").exists():
        return Response(
            {"detail": "Email này đã được đăng ký qua Google. Vui lòng đăng nhập bằng Google.", "code": "already_google"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rec = EmailVerificationCode.objects.filter(
        email=email, code=code, expires_at__gt=timezone.now()
    ).first()
    if not rec:
        return Response(
            {"detail": "Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử gửi lại mã."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not full_name:
        full_name = email.split("@")[0].replace(".", " ").title()

    acc = Account.objects.create(
        email=email,
        full_name=full_name,
        provider="email",
        club_permission="user",
        password_hash=make_password(password),
    )
    rec.delete()

    return Response({
        "id": acc.id,
        "email": acc.email,
        "fullName": acc.full_name,
    }, status=status.HTTP_201_CREATED)


def _safe_print(msg):
    """In ra console an toàn trên Windows (tránh UnicodeEncodeError với charmap)."""
    try:
        print(msg)
    except UnicodeEncodeError:
        try:
            import sys
            sys.stdout.buffer.write((msg + "\n").encode("utf-8", errors="replace"))
        except Exception:
            print(repr(msg)[:200])


@csrf_exempt
@api_view(["POST"])
def forgot_password(request):
    """Yêu cầu đặt lại mật khẩu - gửi email chứa link (hoặc in ra console nếu chưa cấu hình email)."""
    try:
        import secrets
        from datetime import timedelta
        from django.core.mail import send_mail
        from django.conf import settings

        try:
            data = getattr(request, "data", None) or {}
        except Exception:
            data = {}
        data = data if isinstance(data, dict) else {}
        email = (data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Vui lòng nhập email."}, status=status.HTTP_400_BAD_REQUEST)

        acc = Account.objects.filter(email=email, provider="email").first()
        if not acc or not getattr(acc, "password_hash", None):
            return Response({"message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận hướng dẫn đặt lại mật khẩu."})

        PasswordResetToken.objects.filter(account=acc).delete()
        token = secrets.token_urlsafe(32)[:64]
        expires_at = timezone.now() + timedelta(minutes=5)
        PasswordResetToken.objects.create(account=acc, token=token, expires_at=expires_at)

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
        reset_url = f"{frontend_url}/dat-lai-mat-khau?token={token}"
        subject = "Đặt lại mật khẩu - BnA Lục Nam"
        _name = (acc.full_name or "bạn").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
        _addr = (acc.email or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
        body = f"""Xin chào {acc.full_name or 'bạn'},

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản {acc.email}.

Nhấn vào link sau để đặt mật khẩu mới (có hiệu lực trong 5 phút):
{reset_url}

Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.

— BnA Lục Nam
"""
        html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f0f4f8;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f4f8;padding:24px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(19,127,236,0.15);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#137fec 0%,#0d5bb5 100%);padding:28px 24px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">CLB Sách và Hành động</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">BnA Lục Nam</p>
</td></tr>
<tr><td style="padding:32px 24px;">
<p style="margin:0 0 16px;color:#1e293b;font-size:16px;line-height:1.6;">Xin chào <strong>{_name}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <span style="color:#137fec;font-weight:500;">{_addr}</span>.</p>
<p style="margin:0 0 24px;color:#64748b;font-size:14px;">Nhấn nút bên dưới để đặt mật khẩu mới. Link có hiệu lực trong <strong style="color:#dc2626;">5 phút</strong>.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<a href="{reset_url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#137fec 0%,#0d5bb5 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:8px;box-shadow:0 4px 12px rgba(19,127,236,0.4);">Đặt lại mật khẩu</a>
</td></tr></table>
<p style="margin:24px 0 0;color:#94a3b8;font-size:13px;">Nếu nút không hoạt động, copy link: <a href="{reset_url}" style="color:#137fec;">{reset_url}</a></p>
<hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;">
<p style="margin:0;color:#94a3b8;font-size:12px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
</td></tr>
<tr><td style="padding:16px 24px;background:#f8fafc;text-align:center;color:#64748b;font-size:12px;">
— CLB Sách và Hành động THPT Lục Nam
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
"""

        email_sent = True
        smtp_error = None
        try:
            sent = send_mail(
                subject,
                body,
                getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@clbslucnam.local"),
                [email],
                fail_silently=False,
                html_message=html_body,
            )
            if sent == 0:
                email_sent = False
                smtp_error = "SMTP tra 0 (khong gui duoc)"
        except Exception as e:
            email_sent = False
            smtp_error = f"{type(e).__name__}: {e}"
        if not email_sent:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("Forgot-password email failed. Error: %s. Reset link: %s", smtp_error, reset_url)
            if settings.DEBUG:
                _safe_print(f"\n[DEBUG] Email KHONG gui duoc. Loi: {smtp_error}. Link: {reset_url}\n")

        payload = {"message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận hướng dẫn đặt lại mật khẩu."}
        if settings.DEBUG and not email_sent:
            payload["debugResetUrl"] = reset_url
            payload["debugNote"] = f"SMTP loi: {smtp_error or 'unknown'}. Dung link tren de dat lai mat khau (chi hien khi DEBUG)."
        return Response(payload)
    except Exception as e:
        try:
            import traceback
            traceback.print_exc()
        except UnicodeEncodeError:
            _safe_print(f"Traceback (Unicode suppressed): {type(e).__name__}: {e}")
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(["POST"])
def reset_password(request):
    """Đặt lại mật khẩu mới với token từ email."""
    data = request.data
    token = (data.get("token") or "").strip()
    new_password = data.get("newPassword") or data.get("password", "")

    if not token:
        return Response({"detail": "Thiếu token. Vui lòng dùng link trong email."}, status=status.HTTP_400_BAD_REQUEST)
    if not new_password or len(new_password) < 8:
        return Response({"detail": "Mật khẩu mới phải có ít nhất 8 ký tự."}, status=status.HTTP_400_BAD_REQUEST)

    prt = PasswordResetToken.objects.filter(token=token, expires_at__gt=timezone.now()).select_related("account").first()
    if not prt:
        return Response({"detail": "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới."}, status=status.HTTP_400_BAD_REQUEST)

    acc = prt.account
    acc.password_hash = make_password(new_password)
    acc.save(update_fields=["password_hash"])
    prt.delete()
    return Response({"message": "Đã đặt lại mật khẩu thành công. Bạn có thể đăng nhập."})


from django.shortcuts import redirect
from urllib.parse import urlencode, quote as urlquote

@api_view(["GET"])
def google_oauth_debug(request):
    """Trang debug: hiển thị redirect_uri & client_id cần thêm vào Google Console."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    redirect_uri = f"{frontend_url}/api/auth/google/callback"
    client_id = os.getenv("GOOGLE_CLIENT_ID", "<chưa cấu hình>")
    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google OAuth Debug</title></head><body style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px">
<h2>Kiểm tra cấu hình Google Console</h2>
<p><strong>Client ID</strong> (phải khớp với OAuth client bạn đang sửa):</p>
<pre style="background:#f0f0f0;padding:12px;overflow-x:auto">{client_id}</pre>
<p><strong>Authorized redirect URI</strong> – copy chính xác vào Google Console:</p>
<pre style="background:#f0f0f0;padding:12px;overflow-x:auto" id="uri">{redirect_uri}</pre>
<button onclick="navigator.clipboard.writeText(document.getElementById('uri').innerText)">Copy</button>
<p style="color:#666;font-size:14px">Vào <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Credentials</a> → chọn OAuth client (loại <strong>Web application</strong>) → Authorized redirect URIs → thêm URI trên. Thêm cả <code>http://127.0.0.1:3000/api/auth/google/callback</code> nếu dùng 127.0.0.1.</p>
<p><a href="/api/auth/google/start">Thử đăng nhập Google</a></p>
</body></html>"""
    from django.http import HttpResponse
    return HttpResponse(html, content_type="text/html; charset=utf-8")


@api_view(["GET"])
def google_auth_start(request):
    """Bắt đầu OAuth - redirect đến Google. Callback ở frontend (Next.js)."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    redirect_uri = f"{frontend_url}/api/auth/google/callback"
    if not client_id:
        return Response({"detail": "Chưa cấu hình GOOGLE_CLIENT_ID"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return redirect(url)


@csrf_exempt
@api_view(["POST"])
def google_auth_exchange(request):
    """Đổi code từ Google lấy token app (gọi từ Next.js callback)."""
    import requests as httpreq
    try:
        data = getattr(request, "data", None) or {}
    except Exception:
        return Response({"detail": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)
    code = (data.get("code") or "").strip()
    redirect_uri = (data.get("redirect_uri") or "").strip()
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    if not code or not redirect_uri:
        return Response({"detail": "Thiếu code hoặc redirect_uri"}, status=status.HTTP_400_BAD_REQUEST)
    if not client_id or not client_secret:
        return Response({"detail": "Chưa cấu hình OAuth"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    try:
        token_res = httpreq.post(
            "https://oauth2.googleapis.com/token",
            data={"code": code, "client_id": client_id, "client_secret": client_secret, "redirect_uri": redirect_uri, "grant_type": "authorization_code"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        token_res.raise_for_status()
        tokens = token_res.json()
        id_token_jwt = tokens.get("id_token", "")
        if not id_token_jwt:
            return Response({"detail": "Không nhận được id_token"}, status=status.HTTP_400_BAD_REQUEST)
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(
            id_token_jwt, google_requests.Request(), client_id, clock_skew_in_seconds=60
        )
        name = idinfo.get("name") or (idinfo.get("email") or "user").split("@")[0]
        email = idinfo.get("email", "")
        picture = idinfo.get("picture", "")
        app_token = "google-" + (idinfo.get("sub", "") or "demo")
        # Lưu/ cập nhật tài khoản đăng nhập
        lookup_email = email or f"google-{idinfo.get('sub', '')}"
        acc, created = Account.objects.get_or_create(
            email=lookup_email,
            provider="google",
            defaults={"full_name": name, "avatar_url": picture or None},
        )
        acc.full_name = name
        acc.avatar_url = picture or None
        acc.last_login_at = timezone.now()
        acc.save(update_fields=["full_name", "avatar_url", "last_login_at"])
        perm = acc.club_permission or "user"
        role_display = _ROLE_DISPLAY.get(perm, "Người dùng")
        return Response({"token": app_token, "fullName": name, "email": email, "role": role_display, "clubPermission": perm, "picture": picture})
    except Exception:
        return Response({"detail": "Xác thực thất bại"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["GET"])
def google_auth_callback(request):
    """Callback từ Google - đổi code lấy token, redirect về frontend."""
    import requests as httpreq
    code = request.GET.get("code")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    scheme = "https" if request.is_secure() else "http"
    redirect_uri = f"{scheme}://{request.get_host()}/api/auth/google/callback"
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    if not code:
        return redirect(f"{frontend_url}/dang-nhap?error=missing_code")
    if not client_id or not client_secret:
        return redirect(f"{frontend_url}/dang-nhap?error=config")
    try:
        token_res = httpreq.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        token_res.raise_for_status()
        tokens = token_res.json()
        id_token_jwt = tokens.get("id_token", "")
        if not id_token_jwt:
            return redirect(f"{frontend_url}/dang-nhap?error=no_id_token")
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(
            id_token_jwt, google_requests.Request(), client_id, clock_skew_in_seconds=60
        )
        email = idinfo.get("email", "")
        name = idinfo.get("name", email.split("@")[0] if email else "User")
        app_token = "google-" + (idinfo.get("sub", "") or "demo")
        role_enc = urlquote("Quản trị viên")
        params = f"token={app_token}&fullName={urlquote(name)}&role={role_enc}"
        if email:
            params += f"&email={urlquote(email)}"
        return redirect(f"{frontend_url}/dang-nhap?{params}")
    except Exception:
        return redirect(f"{frontend_url}/dang-nhap?error=auth_failed")


@api_view(["GET"])
def account_list(request):
    """Danh sách tài khoản đã đăng nhập/đăng ký. Chỉ thành viên có vai trò."""
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    rows = list(Account.objects.all())
    uid_numeric = {_member_uid_to_acc_id(uid) for uid in Member.objects.values_list("user_id", flat=True) if _member_uid_to_acc_id(uid) is not None}
    for acc in rows:
        perm = getattr(acc, "club_permission", None) or "user"
        if perm != "user":
            if acc.id not in uid_numeric:
                _sync_account_member(acc, perm)
                uid_numeric.add(acc.id)
    return Response([
        {
            "id": r.id,
            "email": (getattr(r, "display_email", "") or "").strip() or r.email or "-",
            "fullName": r.full_name or "-",
            "avatarUrl": r.avatar_url,
            "provider": r.provider,
            "clubPermission": getattr(r, "club_permission", "user") or "user",
            "lastLoginAt": r.last_login_at.isoformat() if r.last_login_at else "",
            "createdAt": r.created_at.isoformat() if r.created_at else "",
        }
        for r in rows
    ])


@csrf_exempt
@api_view(["POST"])
def account_upload_avatar(request):
    """Tải ảnh từ máy lên, lưu vào media/avatars và trả về URL. Yêu cầu đăng nhập."""
    acc, err = _get_account_from_request(request)
    if err is not None:
        return err
    if "file" not in request.FILES:
        return Response({"detail": "Thiếu file ảnh"}, status=status.HTTP_400_BAD_REQUEST)
    f = request.FILES["file"]
    allowed = ("image/jpeg", "image/png", "image/gif", "image/webp")
    if f.content_type not in allowed:
        return Response({"detail": "Chỉ chấp nhận ảnh JPG, PNG, GIF, WebP"}, status=status.HTTP_400_BAD_REQUEST)
    ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}.get(f.content_type, ".jpg")
    avatars_dir = os.path.join(settings.MEDIA_ROOT, "avatars")
    os.makedirs(avatars_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(avatars_dir, filename)
    with open(filepath, "wb") as dst:
        for chunk in f.chunks():
            dst.write(chunk)
    base = request.build_absolute_uri("/").rstrip("/")
    url = f"{base}/{settings.MEDIA_URL.rstrip('/')}/avatars/{filename}"
    return Response({"url": url})


@csrf_exempt
@api_view(["POST"])
def upload_image(request):
    """Tải ảnh từ máy lên (dùng cho đối tác, quà tặng). Yêu cầu BCN hoặc Ban NS-TC."""
    _, err = _require_doi_tac_edit(request)
    if err is not None:
        return err
    if "file" not in request.FILES:
        return Response({"detail": "Thiếu file ảnh"}, status=status.HTTP_400_BAD_REQUEST)
    f = request.FILES["file"]
    allowed = ("image/jpeg", "image/png", "image/gif", "image/webp")
    if f.content_type not in allowed:
        return Response({"detail": "Chỉ chấp nhận ảnh JPG, PNG, GIF, WebP"}, status=status.HTTP_400_BAD_REQUEST)
    ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}.get(f.content_type, ".jpg")
    uploads_dir = os.path.join(settings.MEDIA_ROOT, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(uploads_dir, filename)
    with open(filepath, "wb") as dst:
        for chunk in f.chunks():
            dst.write(chunk)
    base = request.build_absolute_uri("/").rstrip("/")
    url = f"{base}/{settings.MEDIA_URL.rstrip('/')}/uploads/{filename}"
    return Response({"url": url})


@csrf_exempt
@api_view(["PUT", "PATCH"])
def account_update_profile(request):
    """Cập nhật thông tin tài khoản (tên, avatar) khi user sửa hồ sơ."""
    data = request.data
    email = (data.get("email") or data.get("accountEmail") or "").strip()
    if not email:
        return Response({"detail": "Thiếu email"}, status=status.HTTP_400_BAD_REQUEST)
    acc = Account.objects.filter(email__iexact=email).first()
    if not acc:
        acc = Account.objects.filter(display_email__iexact=email).first()
    if not acc:
        return Response({"detail": "Tài khoản không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    update_fields = []
    if "fullName" in data:
        acc.full_name = (data.get("fullName") or "").strip() or acc.full_name
        update_fields.append("full_name")
    if "avatar" in data:
        acc.avatar_url = (data.get("avatar") or "").strip() or None
        update_fields.append("avatar_url")
    if "displayEmail" in data or "display_email" in data:
        if hasattr(acc, "display_email"):
            acc.display_email = (data.get("displayEmail") or data.get("display_email") or "").strip()
            update_fields.append("display_email")
    if update_fields:
        acc.save(update_fields=update_fields)
        if "avatar_url" in update_fields:
            Member.objects.filter(user_id__in=[_account_user_id(acc), f"acc-{acc.id}"]).update(avatar_url=acc.avatar_url)
    canonical_email = (acc.email or getattr(acc, "display_email", "") or "").strip()
    return Response({"id": acc.id, "fullName": acc.full_name, "email": canonical_email})


# Phân quyền: chỉ Trưởng ban thuộc Ban chủ nhiệm, Phó ban không (logic nhóm ở frontend: BAN_CHU_NHIEM).


def _account_user_id(acc):
    """user_id lưu cho Member liên kết Account: chỉ dùng số (id tài khoản), không prefix acc-."""
    return str(acc.id)


def _member_uid_to_acc_id(user_id):
    """Lấy account id từ member.user_id; hỗ trợ cả '8' và 'acc-8' (legacy)."""
    if not user_id:
        return None
    s = str(user_id).strip()
    if s.isdigit():
        return int(s)
    if s.startswith("acc-"):
        try:
            return int(s[4:].lstrip())
        except (ValueError, TypeError):
            return None
    return None


PERM_TO_MEMBER = {
    "admin": ("", "Quản trị viên"),
    "chairperson": ("Ban Chủ nhiệm", "Chủ nhiệm"),
    "vice_chairperson": ("Ban Chủ nhiệm", "Phó chủ nhiệm"),
    "head_book": ("Ban Quản lý sách", "Trưởng ban Quản Lý Sách"),
    "vice_head_book": ("Ban Quản lý sách", "Phó ban Quản Lý Sách"),
    "head_communication": ("Ban Truyền thông - Đối Ngoại", "Trưởng ban Truyền thông - Đối Ngoại"),
    "vice_head_communication": ("Ban Truyền thông - Đối Ngoại", "Phó ban Truyền thông - Đối Ngoại"),
    "head_hr_finance": ("Ban Nhân sự - Tài Chính", "Trưởng ban Nhân sự - Tài Chính"),
    "vice_head_hr_finance": ("Ban Nhân sự - Tài Chính", "Phó ban Nhân sự - Tài Chính"),
    "member_book": ("Ban Quản lý sách", "Thành viên ban Quản lý sách"),
    "member_communication": ("Ban Truyền thông - Đối Ngoại", "Thành viên ban Truyền thông - Đối Ngoại"),
    "member_hr_finance": ("Ban Nhân sự - Tài Chính", "Thành viên ban Nhân sự - Tài Chính"),
    "user": ("", "Người dùng"),
}

# Ngược lại: (department, role) → club_permission để đồng bộ Account khi sửa Thành viên CLB
MEMBER_TO_PERM = {(v[0], v[1]): k for k, v in PERM_TO_MEMBER.items()}


@csrf_exempt
@api_view(["PUT", "PATCH"])
def account_update_permission(request, account_id):
    """Cập nhật quyền và tự thêm vào Thành viên CLB. Chỉ Ban chủ nhiệm. Body cần accountEmail (hoặc email)."""
    acc_caller, err = _require_ban_chu_nhiem(request)
    if err is not None:
        return err
    try:
        acc = Account.objects.get(pk=account_id)
    except Account.DoesNotExist:
        return Response({"detail": "Tài khoản không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    valid_perms = ("admin", "chairperson", "vice_chairperson", "head_book", "vice_head_book", "head_communication", "vice_head_communication", "head_hr_finance", "vice_head_hr_finance", "member_book", "member_communication", "member_hr_finance", "user")
    perm = (request.data.get("clubPermission") or request.data.get("club_permission") or "").strip().lower()
    if perm not in valid_perms:
        return Response({"detail": "Quyền không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)
    acc.club_permission = perm
    acc.save(update_fields=["club_permission"])

    _sync_account_member(acc, perm)

    # Đồng bộ quyền cho mọi tài khoản cùng email (khác provider) để đăng nhập Google/email dùng chung quyền
    if (getattr(acc, "email", None) or "").strip():
        for o in Account.objects.filter(email=acc.email).exclude(pk=acc.pk):
            o.club_permission = perm
            o.save(update_fields=["club_permission"])
            _sync_account_member(o, perm)

    return Response({"id": acc.id, "clubPermission": acc.club_permission})


def _sync_account_member(acc, perm):
    """Đồng bộ Member tương ứng với Account khi đổi quyền. user_id = id tài khoản (số), không prefix acc-."""
    user_id = _account_user_id(acc)
    dept, role = PERM_TO_MEMBER.get(perm, ("", "Người dùng"))
    if perm != "user":
        member, created = Member.objects.get_or_create(
            user_id=user_id,
            defaults={
                "name": acc.full_name or acc.email or "Chưa đặt tên",
                "department": dept,
                "role": role,
                "join_date": date.today(),
                "status": "active",
                "avatar_url": acc.avatar_url,
            },
        )
        if not created:
            member.name = acc.full_name or acc.email or member.name
            member.department = dept
            member.role = role
            member.status = "active"
            if acc.avatar_url:
                member.avatar_url = acc.avatar_url
            member.save(update_fields=["name", "department", "role", "status", "avatar_url"])
    else:
        Member.objects.filter(user_id__in=[user_id, f"acc-{acc.id}"]).update(status="inactive")


@csrf_exempt
@api_view(["DELETE"])
def account_delete(request, account_id):
    """Xóa tài khoản. Chỉ BCN. Không xóa được nếu thành viên liên kết đang có sách mượn chưa trả."""
    _, err = _require_ban_chu_nhiem(request)
    if err is not None:
        return err
    try:
        acc = Account.objects.get(pk=account_id)
    except Account.DoesNotExist:
        return Response({"detail": "Tài khoản không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    user_id = _account_user_id(acc)
    member = Member.objects.filter(user_id__in=[user_id, f"acc-{acc.id}"]).first()
    if member and BorrowRecord.objects.filter(member=member, return_date__isnull=True).exists():
        return Response({"detail": "Không thể xóa tài khoản vì thành viên liên kết đang có sách mượn chưa trả"}, status=status.HTTP_400_BAD_REQUEST)
    if member:
        member.delete()
    acc.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def dashboard_stats(request):
    """Lấy thống kê tổng quan từ dữ liệu thực (BorrowRecord, ...). Chỉ thành viên có vai trò."""
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    today = date.today()
    # Đếm trực tiếp từ phiếu mượn
    borrow_today = BorrowRecord.objects.filter(borrow_date=today).count()
    borrow_month = BorrowRecord.objects.filter(
        borrow_date__year=today.year,
        borrow_date__month=today.month,
    ).count()
    # Sách quá hạn: đang mượn và due_date < hôm nay
    overdue_count = BorrowRecord.objects.filter(
        return_date__isnull=True,
        due_date__lt=today,
    ).count()
    # Thành viên có vai trò (active)
    active_members = Member.objects.filter(status="active").count()
    # Phần trăm thay đổi: so với ngày trước / tháng trước (đơn giản)
    yesterday = today - timedelta(days=1)
    borrow_yesterday = BorrowRecord.objects.filter(borrow_date=yesterday).count()
    borrow_today_change = (float(borrow_today - borrow_yesterday) / borrow_yesterday * 100) if borrow_yesterday else 0
    prev_month = today.month - 1
    prev_year = today.year
    if prev_month <= 0:
        prev_month += 12
        prev_year -= 1
    borrow_prev_month = BorrowRecord.objects.filter(
        borrow_date__year=prev_year,
        borrow_date__month=prev_month,
    ).count()
    borrow_month_change = (float(borrow_month - borrow_prev_month) / borrow_prev_month * 100) if borrow_prev_month else 0
    return Response({
        "borrowToday": borrow_today,
        "borrowMonth": borrow_month,
        "overdueCount": overdue_count,
        "activeMembers": active_members,
        "borrowTodayChange": round(borrow_today_change, 1),
        "borrowMonthChange": round(borrow_month_change, 1),
        "activeMembersChange": 0,
    })


@api_view(["GET"])
def dashboard_borrow_trend(request):
    """Xu hướng mượn/trả theo ngày (7 ngày), tháng (12 tháng), hoặc năm (5 năm). Trả về [{ label, borrowCount, returnCount }]."""
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    period = (request.GET.get("period") or "day").strip().lower()
    if period not in ("day", "month", "year"):
        period = "day"
    today = date.today()
    result = []
    if period == "day":
        # 7 ngày gần nhất (kể cả hôm nay)
        day_labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            borrow_count = BorrowRecord.objects.filter(borrow_date=d).count()
            return_count = BorrowRecord.objects.filter(return_date=d).count()
            result.append({
                "label": day_labels[d.weekday()],
                "borrowCount": borrow_count,
                "returnCount": return_count,
            })
    elif period == "month":
        # 12 tháng gần nhất (tháng hiện tại là tháng 1)
        thang_vn = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"]
        for i in range(11, -1, -1):
            # tháng cách đây i tháng
            year = today.year
            month = today.month - i
            while month <= 0:
                month += 12
                year -= 1
            borrow_count = BorrowRecord.objects.filter(
                borrow_date__year=year,
                borrow_date__month=month,
            ).count()
            return_count = BorrowRecord.objects.filter(
                return_date__year=year,
                return_date__month=month,
            ).count()
            result.append({
                "label": thang_vn[month - 1],
                "borrowCount": borrow_count,
                "returnCount": return_count,
            })
    else:
        # 5 năm gần nhất
        for i in range(4, -1, -1):
            y = today.year - i
            borrow_count = BorrowRecord.objects.filter(borrow_date__year=y).count()
            return_count = BorrowRecord.objects.filter(return_date__year=y).count()
            result.append({
                "label": str(y),
                "borrowCount": borrow_count,
                "returnCount": return_count,
            })
    return Response(result)


def _sync_top_readers_from_borrows():
    """Cập nhật bảng TopReader từ BorrowRecord (số lần đã trả sách theo member)."""
    from django.db.models import Count
    # Đếm số phiếu mượn đã trả (return_date not null) theo member
    qs = (
        BorrowRecord.objects.filter(return_date__isnull=False)
        .values("member_id")
        .annotate(book_count=Count("id"))
        .order_by("-book_count")
    )
    member_ids = [r["member_id"] for r in qs]
    members = {m.id: m for m in Member.objects.filter(id__in=member_ids)}
    # Lấy avatar từ Account nếu member liên kết tài khoản (user_id = id số hoặc acc-* legacy)
    acc_ids = [aid for m in members.values() if (aid := _member_uid_to_acc_id(m.user_id)) is not None]
    accounts = {a.id: a for a in Account.objects.filter(id__in=acc_ids)} if acc_ids else {}
    TopReader.objects.all().delete()
    for rank, row in enumerate(qs, start=1):
        member = members.get(row["member_id"])
        if not member:
            continue
        name = member.name or "Thành viên"
        avatar_url = member.avatar_url
        aid = _member_uid_to_acc_id(member.user_id)
        if aid is not None:
            acc = accounts.get(aid)
            if acc and acc.avatar_url:
                avatar_url = acc.avatar_url
        TopReader.objects.create(
            name=name,
            book_count=row["book_count"],
            rank=rank,
            avatar_url=avatar_url or None,
        )


@api_view(["GET"])
def top_readers(request):
    """Lấy danh sách độc giả tích cực (từ bảng TopReader)."""
    if request.GET.get("refresh") == "1":
        _sync_top_readers_from_borrows()
    rows = TopReader.objects.all().order_by("rank")
    return Response([
        {
            "id": r.id,
            "name": r.name,
            "bookCount": r.book_count,
            "rank": r.rank,
            "avatarUrl": r.avatar_url,
        }
        for r in rows
    ])


@csrf_exempt
@api_view(["POST"])
def top_readers_refresh(request):
    """Cập nhật bảng xếp hạng từ dữ liệu mượn/trả (BorrowRecord). Chỉ Ban chủ nhiệm. Body cần accountEmail (hoặc email)."""
    acc, err = _require_ban_chu_nhiem(request)
    if err is not None:
        return err
    _sync_top_readers_from_borrows()
    return Response({"ok": True, "message": "Đã cập nhật bảng xếp hạng."})


def _default_ranking_gifts():
    """Payload mặc định cho quà tặng tháng (khi chưa có cấu hình)."""
    return {
        "intro": "Những phần quà hấp dẫn dành riêng cho Top 3 người đọc chăm chỉ nhất tháng này.",
        "items": [
            {"title": "Voucher Tiki 200k", "subtitle": "Dành cho Hạng #1", "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuBOtF31QubkOC7P9HFHTtEF8vjq_YU6ysz1Z9Aq4Ezj0xlA2iwdY1UN3VhP8bQfddL8rRyYSUNo2wLdC_gZ2ofPFa4lFgXDs4RbccKwhPQPV4pUGFC9A5KZJu6PxSy6nFkBtXDCtnv5pHjaceQYPP0zlTCze5BidfOtyF_h7jOy7lFmsBLKJBqB--5lHwuqBR3T6ojInJEp9GvnEl_8EHlBrOV8EgN94CNnMZkyPmo2ARdDW7lAMhYpoPnH0yEPPnZRYeMVBT112arq"},
            {"title": "Túi Tote CLB", "subtitle": "Dành cho Hạng #2 & #3", "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuDvg1085xtY4_1_KsnQSW0nFfO-ak-He21GMTL4wY82I4ew6NQcmVWRI-DH_cd1eckM7lRkw-EXTdCqIuG6PGf9auFd6jNJDM53g94xHGhOATBwE2QfxU-ge5mg8ZOzQsZNds1gTjXe3W96_Wm8AKEZFVKpDLI439SarQLBDn9A5CRLEH9Y0JTe3_9OD2FdogysA86jaym6cEkuTAgg7SG94V1DGmiohv0ovOIRRYRSGq6jhrikZFFAP9GhOLaI3dCpOoJiqJYY1vIa"},
            {"title": "Sách Tự Chọn", "subtitle": "Bốc thăm may mắn Top 10", "imageUrl": "https://lh3.googleusercontent.com/aida-public/AB6AXuAGr39HK8MuZX52nNDiS09fjibC6FfjZoyTLTfN3Id1Hoyo0VSEG12TFa8CKvTTI5WA1_aTnWEkaaBs-p-a5o6US4QJgvKXwerBRRxUnLLOaRUmNHZHjkNtTBDLylxJEkRjFUh3DpJK-58DH4KVqBuRLv0E0RBuZv8PiBmWlduwxt8_9RJR3vK2oJ43Y0GDkhqDDQGp-YrsIFjQ8j1ul0Ax-Z7Yq2_v7eVcqafgdHwszGY2W-uAAaXTRUt4C7Qv6kiYA6UFBsr_yK03"},
        ],
    }


@api_view(["GET"])
def ranking_gifts(request):
    """Lấy cấu hình quà tặng tháng (bảng xếp hạng). Trả về mặc định nếu chưa có."""
    row = RankingGiftConfig.objects.first()
    if not row:
        return Response(_default_ranking_gifts())
    return Response({
        "intro": row.intro or _default_ranking_gifts()["intro"],
        "items": row.items if isinstance(row.items, list) else _default_ranking_gifts()["items"],
    })


@csrf_exempt
@api_view(["PATCH", "PUT"])
def ranking_gifts_update(request):
    """Cập nhật cấu hình quà tặng tháng. Chỉ Ban chủ nhiệm. Body: intro?, items? (array of {title, subtitle, imageUrl})."""
    acc, err = _require_ban_chu_nhiem(request)
    if err is not None:
        return err
    data = request.data
    intro = data.get("intro")
    items = data.get("items")
    row = RankingGiftConfig.objects.first()
    if not row:
        row = RankingGiftConfig(intro=_default_ranking_gifts()["intro"], items=_default_ranking_gifts()["items"])
    if intro is not None and isinstance(intro, str):
        row.intro = intro.strip() or row.intro
    if items is not None and isinstance(items, list):
        row.items = [
            {
                "title": (x.get("title") or "").strip() or "Quà",
                "subtitle": (x.get("subtitle") or "").strip(),
                "imageUrl": (x.get("imageUrl") or "").strip() or "",
            }
            for x in items
            if isinstance(x, dict)
        ]
    row.save()
    return Response({
        "intro": row.intro,
        "items": row.items,
    })


@api_view(["GET"])
def overdue_books(request):
    """Lấy danh sách sách quá hạn chưa trả từ BorrowRecord. Yêu cầu thành viên có vai trò."""
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    today = date.today()
    rows = BorrowRecord.objects.select_related("book", "member").filter(
        return_date__isnull=True,
        due_date__lt=today,
    ).order_by("due_date")
    return Response([
        {
            "id": r.id,
            "bookTitle": r.book.title if r.book else "",
            "memberName": r.member.name if r.member else "",
            "dueDate": r.due_date.isoformat() if r.due_date else None,
            "daysOverdue": (today - r.due_date).days if r.due_date else 0,
        }
        for r in rows
    ])


# --- Sách ---
@api_view(["GET"])
def book_list(request):
    _, err = _require_kho_sach(request)
    if err is not None:
        return err
    rows = Book.objects.all()
    return Response([
        {
            "id": str(r.id),
            "title": r.title,
            "author": r.author,
            "genre": r.genre or "",
            "publisher": r.publisher or "",
            "price": r.price or "",
            "isBorrowed": r.is_borrowed,
        }
        for r in rows
    ])


@csrf_exempt
@api_view(["POST"])
def book_create(request):
    _, err = _require_kho_sach(request)
    if err is not None:
        return err
    data = request.data
    book = Book.objects.create(
        title=data.get("title", ""),
        author=data.get("author", ""),
        genre=data.get("genre", ""),
        publisher=data.get("publisher", ""),
        price=data.get("price", ""),
        is_borrowed=False,
    )
    return Response({"id": book.id, "title": book.title}, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["POST"])
def book_bulk_create(request):
    """Tạo hàng loạt sách placeholder (mã QR). Body: { count: 1-100 }."""
    _, err = _require_kho_sach(request)
    if err is not None:
        return err
    count = request.data.get("count", 0)
    try:
        count = int(count)
    except (TypeError, ValueError):
        count = 0
    if count < 1 or count > 100:
        return Response({"detail": "Số lượng phải từ 1 đến 100"}, status=status.HTTP_400_BAD_REQUEST)
    created = []
    for i in range(count):
        book = Book.objects.create(
            title=f"Mã QR - Chờ nhập #{i + 1}",
            author="",
            genre="",
            publisher="",
            price="",
            is_borrowed=False,
        )
        created.append({"id": book.id, "title": book.title})
    return Response({"created": len(created), "books": created}, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["PUT", "PATCH"])
def book_update(request, book_id):
    """Cập nhật sách. PUT/PATCH với { title, author, genre, publisher, price }."""
    _, err = _require_kho_sach(request)
    if err is not None:
        return err
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return Response({"detail": "Sách không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    data = request.data
    if "title" in data:
        book.title = data.get("title", "")
    if "author" in data:
        book.author = data.get("author", "")
    if "genre" in data:
        book.genre = data.get("genre", "")
    if "publisher" in data:
        book.publisher = data.get("publisher", "")
    if "price" in data:
        book.price = data.get("price", "")
    book.save()
    return Response({"id": book.id, "title": book.title})


@csrf_exempt
@api_view(["DELETE"])
def book_delete(request, book_id):
    """Xóa sách. Không xóa được nếu sách đang được mượn."""
    _, err = _require_kho_sach(request)
    if err is not None:
        return err
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return Response({"detail": "Sách không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    if book.is_borrowed:
        return Response({"detail": "Không thể xóa sách đang được mượn"}, status=status.HTTP_400_BAD_REQUEST)
    book.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- Thành viên ---
@api_view(["GET"])
def member_list(request):
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    for acc in Account.objects.exclude(club_permission="user"):
        uid = _account_user_id(acc)
        if not Member.objects.filter(user_id__in=[uid, f"acc-{acc.id}"]).exists():
            _sync_account_member(acc, acc.club_permission or "user")
    rows = list(Member.objects.all())
    acc_ids = [aid for r in rows if (aid := _member_uid_to_acc_id(r.user_id)) is not None]
    accounts_map = {a.id: a for a in Account.objects.filter(id__in=acc_ids)} if acc_ids else {}
    result = []
    for r in rows:
        avatar_url = r.avatar_url
        email = None
        acc_id = _member_uid_to_acc_id(r.user_id)
        if acc_id is not None:
            acc = accounts_map.get(acc_id)
            if acc:
                if acc.avatar_url:
                    avatar_url = acc.avatar_url
                email = acc.email or getattr(acc, "display_email", None) or ""
        # Một id thống nhất: id = mã thành viên (userId), không dùng pk nội bộ
        user_id_display = str(acc_id) if acc_id is not None else (r.user_id or "")
        result.append({
            "id": user_id_display,
            "name": r.name,
            "userId": user_id_display,
            "email": email or "",
            "department": r.department or "",
            "role": r.role or "",
            "joinDate": r.join_date.strftime("%d/%m/%Y") if r.join_date else "",
            "status": r.status,
            "avatarUrl": avatar_url,
        })
    return Response(result)


@csrf_exempt
@api_view(["POST"])
def member_create(request):
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    data = request.data
    uid = (data.get("userId") or "").strip()
    member = Member.objects.create(
        name=data.get("name", ""),
        user_id=uid,
        department=data.get("department", ""),
        role=data.get("role", ""),
        status=data.get("status", "active"),
    )
    return Response({"id": member.user_id or str(member.id), "name": member.name}, status=status.HTTP_201_CREATED)


def _resolve_member_by_uid(member_uid):
    """Tìm Member theo mã thành viên (user_id) hoặc pk hoặc account id hiển thị. Trả (member, None) hoặc (None, error_response)."""
    uid = (member_uid or "").strip()
    member = Member.objects.filter(user_id=uid).first()
    if member:
        return member, None
    if uid.isdigit():
        try:
            member = Member.objects.get(pk=int(uid))
            return member, None
        except Member.DoesNotExist:
            pass
        # id từ member_list có thể là account id (user_id_display); tìm member có user_id map tới account đó
        acc_id = int(uid)
        member = Member.objects.filter(user_id__in=[uid, f"acc-{acc_id}"]).first()
        if member:
            return member, None
    return None, Response({"detail": "Thành viên không tồn tại"}, status=status.HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["PUT", "PATCH"])
def member_update(request, member_uid):
    """Cập nhật thành viên. member_uid = mã thành viên (userId) hoặc pk."""
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    member, err_resp = _resolve_member_by_uid(member_uid)
    if err_resp is not None:
        return err_resp
    data = request.data
    if "name" in data:
        member.name = data.get("name", "")
    if "userId" in data:
        new_uid = data.get("userId", "").strip()
        if new_uid and Member.objects.exclude(pk=member.pk).filter(user_id=new_uid).exists():
            return Response({"detail": "Mã thành viên đã tồn tại"}, status=status.HTTP_400_BAD_REQUEST)
        member.user_id = new_uid
    if "department" in data:
        member.department = data.get("department", "")
    if "role" in data:
        member.role = data.get("role", "")
    if "status" in data:
        member.status = data.get("status", "active")
    if "joinDate" in data:
        from datetime import datetime
        jd = data.get("joinDate")
        if jd:
            try:
                member.join_date = datetime.strptime(str(jd)[:10], "%Y-%m-%d").date()
            except Exception:
                pass
        else:
            member.join_date = None
    member.save()

    # Đồng bộ Account liên kết (user_id = id số hoặc acc-* legacy) và các account cùng email để hai nơi xét quyền luôn khớp
    uid = (member.user_id or "").strip()
    acc_id = _member_uid_to_acc_id(uid)
    if acc_id is not None:
        valid_perms = ("admin", "chairperson", "vice_chairperson", "head_book", "vice_head_book", "head_communication", "vice_head_communication", "head_hr_finance", "vice_head_hr_finance", "member_book", "member_communication", "member_hr_finance", "user")
        perm = (data.get("clubPermission") or data.get("club_permission") or "").strip().lower()
        if perm not in valid_perms:
            perm = MEMBER_TO_PERM.get((member.department or "", member.role or ""), "user")
        try:
            acc = Account.objects.filter(pk=acc_id).first()
            if acc:
                acc.club_permission = perm
                acc.save(update_fields=["club_permission"])
                if (getattr(acc, "email", None) or "").strip():
                    for o in Account.objects.filter(email=acc.email).exclude(pk=acc.pk):
                        o.club_permission = perm
                        o.save(update_fields=["club_permission"])
                        _sync_account_member(o, perm)
        except (ValueError, TypeError):
            pass

    return Response({"id": member.user_id or str(member.id), "name": member.name})


@csrf_exempt
@api_view(["DELETE"])
def member_delete(request, member_uid):
    """Xóa thành viên. member_uid = mã thành viên (userId) hoặc pk. Không xóa được nếu đang có sách mượn chưa trả."""
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    member, err_resp = _resolve_member_by_uid(member_uid)
    if err_resp is not None:
        return err_resp
    if BorrowRecord.objects.filter(member=member, return_date__isnull=True).exists():
        return Response({"detail": "Không thể xóa thành viên đang có sách mượn chưa trả"}, status=status.HTTP_400_BAD_REQUEST)
    member.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- Thông báo ---
def _audience_to_permissions(audience):
    """Map audience string to list of club_permission values (đối tượng nhận tin)."""
    if not audience:
        return []
    a = (audience or "").strip().lower()
    if "chủ nhiệm" in a or "ban chủ nhiệm" in a:
        return ["admin", "chairperson", "vice_chairperson"]
    if "quản lý sách" in a:
        return ["head_book", "vice_head_book", "member_book"]
    if "truyền thông" in a or "đối ngoại" in a:
        return ["head_communication", "vice_head_communication", "member_communication"]
    if "nhân sự" in a or "tài chính" in a:
        return ["head_hr_finance", "vice_head_hr_finance", "member_hr_finance"]
    if "tất cả thành viên" in a:
        # Tất cả thành viên = mọi người có vai trò trong CLB, không bao gồm Người dùng
        return [
            "admin", "chairperson", "vice_chairperson",
            "head_book", "vice_head_book", "member_book",
            "head_communication", "vice_head_communication", "member_communication",
            "head_hr_finance", "vice_head_hr_finance", "member_hr_finance",
        ]
    if "người dùng" in a:
        return ["user"]
    return []


@api_view(["GET"])
def notification_unread_count(request):
    """Số thông báo chưa đọc của người gọi (để hiển thị badge trên sidebar)."""
    caller, err = _get_account_from_request(request)
    if err is not None:
        return err
    try:
        rows = Notification.objects.prefetch_related("read_receipts").all()
        caller_perm = (caller.club_permission or "user").strip().lower()
        count = 0
        for r in rows:
            perms = _audience_to_permissions(r.audience)
            # Chỉ đếm thông báo dành cho đối tượng có caller_perm; bỏ qua nếu audience trống/không map
            if not perms:
                continue
            if caller_perm not in perms:
                # BCN (admin, chairperson, vice_chairperson) cũng được xem thông báo Ban Quản lý Sách
                if "quản lý sách" in (r.audience or "").lower() and caller_perm in ("admin", "chairperson", "vice_chairperson"):
                    pass
                else:
                    continue
            read_ids = {rr.account_id for rr in r.read_receipts.all()}
            if caller.id not in read_ids:
                count += 1
        return Response({"count": count})
    except Exception:
        return Response({"count": 0})


@api_view(["GET"])
def notification_list(request):
    """Danh sách thông báo. Chỉ trả thông báo đúng đối tượng theo club_permission của người gọi."""
    caller, err = _get_account_from_request(request)
    if err is not None:
        return err
    try:
        rows = Notification.objects.prefetch_related("read_receipts__account").all()
        out = []
        caller_perm = (caller.club_permission or "user").strip().lower()
        # #region agent log
        _book_audience_count = sum(1 for r in rows if (r.audience or "").strip() and "quản lý sách" in (r.audience or "").lower())
        _visible_to_caller = sum(1 for r in rows if (_p := _audience_to_permissions(r.audience)) and caller_perm in _p)
        try:
            import json
            with open("debug-fd8ec8.log", "a", encoding="utf-8") as _f:
                _f.write(json.dumps({"sessionId": "fd8ec8", "location": "views.py:notification_list", "message": "List filter", "data": {"caller_perm": caller_perm, "book_audience_notif_count": _book_audience_count, "visible_to_caller_count": _visible_to_caller}, "timestamp": __import__("time").time() * 1000, "hypothesisId": "H4"}) + "\n")
        except Exception:
            pass
        # #endregion
        for r in rows:
            perms = _audience_to_permissions(r.audience)
            # Chỉ trả thông báo dành cho đối tượng có caller_perm; bỏ qua nếu audience trống/không map
            if not perms:
                continue
            if caller_perm not in perms:
                # BCN (admin, chairperson, vice_chairperson) cũng được xem thông báo Ban Quản lý Sách
                if "quản lý sách" in (r.audience or "").lower() and caller_perm in ("admin", "chairperson", "vice_chairperson"):
                    pass
                else:
                    continue
            read_receipts = list(r.read_receipts.all())
            read_by = [
                {"name": rr.account.full_name or rr.account.email or "—", "email": rr.account.email or rr.account.display_email or ""}
                for rr in read_receipts
            ]
            read_account_ids = {rr.account_id for rr in read_receipts}
            intended = (
                Account.objects.filter(club_permission__in=perms)
                if perms
                else Account.objects.none()
            )
            unread_accounts = intended.exclude(id__in=read_account_ids)
            unread_by = [
                {"name": acc.full_name or acc.email or "—", "email": acc.email or getattr(acc, "display_email", "") or ""}
                for acc in unread_accounts
            ]
            out.append({
                "id": r.id,
                "title": r.title,
                "summary": r.summary,
                "audience": r.audience or "",
                "scheduledDate": r.scheduled_date.strftime("%d/%m/%Y - %H:%M") if r.scheduled_date else "",
                "status": r.status,
                "type": r.type,
                "urgency": getattr(r, "urgency", None) or "normal",
                "senderLabel": getattr(r, "sender_label", None) or "",
                "readBy": read_by,
                "unreadBy": unread_by,
            })
        return Response(out)
    except Exception as e:
        raise


@csrf_exempt
@api_view(["POST"])
def notification_mark_read(request, notif_id):
    """Đánh dấu đã đọc thông báo (body: { email })."""
    email = (request.data.get("email") or "").strip()
    if not email:
        return Response({"detail": "Thiếu email"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        notif = Notification.objects.get(pk=notif_id)
    except Notification.DoesNotExist:
        return Response({"detail": "Thông báo không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    acc = Account.objects.filter(email__iexact=email).first()
    if not acc:
        acc = Account.objects.filter(display_email__iexact=email).first()
    if not acc:
        return Response({"detail": "Không tìm thấy tài khoản"}, status=status.HTTP_404_NOT_FOUND)
    _, created = NotificationRead.objects.get_or_create(notification=notif, account=acc)
    return Response({"ok": True, "read": created}, status=status.HTTP_200_OK)


@api_view(["GET"])
def activity_log_list(request):
    """Danh sách log thao tác của tài khoản (30 ngày). Chỉ trả nếu người gọi là chủ tài khoản hoặc BCN/Trưởng, Phó ban NS-TC."""
    caller, err = _get_account_from_request(request)
    if err is not None:
        return err
    email = (request.GET.get("email") or request.GET.get("accountEmail") or "").strip()
    if not email:
        return Response({"detail": "Thiếu email"}, status=status.HTTP_400_BAD_REQUEST)
    acc = Account.objects.filter(email__iexact=email).first()
    if not acc:
        acc = Account.objects.filter(display_email__iexact=email).first()
    if not acc:
        return Response({"detail": "Không tìm thấy tài khoản"}, status=status.HTTP_404_NOT_FOUND)
    perm = (caller.club_permission or "user").strip().lower()
    if caller.id != acc.id and perm not in ACTIVITY_LOG_VIEW_PERMISSIONS:
        return Response(
            {"detail": "Chỉ chủ tài khoản hoặc BCN/Trưởng, Phó ban NS-TC được xem lịch sử thao tác của người khác."},
            status=status.HTTP_403_FORBIDDEN,
        )
    from datetime import timedelta
    since = timezone.now() - timedelta(days=30)
    rows = ActivityLog.objects.filter(account=acc, created_at__gte=since).order_by("-created_at")[:500]
    out = [
        {"id": r.id, "action": r.action, "details": r.details or "", "createdAt": r.created_at.isoformat()}
        for r in rows
    ]
    return Response(out)


@csrf_exempt
@api_view(["POST"])
def activity_log_create(request):
    """Ghi log thao tác. Chỉ cho phép ghi log cho chính email của người gọi."""
    caller, err = _get_account_from_request(request)
    if err is not None:
        return err
    email = (request.data.get("email") or request.data.get("accountEmail") or "").strip()
    action = (request.data.get("action") or "").strip()
    if not email:
        return Response({"detail": "Thiếu email"}, status=status.HTTP_400_BAD_REQUEST)
    if not action:
        return Response({"detail": "Thiếu action"}, status=status.HTTP_400_BAD_REQUEST)
    acc = Account.objects.filter(email__iexact=email).first()
    if not acc:
        acc = Account.objects.filter(display_email__iexact=email).first()
    if not acc:
        return Response({"detail": "Không tìm thấy tài khoản"}, status=status.HTTP_404_NOT_FOUND)
    if acc.id != caller.id:
        return Response(
            {"detail": "Chỉ được ghi log thao tác cho chính tài khoản của bạn."},
            status=status.HTTP_403_FORBIDDEN,
        )
    details = (request.data.get("details") or "").strip()
    ActivityLog.objects.create(account=acc, action=action, details=details)
    return Response({"ok": True}, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["POST"])
def notification_create(request):
    """Tạo thông báo. Chỉ BCN + Trưởng ban + Phó ban."""
    caller, err = _get_account_from_request(request)
    if err is not None:
        return err
    perm = (caller.club_permission or "user").strip().lower()
    if perm not in NOTIFICATION_POST_PERMISSIONS:
        return Response(
            {"detail": "Chỉ Ban Chủ nhiệm và Trưởng/Phó ban được đăng thông báo."},
            status=status.HTTP_403_FORBIDDEN,
        )
    data = request.data
    from django.utils import timezone
    sd = None
    if data.get("scheduledDate"):
        try:
            from datetime import datetime
            sd = datetime.strptime(data["scheduledDate"][:16], "%Y-%m-%dT%H:%M")
            sd = timezone.make_aware(sd) if timezone.is_naive(sd) else sd
        except Exception:
            pass
    notif = Notification.objects.create(
        title=data.get("title", ""),
        summary=data.get("summary", ""),
        audience=data.get("audience", ""),
        scheduled_date=sd,
        status=data.get("status", "draft"),
        type=data.get("type", "internal"),
        urgency=data.get("urgency", "normal") or "normal",
        sender_label=data.get("senderLabel", "") or "",
    )
    return Response({"id": notif.id, "title": notif.title}, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["PUT", "PATCH"])
def notification_update(request, notif_id):
    """Cập nhật thông báo. Chỉ BCN + Trưởng ban + Phó ban."""
    caller, err = _get_account_from_request(request)
    if err is not None:
        return err
    perm = (caller.club_permission or "user").strip().lower()
    if perm not in NOTIFICATION_POST_PERMISSIONS:
        return Response(
            {"detail": "Chỉ Ban Chủ nhiệm và Trưởng/Phó ban được sửa thông báo."},
            status=status.HTTP_403_FORBIDDEN,
        )
    try:
        notif = Notification.objects.get(pk=notif_id)
    except Notification.DoesNotExist:
        return Response({"detail": "Thông báo không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    data = request.data
    from django.utils import timezone
    if "title" in data:
        notif.title = data.get("title", "")
    if "summary" in data:
        notif.summary = data.get("summary", "")
    if "audience" in data:
        notif.audience = data.get("audience", "")
    if "type" in data:
        notif.type = data.get("type", "internal")
    if "status" in data:
        notif.status = data.get("status", "draft")
    if "urgency" in data:
        notif.urgency = data.get("urgency", "normal") or "normal"
    if "senderLabel" in data:
        notif.sender_label = data.get("senderLabel", "") or ""
    if "scheduledDate" in data:
        sd = None
        if data.get("scheduledDate"):
            try:
                from datetime import datetime
                sd = datetime.strptime(str(data["scheduledDate"])[:16], "%Y-%m-%dT%H:%M")
                sd = timezone.make_aware(sd) if timezone.is_naive(sd) else sd
            except Exception:
                pass
        notif.scheduled_date = sd
    notif.save()
    return Response({"id": notif.id, "title": notif.title})


@csrf_exempt
@api_view(["DELETE"])
def notification_delete(request, notif_id):
    """Xóa thông báo. Chỉ BCN + Trưởng ban + Phó ban."""
    caller, err = _get_account_from_request(request)
    if err is not None:
        return err
    perm = (caller.club_permission or "user").strip().lower()
    if perm not in NOTIFICATION_POST_PERMISSIONS:
        return Response(
            {"detail": "Chỉ Ban Chủ nhiệm và Trưởng/Phó ban được xóa thông báo."},
            status=status.HTTP_403_FORBIDDEN,
        )
    try:
        notif = Notification.objects.get(pk=notif_id)
    except Notification.DoesNotExist:
        return Response({"detail": "Thông báo không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    notif.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- Mượn / Trả ---
@api_view(["GET"])
def borrow_list(request):
    _, err = _require_kho_sach(request)
    if err is not None:
        return err
    rows = BorrowRecord.objects.select_related("book", "member").filter(return_date__isnull=True)
    result = []
    for r in rows:
        uid = r.member.user_id or ""
        member_id_display = str(_member_uid_to_acc_id(uid)) if _member_uid_to_acc_id(uid) is not None else (uid or str(r.member_id))
        result.append({
            "id": r.id,
            "bookId": r.book_id,
            "bookTitle": r.book.title,
            "memberId": member_id_display,
            "memberName": r.member.name,
            "borrowDate": r.borrow_date.isoformat(),
            "dueDate": r.due_date.isoformat(),
        })
    return Response(result)


@csrf_exempt
@api_view(["POST"])
def borrow_create(request):
    _, err = _require_kho_sach(request)
    if err is not None:
        return err
    data = request.data
    book_id = data.get("bookId")
    member_id_param = data.get("memberId")
    if not book_id or member_id_param is None:
        return Response({"detail": "Thiếu bookId hoặc memberId"}, status=status.HTTP_400_BAD_REQUEST)
    member, err_resp = _resolve_member_by_uid(str(member_id_param))
    if err_resp is not None:
        return err_resp
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return Response({"detail": "Sách không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    if book.is_borrowed:
        return Response({"detail": "Sách đang được mượn"}, status=status.HTTP_400_BAD_REQUEST)
    from datetime import date, timedelta
    borrow_date = date.today()
    due_date = data.get("dueDate")
    if due_date:
        try:
            due_date = date.fromisoformat(due_date[:10])
        except Exception:
            due_date = borrow_date + timedelta(days=14)
    else:
        due_date = borrow_date + timedelta(days=14)
    record = BorrowRecord.objects.create(book=book, member=member, borrow_date=borrow_date, due_date=due_date)
    book.is_borrowed = True
    book.save(update_fields=["is_borrowed"])
    return Response({"id": record.id}, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["POST"])
def return_book(request):
    caller, err = _require_kho_sach(request)
    if err is not None:
        return err
    data = request.data
    record_id = data.get("recordId") or data.get("borrowId")
    if not record_id:
        return Response({"detail": "Thiếu recordId"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        record = BorrowRecord.objects.select_related("book", "member").get(pk=record_id)
    except BorrowRecord.DoesNotExist:
        return Response({"detail": "Phiếu mượn không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    from datetime import date
    record.return_date = date.today()
    raw_notes = (data.get("returnNotes") or data.get("return_notes") or "").strip()[:2000]
    record.return_notes = raw_notes
    record.save(update_fields=["return_date", "return_notes"])
    record.book.is_borrowed = False
    record.book.save(update_fields=["is_borrowed"])

    # #region agent log
    import json
    _log_path = "debug-fd8ec8.log"
    try:
        with open(_log_path, "a", encoding="utf-8") as _f:
            _f.write(json.dumps({"sessionId": "fd8ec8", "location": "views.py:return_book", "message": "After save", "data": {"returnNotes_key": "returnNotes" in data, "return_notes_key": "return_notes" in data, "raw_notes_len": len(raw_notes), "record_return_notes_len": len(record.return_notes or ""), "will_create_notif": bool(record.return_notes)}, "timestamp": __import__("time").time() * 1000, "hypothesisId": "H2"}) + "\n")
    except Exception:
        pass
    # #endregion

    # Tự động gửi thông báo tới Ban QLS khi có ghi chú trả sách (do tài khoản xác nhận trả đăng)
    if record.return_notes:
        sender_label = caller.full_name or caller.email or _ROLE_DISPLAY.get((caller.club_permission or "user").strip().lower(), "Tài khoản xác nhận trả")
        book = record.book
        member = record.member
        title = f"Ghi chú trả sách: {book.title}"
        summary_parts = [
            f"Ghi chú: {record.return_notes}",
            "",
            f"Sách: {book.title}" + (f" - {book.author}" if book.author else ""),
            f"Mã sách: {book.id}",
            f"Người trả: {member.name}",
            f"Ngày trả: {record.return_date.strftime('%d/%m/%Y')}",
        ]
        notif = Notification.objects.create(
            title=title,
            summary="\n".join(summary_parts),
            audience="Ban Quản lý Sách",
            status="sent",
            type="internal",
            urgency="normal",
            sender_label=sender_label,
        )
        # #region agent log
        try:
            with open(_log_path, "a", encoding="utf-8") as _f:
                _f.write(json.dumps({"sessionId": "fd8ec8", "location": "views.py:return_book", "message": "Notification created", "data": {"notif_id": notif.id, "audience": notif.audience, "caller_perm": (caller.club_permission or "").strip().lower()}, "timestamp": __import__("time").time() * 1000, "hypothesisId": "H3"}) + "\n")
        except Exception:
            pass
        # #endregion

    return Response({"ok": True})


# --- Thu chi quỹ (Fund / NS-TC) ---
from django.db.models import Sum, Q
from decimal import Decimal


def _fund_balance():
    """Tổng quỹ = tổng thu đã xác nhận - tổng chi đã xác nhận."""
    confirmed = FundTransaction.objects.filter(status=FundTransaction.STATUS_CONFIRMED)
    inc = confirmed.filter(type=FundTransaction.TYPE_INCOME).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    exp = confirmed.filter(type=FundTransaction.TYPE_EXPENSE).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    return inc - exp


@api_view(["GET"])
def fund_stats(request):
    """Thống kê thu chi. Chỉ thành viên có vai trò."""
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    from datetime import date
    today = date.today()
    month_start = today.replace(day=1)

    total_balance = _fund_balance()
    month_income = (
        FundTransaction.objects.filter(
            transaction_date__gte=month_start,
            type=FundTransaction.TYPE_INCOME,
            status=FundTransaction.STATUS_CONFIRMED,
        ).aggregate(s=Sum("amount"))["s"]
        or Decimal("0")
    )
    month_expense = (
        FundTransaction.objects.filter(
            transaction_date__gte=month_start,
            type=FundTransaction.TYPE_EXPENSE,
            status=FundTransaction.STATUS_CONFIRMED,
        ).aggregate(s=Sum("amount"))["s"]
        or Decimal("0")
    )
    pending_count = FundTransaction.objects.filter(status=FundTransaction.STATUS_PENDING).count()

    return Response({
        "totalBalance": int(total_balance),
        "totalIncomeMonth": int(month_income),
        "totalExpenseMonth": int(month_expense),
        "pendingCount": pending_count,
    })


@api_view(["GET"])
def fund_transaction_list(request):
    """Danh sách giao dịch thu chi. Chỉ thành viên có vai trò."""
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    from datetime import date
    today = date.today()

    month_param = request.GET.get("month")  # "2023-10" hoặc "10-2023"
    search = (request.GET.get("search") or "").strip()
    try:
        page = max(1, int(request.GET.get("page") or 1))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = max(1, min(50, int(request.GET.get("page_size") or 10)))
    except (TypeError, ValueError):
        page_size = 10

    qs = FundTransaction.objects.select_related("requester_account").all().order_by("-transaction_date", "-id")

    if month_param:
        try:
            from datetime import timedelta
            if "-" in month_param:
                parts = month_param.split("-")
                if len(parts[0]) == 4:  # 2023-10
                    y, m = int(parts[0]), int(parts[1])
                else:  # 10-2023
                    m, y = int(parts[0]), int(parts[1])
            else:
                y, m = today.year, today.month
            start = date(y, m, 1)
            if m == 12:
                end = date(y, 12, 31)
            else:
                end = date(y, m + 1, 1) - timedelta(days=1)
            qs = qs.filter(transaction_date__gte=start, transaction_date__lte=end)
        except (ValueError, IndexError):
            pass

    if search:
        qs = qs.filter(
            Q(content__icontains=search) | Q(requester_name__icontains=search)
        )

    total = qs.count()
    start_idx = (page - 1) * page_size
    rows = qs[start_idx : start_idx + page_size]

    def row_to_json(r):
        name = r.requester_name or (r.requester_account.full_name if r.requester_account else "")
        return {
            "id": r.id,
            "transactionDate": r.transaction_date.isoformat(),
            "content": r.content,
            "type": r.type,
            "amount": int(r.amount),
            "requesterName": name,
            "requesterAvatarUrl": getattr(r.requester_account, "avatar_url", None) if r.requester_account else None,
            "requesterEmail": (r.requester_account.email if r.requester_account else None) or None,
            "status": r.status,
        }

    return Response({
        "results": [row_to_json(r) for r in rows],
        "total": total,
        "page": page,
        "pageSize": page_size,
    })


@csrf_exempt
@api_view(["POST"])
def fund_transaction_create(request):
    """Tạo giao dịch thu/chi mới. Chỉ BCN + Ban NS-TC."""
    caller, err = _get_account_from_request(request)
    if err is not None:
        return err
    perm = (caller.club_permission or "user").strip().lower()
    if perm not in FINANCE_CAN_ADD_PERMISSIONS:
        return Response(
            {"detail": "Chỉ Ban Chủ nhiệm và Ban Nhân sự - Tài Chính được thêm giao dịch."},
            status=status.HTTP_403_FORBIDDEN,
        )
    from datetime import date

    data = request.data
    content = (data.get("content") or "").strip()
    trans_type = data.get("type", "").lower()
    amount_raw = data.get("amount")
    requester_name = (data.get("requesterName") or "").strip()
    trans_date_str = data.get("transactionDate")

    if not content:
        return Response({"detail": "Vui lòng nhập nội dung."}, status=status.HTTP_400_BAD_REQUEST)
    if trans_type not in (FundTransaction.TYPE_INCOME, FundTransaction.TYPE_EXPENSE):
        return Response({"detail": "Loại giao dịch phải là income hoặc expense."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        amount = Decimal(str(amount_raw))
        if amount <= 0:
            raise ValueError("amount must be positive")
    except (TypeError, ValueError):
        return Response({"detail": "Số tiền không hợp lệ (phải là số dương)."}, status=status.HTTP_400_BAD_REQUEST)
    if not requester_name:
        return Response({"detail": "Vui lòng nhập người yêu cầu."}, status=status.HTTP_400_BAD_REQUEST)

    trans_date = timezone.now().date()
    if trans_date_str:
        try:
            trans_date = date.fromisoformat(trans_date_str[:10])
        except (ValueError, TypeError):
            pass

    created_by_email = (data.get("createdByEmail") or data.get("accountEmail") or "").strip()
    requester_account = None
    if created_by_email:
        requester_account = Account.objects.filter(
            Q(email__iexact=created_by_email) | Q(display_email__iexact=created_by_email)
        ).first()

    obj = FundTransaction.objects.create(
        transaction_date=trans_date,
        content=content,
        type=trans_type,
        amount=amount,
        requester_name=requester_name,
        requester_account=requester_account,
        status=FundTransaction.STATUS_PENDING,
    )
    requester_email = (obj.requester_account.email if obj.requester_account else None) or None
    return Response({
        "id": obj.id,
        "transactionDate": obj.transaction_date.isoformat(),
        "content": obj.content,
        "type": obj.type,
        "amount": int(obj.amount),
        "requesterName": obj.requester_name,
        "requesterEmail": requester_email,
        "status": obj.status,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def fund_transaction_detail(request, transaction_id):
    """Chi tiết một giao dịch. Chỉ thành viên có vai trò."""
    _, err = _require_thanh_vien(request)
    if err is not None:
        return err
    try:
        r = FundTransaction.objects.select_related("requester_account").get(pk=transaction_id)
    except FundTransaction.DoesNotExist:
        return Response({"detail": "Giao dịch không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
    name = r.requester_name or (r.requester_account.full_name if r.requester_account else "")
    return Response({
        "id": r.id,
        "transactionDate": r.transaction_date.isoformat(),
        "content": r.content,
        "type": r.type,
        "amount": int(r.amount),
        "requesterName": name,
        "requesterAvatarUrl": getattr(r.requester_account, "avatar_url", None) if r.requester_account else None,
        "requesterEmail": (r.requester_account.email if r.requester_account else None) or None,
        "status": r.status,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
    })


@csrf_exempt
@api_view(["PUT", "PATCH"])
def fund_transaction_update(request, transaction_id):
    """Cập nhật giao dịch. Đổi trạng thái duyệt chỉ BCN + Trưởng/Phó ban NS-TC."""
    from datetime import date
    caller, err = _get_account_from_request(request)
    if err is not None:
        return err
    try:
        obj = FundTransaction.objects.get(pk=transaction_id)
    except FundTransaction.DoesNotExist:
        return Response({"detail": "Giao dịch không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    data = request.data
    new_status = data.get("status") if "status" in data else None
    if new_status in (FundTransaction.STATUS_PENDING, FundTransaction.STATUS_CONFIRMED):
        perm = (caller.club_permission or "user").strip().lower()
        if perm not in FINANCE_CAN_APPROVE_PERMISSIONS:
            return Response(
                {"detail": "Chỉ Ban Chủ nhiệm và Trưởng/Phó ban NS-TC được duyệt giao dịch."},
                status=status.HTTP_403_FORBIDDEN,
            )
        obj.status = new_status
    if "content" in data and isinstance(data["content"], str):
        obj.content = data["content"].strip() or obj.content
    if "requesterName" in data and isinstance(data["requesterName"], str):
        obj.requester_name = data["requesterName"].strip() or obj.requester_name
    if "transactionDate" in data:
        try:
            obj.transaction_date = date.fromisoformat(str(data["transactionDate"])[:10])
        except (ValueError, TypeError):
            pass
    if "amount" in data:
        try:
            am = Decimal(str(data["amount"]))
            if am > 0:
                obj.amount = am
        except (TypeError, ValueError):
            pass
    obj.save()
    requester_email = (obj.requester_account.email if obj.requester_account else None) or None
    return Response({
        "id": obj.id,
        "transactionDate": obj.transaction_date.isoformat(),
        "content": obj.content,
        "type": obj.type,
        "amount": int(obj.amount),
        "requesterName": obj.requester_name,
        "requesterEmail": requester_email,
        "status": obj.status,
    })


# --- Nhà tài trợ & Đối tác ---
DEFAULT_DOI_TAC = {
    "sponsorsGold": [
        {"name": "TechEdu Solutions", "description": "Đơn vị cung cấp giải pháp công nghệ giáo dục hàng đầu.", "image": "", "icon": "verified"},
        {"name": "NXB Tri Thức Trẻ", "description": "Đối tác cung cấp nguồn sách bản quyền phong phú.", "image": "", "icon": "school"},
    ],
    "partnersStrategic": [
        {"name": "Innovation Hub", "desc": "Hỗ trợ không gian làm việc nhóm.", "image": ""},
        {"name": "Coffee & Books", "desc": "Tài trợ voucher đồ uống.", "image": ""},
    ],
    "partnersCommunity": [
        {"name": "BookWorm", "icon": "menu_book"},
        {"name": "Global Lang", "icon": "language"},
    ],
}


@api_view(["GET"])
def doi_tac_get(request):
    """Lấy nội dung trang Nhà tài trợ & Đối tác."""
    row = DoiTacData.objects.filter(key="data").first()
    if not row or not row.data:
        return Response(DEFAULT_DOI_TAC)
    data = dict(row.data)
    data.setdefault("sponsorsGold", DEFAULT_DOI_TAC["sponsorsGold"])
    data.setdefault("partnersStrategic", DEFAULT_DOI_TAC["partnersStrategic"])
    data.setdefault("partnersCommunity", DEFAULT_DOI_TAC["partnersCommunity"])
    return Response(data)


@csrf_exempt
@api_view(["PUT", "PATCH"])
def doi_tac_update(request):
    """Cập nhật nội dung trang Nhà tài trợ & Đối tác. Chỉ BCN + Ban NS-TC. Body cần accountEmail (hoặc email)."""
    acc, err = _require_doi_tac_edit(request)
    if err is not None:
        return err
    data = request.data or {}
    row, _ = DoiTacData.objects.get_or_create(key="data", defaults={"data": DEFAULT_DOI_TAC})
    current = dict(row.data) if row.data else {}
    if "sponsorsGold" in data and isinstance(data["sponsorsGold"], list):
        current["sponsorsGold"] = data["sponsorsGold"]
    if "partnersStrategic" in data and isinstance(data["partnersStrategic"], list):
        current["partnersStrategic"] = data["partnersStrategic"]
    if "partnersCommunity" in data and isinstance(data["partnersCommunity"], list):
        current["partnersCommunity"] = data["partnersCommunity"]
    row.data = current
    row.save(update_fields=["data", "updated_at"])
    return Response(current)


# --- Quyên góp ---
# Chỉ Ban chủ nhiệm (QTV, Chủ nhiệm, Phó Chủ nhiệm) được tạo/sửa chiến dịch.
QUYEN_GOP_EDIT_PERMISSIONS = ("admin", "chairperson", "vice_chairperson")

# Kho sách (Books, QR, Mượn, Trả): BCN + Ban Quản lý Sách (khớp frontend SIDEBAR_SHOW_BOOK_MENU).
KHO_SACH_PERMISSIONS = (
    "admin", "chairperson", "vice_chairperson",
    "head_book", "vice_head_book", "member_book",
)
# Thành viên: có vai trò (không phải user).
THANH_VIEN_PERMISSIONS = (
    "admin", "chairperson", "vice_chairperson",
    "head_book", "vice_head_book", "member_book",
    "head_communication", "vice_head_communication", "member_communication",
    "head_hr_finance", "vice_head_hr_finance", "member_hr_finance",
)
# Xem lịch sử thao tác của người khác: BCN + Trưởng/Phó ban NS-TC (khớp frontend CAN_VIEW_ACTIVITY_LOG).
ACTIVITY_LOG_VIEW_PERMISSIONS = (
    "admin", "chairperson", "vice_chairperson",
    "head_hr_finance", "vice_head_hr_finance",
)
# Đăng/sửa/xóa thông báo: BCN + Trưởng ban + Phó ban (khớp frontend canPostNotifications).
NOTIFICATION_POST_PERMISSIONS = (
    "admin", "chairperson", "vice_chairperson",
    "head_book", "vice_head_book",
    "head_communication", "vice_head_communication",
    "head_hr_finance", "vice_head_hr_finance",
)
# Tài chính: quyền thêm giao dịch (khớp frontend FINANCE_CAN_ADD_TRANSACTION).
FINANCE_CAN_ADD_PERMISSIONS = (
    "admin", "chairperson", "vice_chairperson",
    "head_hr_finance", "vice_head_hr_finance", "member_hr_finance",
)
# Tài chính: quyền duyệt giao dịch (khớp frontend FINANCE_CAN_APPROVE).
FINANCE_CAN_APPROVE_PERMISSIONS = (
    "admin", "chairperson", "vice_chairperson",
    "head_hr_finance", "vice_head_hr_finance",
)


def _get_account_from_request(request):
    """Lấy Account từ request: Bearer email-<id> hoặc email/accountEmail trong body/GET. Trả (acc, None) hoặc (None, err_Response)."""
    acc = None
    auth_header = request.META.get("HTTP_AUTHORIZATION") or ""
    if auth_header.startswith("Bearer "):
        token = (auth_header[7:] or "").strip()
        if token.startswith("email-") and token[6:].isdigit():
            try:
                acc = Account.objects.get(pk=int(token[6:]))
            except (ValueError, Account.DoesNotExist):
                pass
    if acc is None:
        data = getattr(request, "data", None) or {}
        if not isinstance(data, dict):
            data = {}
        email = (
            (data.get("accountEmail") or data.get("email") or "")
            or (request.GET.get("accountEmail") or request.GET.get("email") or "")
        ).strip()
        if not email:
            return None, Response(
                {"detail": "Thiếu email tài khoản (accountEmail) hoặc token (Authorization: Bearer email-<id>)."},
                status=status.HTTP_403_FORBIDDEN,
            )
        acc = Account.objects.filter(Q(email__iexact=email) | Q(display_email__iexact=email)).first()
        if not acc:
            return None, Response({"detail": "Không tìm thấy tài khoản."}, status=status.HTTP_404_NOT_FOUND)
    return acc, None


def _require_kho_sach(request):
    """Kiểm tra quyền Kho sách (BCN + Ban Quản lý Sách)."""
    acc, err = _get_account_from_request(request)
    if err is not None:
        return None, err
    perm = (acc.club_permission or "user").strip().lower()
    if perm not in KHO_SACH_PERMISSIONS:
        return None, Response(
            {"detail": "Chỉ Ban Chủ nhiệm và Ban Quản lý Sách được thực hiện thao tác này."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return acc, None


def _require_thanh_vien(request):
    """Kiểm tra quyền Thành viên (có vai trò, không phải user)."""
    acc, err = _get_account_from_request(request)
    if err is not None:
        return None, err
    perm = (acc.club_permission or "user").strip().lower()
    if perm not in THANH_VIEN_PERMISSIONS:
        return None, Response(
            {"detail": "Chỉ thành viên có vai trò được thực hiện thao tác này."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return acc, None


def _require_ban_chu_nhiem(request):
    """Lấy tài khoản từ request (accountEmail/email) và kiểm tra thuộc Ban chủ nhiệm. Trả về (account, None) hoặc (None, Response)."""
    data = getattr(request, "data", None) or {}
    if not isinstance(data, dict):
        data = {}
    email = (
        (data.get("accountEmail") or data.get("email") or "")
        or (request.GET.get("accountEmail") or request.GET.get("email") or "")
    ).strip()
    if not email:
        return None, Response(
            {"detail": "Thiếu email tài khoản (accountEmail)."},
            status=status.HTTP_403_FORBIDDEN,
        )
    acc = Account.objects.filter(
        Q(email__iexact=email) | Q(display_email__iexact=email)
    ).first()
    if not acc:
        return None, Response(
            {"detail": "Không tìm thấy tài khoản."},
            status=status.HTTP_404_NOT_FOUND,
        )
    perm = (acc.club_permission or "user").strip().lower()
    if perm not in QUYEN_GOP_EDIT_PERMISSIONS:
        return None, Response(
            {"detail": "Chỉ Ban chủ nhiệm (Quản trị viên, Chủ nhiệm, Phó Chủ nhiệm) được thực hiện thao tác này."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return acc, None


# Đối tác: Ban chủ nhiệm + Ban Nhân sự - Tài Chính (khớp frontend DOI_TAC_CAN_EDIT).
DOI_TAC_EDIT_PERMISSIONS = (
    "admin", "chairperson", "vice_chairperson",
    "head_hr_finance", "vice_head_hr_finance", "member_hr_finance",
)


def _require_doi_tac_edit(request):
    """Lấy tài khoản từ request và kiểm tra được phép chỉnh sửa Đối tác. Trả về (account, None) hoặc (None, Response)."""
    data = getattr(request, "data", None) or {}
    if not isinstance(data, dict):
        data = {}
    email = (
        (data.get("accountEmail") or data.get("email") or "")
        or (request.GET.get("accountEmail") or request.GET.get("email") or "")
    ).strip()
    if not email:
        return None, Response(
            {"detail": "Thiếu email tài khoản (accountEmail)."},
            status=status.HTTP_403_FORBIDDEN,
        )
    acc = Account.objects.filter(
        Q(email__iexact=email) | Q(display_email__iexact=email)
    ).first()
    if not acc:
        return None, Response(
            {"detail": "Không tìm thấy tài khoản."},
            status=status.HTTP_404_NOT_FOUND,
        )
    perm = (acc.club_permission or "user").strip().lower()
    if perm not in DOI_TAC_EDIT_PERMISSIONS:
        return None, Response(
            {"detail": "Chỉ Ban chủ nhiệm và Ban Nhân sự - Tài Chính được chỉnh sửa trang Đối tác."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return acc, None


@api_view(["GET"])
def quyen_gop_campaigns_list(request):
    """Danh sách tất cả chiến dịch (cho dashboard / chỉnh sửa)."""
    from django.db.models import Sum, Count
    rows = (
        DonationCampaign.objects.annotate(
            _raised=Sum("donations__amount"),
            _support_count=Count("donations"),
        )
        .order_by("-created_at")
    )
    out = []
    for c in rows:
        raised = int(c._raised or 0)
        support_count = c._support_count or 0
        out.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "goal": int(c.goal),
            "bannerUrl": c.banner_url,
            "startDate": c.start_date.isoformat() if c.start_date else None,
            "endDate": c.end_date.isoformat() if c.end_date else None,
            "isActive": c.is_active,
            "raised": raised,
            "supportCount": support_count,
            "createdAt": c.created_at.isoformat() if c.created_at else None,
            "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
        })
    return Response(out)


@api_view(["GET"])
def quyen_gop_campaign_detail(request, campaign_id):
    """Chi tiết một chiến dịch (cho form chỉnh sửa)."""
    try:
        c = DonationCampaign.objects.get(pk=campaign_id)
    except DonationCampaign.DoesNotExist:
        return Response({"detail": "Chiến dịch không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
    from django.db.models import Sum, Count
    agg = Donation.objects.filter(campaign=c).aggregate(total=Sum("amount"), count=Count("id"))
    raised = int(agg["total"] or 0)
    support_count = agg["count"] or 0
    return Response({
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "goal": int(c.goal),
        "bannerUrl": c.banner_url,
        "startDate": c.start_date.isoformat() if c.start_date else None,
        "endDate": c.end_date.isoformat() if c.end_date else None,
        "isActive": c.is_active,
        "raised": raised,
        "supportCount": support_count,
        "createdAt": c.created_at.isoformat() if c.created_at else None,
        "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
    })


@csrf_exempt
@api_view(["POST"])
def quyen_gop_campaign_create(request):
    """Tạo chiến dịch quyên góp mới. Chỉ Ban chủ nhiệm. Body cần accountEmail (hoặc email)."""
    acc, err = _require_ban_chu_nhiem(request)
    if err is not None:
        return err
    data = request.data
    title = (data.get("title") or "").strip()
    if not title:
        return Response({"detail": "Vui lòng nhập tiêu đề chiến dịch."}, status=status.HTTP_400_BAD_REQUEST)
    from decimal import Decimal
    goal_raw = data.get("goal")
    try:
        goal = Decimal(str(goal_raw)) if goal_raw is not None else Decimal("0")
        if goal < 0:
            goal = Decimal("0")
    except (TypeError, ValueError):
        goal = Decimal("0")
    start_date = None
    end_date = None
    if data.get("startDate"):
        try:
            start_date = date.fromisoformat(str(data["startDate"])[:10])
        except (ValueError, TypeError):
            pass
    if data.get("endDate"):
        try:
            end_date = date.fromisoformat(str(data["endDate"])[:10])
        except (ValueError, TypeError):
            pass
    c = DonationCampaign.objects.create(
        title=title,
        description=(data.get("description") or "").strip(),
        goal=goal,
        banner_url=(data.get("bannerUrl") or data.get("banner_url") or "").strip() or None,
        start_date=start_date,
        end_date=end_date,
        is_active=bool(data.get("isActive", True)),
    )
    return Response({
        "id": c.id,
        "title": c.title,
        "goal": int(c.goal),
        "isActive": c.is_active,
    }, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["PUT", "PATCH"])
def quyen_gop_campaign_update(request, campaign_id):
    """Chỉnh sửa chiến dịch quyên góp. Chỉ Ban chủ nhiệm. Body cần accountEmail (hoặc email)."""
    acc, err = _require_ban_chu_nhiem(request)
    if err is not None:
        return err
    try:
        c = DonationCampaign.objects.get(pk=campaign_id)
    except DonationCampaign.DoesNotExist:
        return Response({"detail": "Chiến dịch không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
    data = request.data
    if "title" in data and isinstance(data["title"], str):
        c.title = data["title"].strip() or c.title
    if "description" in data:
        c.description = (data.get("description") or "").strip()
    if "goal" in data:
        try:
            from decimal import Decimal
            g = Decimal(str(data["goal"]))
            if g >= 0:
                c.goal = g
        except (TypeError, ValueError):
            pass
    if "bannerUrl" in data or "banner_url" in data:
        c.banner_url = (data.get("bannerUrl") or data.get("banner_url") or "").strip() or None
    if "startDate" in data:
        try:
            c.start_date = date.fromisoformat(str(data["startDate"])[:10]) if data.get("startDate") else None
        except (ValueError, TypeError):
            pass
    if "endDate" in data:
        try:
            c.end_date = date.fromisoformat(str(data["endDate"])[:10]) if data.get("endDate") else None
        except (ValueError, TypeError):
            pass
    if "isActive" in data:
        c.is_active = bool(data.get("isActive"))
    c.save()
    return Response({
        "id": c.id,
        "title": c.title,
        "goal": int(c.goal),
        "isActive": c.is_active,
        "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
    })


@api_view(["GET"])
def quyen_gop_campaign(request):
    """Lấy chiến dịch quyên góp đang active hoặc mới nhất (cho trang công khai)."""
    campaign = (
        DonationCampaign.objects.filter(is_active=True).first()
        or DonationCampaign.objects.first()
    )
    if not campaign:
        from decimal import Decimal
        return Response({
            "id": None,
            "title": "Chung tay xây dựng thư viện tri thức",
            "description": "",
            "goal": 20000000,
            "bannerUrl": None,
            "startDate": None,
            "endDate": None,
            "raised": 0,
            "supportCount": 0,
            "topDonor": None,
            "daysLeft": None,
        })
    from django.db.models import Sum, Count
    agg = Donation.objects.filter(campaign=campaign).aggregate(
        total=Sum("amount"), count=Count("id")
    )
    raised = int(agg["total"] or 0)
    support_count = agg["count"] or 0
    top_donation = (
        Donation.objects.filter(campaign=campaign)
        .exclude(donor_name__iexact="Ẩn danh")
        .order_by("-amount")
        .first()
    )
    top_donor = top_donation.donor_name if top_donation else None
    days_left = None
    if campaign.end_date:
        from datetime import date
        delta = (campaign.end_date - date.today()).days
        days_left = max(0, delta)
    return Response({
        "id": campaign.id,
        "title": campaign.title,
        "description": campaign.description,
        "goal": int(campaign.goal),
        "bannerUrl": campaign.banner_url,
        "startDate": campaign.start_date.isoformat() if campaign.start_date else None,
        "endDate": campaign.end_date.isoformat() if campaign.end_date else None,
        "raised": raised,
        "supportCount": support_count,
        "topDonor": top_donor,
        "daysLeft": days_left,
    })


@api_view(["GET"])
def quyen_gop_donations_list(request):
    """Danh sách đóng góp (công khai hoặc theo campaign_id)."""
    campaign_id = request.GET.get("campaignId") or request.GET.get("campaign_id")
    qs = Donation.objects.all().order_by("-created_at")
    if campaign_id:
        try:
            qs = qs.filter(campaign_id=int(campaign_id))
        except (ValueError, TypeError):
            pass
    page = max(1, int(request.GET.get("page") or 1))
    page_size = max(1, min(50, int(request.GET.get("page_size") or 20)))
    total = qs.count()
    start = (page - 1) * page_size
    rows = qs[start : start + page_size]
    return Response({
        "results": [
            {
                "id": r.id,
                "donorName": r.donor_name,
                "amount": int(r.amount),
                "message": r.message or "",
                "isAnonymous": r.is_anonymous,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "pageSize": page_size,
    })


@csrf_exempt
@api_view(["POST"])
def quyen_gop_donate(request):
    """Gửi xác nhận đã chuyển khoản quyên góp."""
    from decimal import Decimal
    data = request.data
    amount_raw = data.get("amount")
    donor_name = (data.get("donorName") or data.get("senderName") or "").strip()
    message = (data.get("message") or "").strip()
    is_anonymous = bool(data.get("anonymous") or data.get("isAnonymous"))
    campaign_id = data.get("campaignId") or data.get("campaign_id")

    try:
        amount = Decimal(str(amount_raw))
        if amount <= 0:
            raise ValueError("amount must be positive")
    except (TypeError, ValueError):
        return Response(
            {"detail": "Số tiền không hợp lệ (phải là số dương)."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not donor_name and not is_anonymous:
        return Response(
            {"detail": "Vui lòng nhập tên người gửi hoặc chọn ủng hộ ẩn danh."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    display_name = "Ẩn danh" if is_anonymous else (donor_name or "Ẩn danh")

    campaign = None
    if campaign_id:
        try:
            campaign = DonationCampaign.objects.filter(pk=int(campaign_id)).first()
        except (ValueError, TypeError):
            pass
    if not campaign:
        campaign = DonationCampaign.objects.filter(is_active=True).first() or DonationCampaign.objects.first()

    account = None
    email = (data.get("accountEmail") or data.get("email") or "").strip()
    if email:
        account = Account.objects.filter(
            Q(email__iexact=email) | Q(display_email__iexact=email)
        ).first()

    obj = Donation.objects.create(
        campaign=campaign,
        donor_name=display_name,
        amount=amount,
        message=message,
        is_anonymous=is_anonymous,
        account=account,
    )
    return Response({
        "id": obj.id,
        "donorName": obj.donor_name,
        "amount": int(obj.amount),
        "createdAt": obj.created_at.isoformat() if obj.created_at else None,
    }, status=status.HTTP_201_CREATED)
