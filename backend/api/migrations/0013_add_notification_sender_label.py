# Generated migration: thêm trường sender_label (người gửi) cho Notification

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0012_add_notification_urgency"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="sender_label",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
