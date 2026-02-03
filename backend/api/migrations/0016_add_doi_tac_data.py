# Generated migration for DoiTacData
from django.db import migrations, models


def default_data(apps, schema_editor):
    DoiTacData = apps.get_model("api", "DoiTacData")
    DoiTacData.objects.get_or_create(
        key="data",
        defaults={
            "data": {
                "sponsorsGold": [
                    {
                        "name": "TechEdu Solutions",
                        "description": "Đơn vị cung cấp giải pháp công nghệ giáo dục hàng đầu, tài trợ hệ thống quản lý thư viện số và các thiết bị đọc sách điện tử cho thành viên câu lạc bộ.",
                        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuDFeNK03UVhhBhrowYdOBhu3E_JUSgTKvURaPih5t9eUZ-G2HSyhUJgbmpti1g_xl-2N0nGDJF8RgMJLT4KmaPfAcBwrvw4edcFwO9f4tL1V8tfLkdzlWS3on5aYhS_giH5J-b9zpTObzs-1yflSM2P5hxi1HLNLW9-IdA4ROB1760Crl1-ZCIAfI3sMnRvoA-N3y4D9lY8OSKQcuAhy2pK9uPm8rAztj54Qx7CdgH0uvBNrb05Vr9RmmDrCQd17fWIBT7WaMVo5m38",
                        "icon": "verified",
                    },
                    {
                        "name": "NXB Tri Thức Trẻ",
                        "description": "Đối tác cung cấp nguồn sách bản quyền phong phú, hỗ trợ tổ chức các buổi tọa đàm tác giả và workshop kỹ năng đọc hiểu cho sinh viên.",
                        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCAixUwENBdTJtrysXw2eh_LMbEtEQZa3ZU2OVUOIMdHa0HpIKl2CccNvfmswBoe5BOEeqo6UK5Hbb19o94EAaqoXDprHLxGqzT9yxHsBrQewsZE8hmWy-6BxoQPf-IdfGI6B6Qt5B7RFDWML9jIxQoRJ6kkbucVxI3-IJDR10TtDqgw5R1SKwUALeBz5JTErC0w4DmVYw726K3AGe-EZzM2iapbfE6iEJMVQDyK9fSX_l01QCeOiRQUgdcIciIVFRAHrDvcoXNz2_J",
                        "icon": "school",
                    },
                ],
                "partnersStrategic": [
                    {"name": "Innovation Hub", "desc": "Hỗ trợ không gian làm việc nhóm và tổ chức sự kiện chuyên nghiệp cho các dự án của CLB.", "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCqnBdMDqFF36ZHbeOv7NxTVGX8yJ1A_yTuyfASGjoaJ1tmytRJNa8ePT6gZx-QuKjBIPy8C5-tRpF8cqGADjs4qZjgBRGdUjGYmb16Y7F_ouqzW3-3_pOJvzmAVh-8uzBhXPScJByyIeYx7QpJ6NrDgUcm3drGram9FH_MSvNC8a7AIb9EsXoNe_aHecaGi2fhiCp2oTMdTWrUHPSJNuQQeKWwJudr3C-KeLQ-UNgJWkMfvOgAG-TUX4yhvPbn84mCnOyFolc_HN5z"},
                    {"name": "Coffee & Books", "desc": "Tài trợ voucher đồ uống và địa điểm cho các buổi offline đọc sách hàng tháng.", "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuAEz5ZZObQsNNQXR8gs-BOTaQcowIEJcdnoRY18VON36WW3Bgq3YzvOExscRRz6swDMJA8Or9LGr_VSfYFSldLA8z5rgVlqvhjiZTdiu4uEdXSMwjbobWFYUrujo_Kuqn2LSvw8G7ee_9D_nmeM3jMWDCrDK-3uFGgFy97Md5nMNbwmLgYFii-UXMQZ5i7SAEc4RJUx6pz1S7C9DxQfME6QAFJXnsUxL0m8g0iuwMPAop3HoowjMOlix2txK3X2_NMJ1tXbjtRPzdCd"},
                    {"name": "Alpha Stationery", "desc": "Cung cấp văn phòng phẩm và các vật phẩm quà tặng cho các cuộc thi viết.", "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuAm8geTdPQunDiVInhI932PTrFJi5FpOvO99fZk_vzh_-cjQCYOfoISC8liLr3XLqJjfNLxfOv_KATKHbAbUX2wCt0FcNTbmUj-oeuBPHwNW-9wn6QDqlE0cJ9m0xlkVsPtBGP8-iGxKwAi_GnuKqjkfDfBQHNwg2W8RaDPs9PkGNLq3_MSxf8xsgDLOP4MonKvKVsgGgxSNZ7rhoVikpTZ04YKzG83VRY9DTBJRRZdWyaum1zaOQTDX8E2hTcXUWuJXOMgZSE6S9Iv"},
                ],
                "partnersCommunity": [
                    {"name": "BookWorm", "icon": "menu_book"},
                    {"name": "Global Lang", "icon": "language"},
                    {"name": "Art Space", "icon": "palette"},
                    {"name": "SciLab", "icon": "science"},
                    {"name": "GameZone", "icon": "sports_esports"},
                ],
            },
        },
    )


class Migration(migrations.Migration):
    dependencies = [("api", "0015_add_activity_log")]

    operations = [
        migrations.CreateModel(
            name="DoiTacData",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(default="data", max_length=50, unique=True)),
                ("data", models.JSONField(blank=True, default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "doi_tac_data", "ordering": ["key"]},
        ),
        migrations.RunPython(default_data, migrations.RunPython.noop),
    ]
