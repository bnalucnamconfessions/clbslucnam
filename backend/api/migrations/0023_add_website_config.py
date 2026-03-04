# Migration: Cấu hình website (chỉ Ban chủ nhiệm chỉnh sửa)
from django.db import migrations, models


def default_website_config(apps, schema_editor):
    WebsiteConfig = apps.get_model("api", "WebsiteConfig")
    WebsiteConfig.objects.get_or_create(
        key="main",
        defaults={
            "data": {
                "siteName": "CLB Sách và Hành động THPT Lục Nam",
                "logoUrl": "",
                "contactEmail": "",
                "footerText": "",
            },
        },
    )


class Migration(migrations.Migration):
    dependencies = [("api", "0022_borrowrecord_guest_optional_member")]

    operations = [
        migrations.CreateModel(
            name="WebsiteConfig",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(default="main", max_length=50, unique=True)),
                ("data", models.JSONField(blank=True, default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "website_config", "ordering": ["key"]},
        ),
        migrations.RunPython(default_website_config, migrations.RunPython.noop),
    ]
