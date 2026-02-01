# Generated migration: thêm trường urgency (mức độ) cho Notification

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0011_add_fund_transaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="urgency",
            field=models.CharField(blank=True, default="normal", max_length=20),
        ),
    ]
