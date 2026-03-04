# Migration: Mã 12 chữ số cho sách (QR / hiển thị thống nhất)
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0023_add_website_config")]

    operations = [
        migrations.AddField(
            model_name="book",
            name="code",
            field=models.CharField(blank=True, max_length=12, null=True, unique=True),
        ),
    ]
