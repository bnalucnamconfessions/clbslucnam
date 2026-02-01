"""
API views cho dashboard và auth.
"""
import os
import uuid
from datetime import date
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
    DashboardStats,
    TopReader,
    OverdueBook,
    Book,
    Member,
    Notification,
    NotificationRead,
    ActivityLog,
    BorrowRecord,
    FundTransaction,
)


@api_view(["GET"])
def root(request):
    return Response({"message": "CLB Thư viện API", "docs": "/admin/"})

@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@csrf_exempt
@api_view(["POST"])
def login(request):
    """Đăng nhập - email + password từ Account. CSRF exempt để frontend gọi được."""
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password", "")

    # Đăng nhập bằng email + password từ Account
    acc = Account.objects.filter(email__iexact=username, provider="email").first()
    if acc and acc.password_hash and check_password(password, acc.password_hash):
        acc.last_login_at = timezone.now()
        acc.save(update_fields=["last_login_at"])
        _ROLE_DISPLAY = {"admin": "Quản trị viên", "chairperson": "Chủ nhiệm", "vice_chairperson": "Phó chủ nhiệm", "head_book": "Trưởng ban Quản Lý Sách", "vice_head_book": "Phó ban Quản Lý Sách", "head_communication": "Trưởng ban Truyền thông - Đối Ngoại", "vice_head_communication": "Phó ban Truyền thông - Đối Ngoại", "head_hr_finance": "Trưởng ban Nhân sự - Tài Chính", "vice_head_hr_finance": "Phó ban Nhân sự - Tài Chính", "member_book": "Thành viên ban Quản lý sách", "member_communication": "Thành viên ban Truyền thông - Đối Ngoại", "member_hr_finance": "Thành viên ban Nhân sự - Tài Chính", "user": "Người dùng"}
        role_display = _ROLE_DISPLAY.get(acc.club_permission or "user", "Người dùng")
        return Response({
            "token": f"email-{acc.id}",
            "fullName": acc.full_name or acc.email or "User",
            "email": acc.email or "",
            "role": role_display,
            "clubPermission": acc.club_permission or "user",
        })

    return Response(
        {"detail": "Tên đăng nhập hoặc mật khẩu không đúng."},
        status=status.HTTP_401_UNAUTHORIZED,
    )


@api_view(["GET"])
def auth_me(request):
    """Trả về quyền hiện tại của user theo email (để các máy/tab tự động cập nhật khi admin đổi quyền). Gồm joinDate từ Member liên kết (NGÀY THAM GIA)."""
    email = (request.GET.get("email") or request.GET.get("accountEmail") or "").strip()
    if not email:
        return Response({"detail": "Thiếu email"}, status=status.HTTP_400_BAD_REQUEST)
    acc = Account.objects.filter(Q(email=email) | Q(display_email=email)).first()
    if not acc:
        return Response({"detail": "Không tìm thấy tài khoản"}, status=status.HTTP_404_NOT_FOUND)
    _ROLE_DISPLAY = {"admin": "Quản trị viên", "chairperson": "Chủ nhiệm", "vice_chairperson": "Phó chủ nhiệm", "head_book": "Trưởng ban Quản Lý Sách", "vice_head_book": "Phó ban Quản Lý Sách", "head_communication": "Trưởng ban Truyền thông - Đối Ngoại", "vice_head_communication": "Phó ban Truyền thông - Đối Ngoại", "head_hr_finance": "Trưởng ban Nhân sự - Tài Chính", "vice_head_hr_finance": "Phó ban Nhân sự - Tài Chính", "member_book": "Thành viên ban Quản lý sách", "member_communication": "Thành viên ban Truyền thông - Đối Ngoại", "member_hr_finance": "Thành viên ban Nhân sự - Tài Chính", "user": "Người dùng"}
    perm = acc.club_permission or "user"
    role_display = _ROLE_DISPLAY.get(perm, "Người dùng")
    join_date_str = None
    member = Member.objects.filter(user_id=f"acc-{acc.id}").first()
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
    """Đăng ký tài khoản mới (email + password)."""
    data = request.data
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")
    full_name = (data.get("fullName") or data.get("full_name") or "").strip()

    if not email:
        return Response({"detail": "Vui lòng nhập email."}, status=status.HTTP_400_BAD_REQUEST)
    if not password or len(password) < 8:
        return Response({"detail": "Mật khẩu phải có ít nhất 8 ký tự."}, status=status.HTTP_400_BAD_REQUEST)
    if Account.objects.filter(email=email, provider="email").exists():
        return Response({"detail": "Email đã được đăng ký."}, status=status.HTTP_400_BAD_REQUEST)

    if not full_name:
        full_name = email.split("@")[0].replace(".", " ").title()

    acc = Account.objects.create(
        email=email,
        full_name=full_name,
        provider="email",
        club_permission="user",
        password_hash=make_password(password),
    )
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
        _ROLE_DISPLAY = {"admin": "Quản trị viên", "chairperson": "Chủ nhiệm", "vice_chairperson": "Phó chủ nhiệm", "head_book": "Trưởng ban Quản Lý Sách", "vice_head_book": "Phó ban Quản Lý Sách", "head_communication": "Trưởng ban Truyền thông - Đối Ngoại", "vice_head_communication": "Phó ban Truyền thông - Đối Ngoại", "head_hr_finance": "Trưởng ban Nhân sự - Tài Chính", "vice_head_hr_finance": "Phó ban Nhân sự - Tài Chính", "member_book": "Thành viên ban Quản lý sách", "member_communication": "Thành viên ban Truyền thông - Đối Ngoại", "member_hr_finance": "Thành viên ban Nhân sự - Tài Chính", "user": "Người dùng"}
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
        return redirect(f"{frontend_url}/dang-nhap?token={app_token}&fullName={urlquote(name)}&role={role_enc}")
    except Exception:
        return redirect(f"{frontend_url}/dang-nhap?error=auth_failed")


@api_view(["GET"])
def account_list(request):
    """Danh sách tài khoản đã đăng nhập/đăng ký."""
    rows = Account.objects.all()
    for acc in rows:
        perm = getattr(acc, "club_permission", None) or "user"
        if perm != "user":
            user_id = f"acc-{acc.id}"
            if not Member.objects.filter(user_id=user_id).exists():
                _sync_account_member(acc, perm)
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
    """Tải ảnh từ máy lên, lưu vào media/avatars và trả về URL."""
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
            Member.objects.filter(user_id=f"acc-{acc.id}").update(avatar_url=acc.avatar_url)
    canonical_email = (acc.email or getattr(acc, "display_email", "") or "").strip()
    return Response({"id": acc.id, "fullName": acc.full_name, "email": canonical_email})


# Phân quyền: chỉ Trưởng ban thuộc Ban chủ nhiệm, Phó ban không (logic nhóm ở frontend: BAN_CHU_NHIEM).
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
    """Cập nhật quyền và tự thêm vào Thành viên CLB nếu phân quyền khác người dùng."""
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
    """Đồng bộ Member tương ứng với Account khi đổi quyền."""
    user_id = f"acc-{acc.id}"
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
        Member.objects.filter(user_id=user_id).update(status="inactive")


@csrf_exempt
@api_view(["DELETE"])
def account_delete(request, account_id):
    """Xóa tài khoản. Không xóa được nếu thành viên liên kết đang có sách mượn chưa trả."""
    try:
        acc = Account.objects.get(pk=account_id)
    except Account.DoesNotExist:
        return Response({"detail": "Tài khoản không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    user_id = f"acc-{acc.id}"
    member = Member.objects.filter(user_id=user_id).first()
    if member and BorrowRecord.objects.filter(member=member, return_date__isnull=True).exists():
        return Response({"detail": "Không thể xóa tài khoản vì thành viên liên kết đang có sách mượn chưa trả"}, status=status.HTTP_400_BAD_REQUEST)
    if member:
        member.delete()
    acc.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def dashboard_stats(request):
    """Lấy thống kê tổng quan."""
    row = DashboardStats.objects.first()
    if not row:
        return Response({
            "borrowToday": 0,
            "borrowMonth": 0,
            "overdueCount": 0,
            "activeMembers": 0,
            "borrowTodayChange": 0,
            "borrowMonthChange": 0,
            "activeMembersChange": 0,
        })
    return Response({
        "borrowToday": row.borrow_today,
        "borrowMonth": row.borrow_month,
        "overdueCount": row.overdue_count,
        "activeMembers": row.active_members,
        "borrowTodayChange": float(row.borrow_today_change or 0),
        "borrowMonthChange": float(row.borrow_month_change or 0),
        "activeMembersChange": float(row.active_members_change or 0),
    })


@api_view(["GET"])
def top_readers(request):
    """Lấy danh sách độc giả tích cực."""
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


@api_view(["GET"])
def overdue_books(request):
    """Lấy danh sách sách quá hạn chưa trả."""
    rows = OverdueBook.objects.all()
    return Response([
        {
            "id": r.id,
            "bookTitle": r.book_title,
            "memberName": r.member_name,
            "dueDate": r.due_date.isoformat() if r.due_date else None,
            "daysOverdue": r.days_overdue,
        }
        for r in rows
    ])


# --- Sách ---
@api_view(["GET"])
def book_list(request):
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
    for acc in Account.objects.exclude(club_permission="user"):
        user_id = f"acc-{acc.id}"
        if not Member.objects.filter(user_id=user_id).exists():
            _sync_account_member(acc, acc.club_permission or "user")
    rows = Member.objects.all()
    result = []
    for r in rows:
        avatar_url = r.avatar_url
        email = None
        if r.user_id and str(r.user_id).startswith("acc-"):
            try:
                acc_id = int(str(r.user_id).replace("acc-", ""))
                acc = Account.objects.filter(pk=acc_id).first()
                if acc:
                    if acc.avatar_url:
                        avatar_url = acc.avatar_url
                    email = acc.email or getattr(acc, "display_email", None) or ""
            except (ValueError, TypeError):
                pass
        result.append({
            "id": str(r.id),
            "name": r.name,
            "userId": r.user_id,
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
    data = request.data
    member = Member.objects.create(
        name=data.get("name", ""),
        user_id=data.get("userId", ""),
        department=data.get("department", ""),
        role=data.get("role", ""),
        status=data.get("status", "active"),
    )
    return Response({"id": member.id, "name": member.name}, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["PUT", "PATCH"])
def member_update(request, member_id):
    """Cập nhật thành viên."""
    try:
        member = Member.objects.get(pk=member_id)
    except Member.DoesNotExist:
        return Response({"detail": "Thành viên không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    data = request.data
    if "name" in data:
        member.name = data.get("name", "")
    if "userId" in data:
        new_uid = data.get("userId", "")
        if new_uid and Member.objects.exclude(pk=member_id).filter(user_id=new_uid).exists():
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

    # Đồng bộ Account liên kết (user_id = acc-{id}) và các account cùng email để hai nơi xét quyền luôn khớp
    uid = (member.user_id or "").strip()
    if uid.startswith("acc-"):
        valid_perms = ("admin", "chairperson", "vice_chairperson", "head_book", "vice_head_book", "head_communication", "vice_head_communication", "head_hr_finance", "vice_head_hr_finance", "member_book", "member_communication", "member_hr_finance", "user")
        perm = (data.get("clubPermission") or data.get("club_permission") or "").strip().lower()
        if perm not in valid_perms:
            perm = MEMBER_TO_PERM.get((member.department or "", member.role or ""), "user")
        try:
            acc_id = int(uid[4:])
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

    return Response({"id": member.id, "name": member.name})


@csrf_exempt
@api_view(["DELETE"])
def member_delete(request, member_id):
    """Xóa thành viên. Không xóa được nếu đang có sách mượn chưa trả."""
    try:
        member = Member.objects.get(pk=member_id)
    except Member.DoesNotExist:
        return Response({"detail": "Thành viên không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    if BorrowRecord.objects.filter(member=member, return_date__isnull=True).exists():
        return Response({"detail": "Không thể xóa thành viên đang có sách mượn chưa trả"}, status=status.HTTP_400_BAD_REQUEST)
    member.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- Thông báo ---
# #region agent log
def _debug_log(location, message, data=None, hypothesis_id=None):
    import json
    import time
    try:
        with open(r"d:\code\clbslucnam\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "location": location,
                "message": message,
                "data": data or {},
                "timestamp": int(time.time() * 1000),
                "sessionId": "debug-session",
                "hypothesisId": hypothesis_id,
            }, ensure_ascii=False) + "\n")
    except Exception:
        pass
# #endregion


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
        return None  # all accounts
    if "người dùng" in a:
        return ["user"]
    return []


@api_view(["GET"])
def notification_list(request):
    try:
        rows = Notification.objects.prefetch_related("read_receipts__account").all()
        out = []
        for r in rows:
            read_receipts = list(r.read_receipts.all())
            read_by = [
                {"name": rr.account.full_name or rr.account.email or "—", "email": rr.account.email or rr.account.display_email or ""}
                for rr in read_receipts
            ]
            read_account_ids = {rr.account_id for rr in read_receipts}
            perms = _audience_to_permissions(r.audience)
            if perms is None:
                intended = Account.objects.all()
            elif perms:
                intended = Account.objects.filter(club_permission__in=perms)
            else:
                intended = Account.objects.none()
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


def _activity_log_debug(msg, data):
    try:
        import json
        with open("d:/code/clbslucnam/.cursor/debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"message": msg, "data": data}, ensure_ascii=False) + "\n")
    except Exception:
        pass


@api_view(["GET"])
def activity_log_list(request):
    """Danh sách log thao tác của tài khoản (30 ngày gần nhất)."""
    email = (request.GET.get("email") or request.GET.get("accountEmail") or "").strip()
    _activity_log_debug("activity_log_list", {"email": email, "email_len": len(email)})
    if not email:
        return Response({"detail": "Thiếu email"}, status=status.HTTP_400_BAD_REQUEST)
    acc = Account.objects.filter(email__iexact=email).first()
    if not acc:
        acc = Account.objects.filter(display_email__iexact=email).first()
    _activity_log_debug("activity_log_list account", {"found": acc is not None, "acc_id": acc.id if acc else None})
    if not acc:
        return Response({"detail": "Không tìm thấy tài khoản"}, status=status.HTTP_404_NOT_FOUND)
    from datetime import timedelta
    since = timezone.now() - timedelta(days=30)
    rows = ActivityLog.objects.filter(account=acc, created_at__gte=since).order_by("-created_at")[:500]
    out = [
        {"id": r.id, "action": r.action, "details": r.details or "", "createdAt": r.created_at.isoformat()}
        for r in rows
    ]
    _activity_log_debug("activity_log_list result", {"count": len(out)})
    return Response(out)


@csrf_exempt
@api_view(["POST"])
def activity_log_create(request):
    """Ghi log thao tác (body: email hoặc accountEmail, action, details)."""
    email = (request.data.get("email") or request.data.get("accountEmail") or "").strip()
    action = (request.data.get("action") or "").strip()
    _activity_log_debug("activity_log_create", {"email": email, "action": action, "body_keys": list(request.data.keys()) if hasattr(request.data, "keys") else []})
    if not email:
        return Response({"detail": "Thiếu email"}, status=status.HTTP_400_BAD_REQUEST)
    if not action:
        return Response({"detail": "Thiếu action"}, status=status.HTTP_400_BAD_REQUEST)
    acc = Account.objects.filter(email__iexact=email).first()
    if not acc:
        acc = Account.objects.filter(display_email__iexact=email).first()
    _activity_log_debug("activity_log_create account", {"found": acc is not None})
    if not acc:
        return Response({"detail": "Không tìm thấy tài khoản"}, status=status.HTTP_404_NOT_FOUND)
    details = (request.data.get("details") or "").strip()
    ActivityLog.objects.create(account=acc, action=action, details=details)
    _activity_log_debug("activity_log_create", {"created": True})
    return Response({"ok": True}, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["POST"])
def notification_create(request):
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
    """Cập nhật thông báo."""
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
    """Xóa thông báo."""
    try:
        notif = Notification.objects.get(pk=notif_id)
    except Notification.DoesNotExist:
        return Response({"detail": "Thông báo không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    notif.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- Mượn / Trả ---
@api_view(["GET"])
def borrow_list(request):
    rows = BorrowRecord.objects.select_related("book", "member").filter(return_date__isnull=True)
    return Response([
        {
            "id": r.id,
            "bookId": r.book_id,
            "bookTitle": r.book.title,
            "memberId": r.member_id,
            "memberName": r.member.name,
            "borrowDate": r.borrow_date.isoformat(),
            "dueDate": r.due_date.isoformat(),
        }
        for r in rows
    ])


@csrf_exempt
@api_view(["POST"])
def borrow_create(request):
    data = request.data
    book_id = data.get("bookId")
    member_id = data.get("memberId")
    if not book_id or not member_id:
        return Response({"detail": "Thiếu bookId hoặc memberId"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        book = Book.objects.get(pk=book_id)
        member = Member.objects.get(pk=member_id)
    except (Book.DoesNotExist, Member.DoesNotExist):
        return Response({"detail": "Sách hoặc thành viên không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
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
    data = request.data
    record_id = data.get("recordId") or data.get("borrowId")
    if not record_id:
        return Response({"detail": "Thiếu recordId"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        record = BorrowRecord.objects.get(pk=record_id)
    except BorrowRecord.DoesNotExist:
        return Response({"detail": "Phiếu mượn không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    from datetime import date
    record.return_date = date.today()
    record.save(update_fields=["return_date"])
    record.book.is_borrowed = False
    record.book.save(update_fields=["is_borrowed"])
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
    """Thống kê thu chi: tổng quỹ, tổng thu tháng, tổng chi tháng, số đơn chờ duyệt."""
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
    """Danh sách giao dịch thu chi, có lọc tháng, tìm kiếm, phân trang."""
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
    """Tạo giao dịch thu/chi mới."""
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

    obj = FundTransaction.objects.create(
        transaction_date=trans_date,
        content=content,
        type=trans_type,
        amount=amount,
        requester_name=requester_name,
        status=FundTransaction.STATUS_PENDING,
    )
    return Response({
        "id": obj.id,
        "transactionDate": obj.transaction_date.isoformat(),
        "content": obj.content,
        "type": obj.type,
        "amount": int(obj.amount),
        "requesterName": obj.requester_name,
        "status": obj.status,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def fund_transaction_detail(request, transaction_id):
    """Chi tiết một giao dịch."""
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
        "status": r.status,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
    })


@csrf_exempt
@api_view(["PUT", "PATCH"])
def fund_transaction_update(request, transaction_id):
    """Cập nhật giao dịch (nội dung, trạng thái, ...)."""
    from datetime import date

    try:
        obj = FundTransaction.objects.get(pk=transaction_id)
    except FundTransaction.DoesNotExist:
        return Response({"detail": "Giao dịch không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    data = request.data
    if "status" in data and data["status"] in (FundTransaction.STATUS_PENDING, FundTransaction.STATUS_CONFIRMED):
        obj.status = data["status"]
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
    return Response({
        "id": obj.id,
        "transactionDate": obj.transaction_date.isoformat(),
        "content": obj.content,
        "type": obj.type,
        "amount": int(obj.amount),
        "requesterName": obj.requester_name,
        "status": obj.status,
    })
