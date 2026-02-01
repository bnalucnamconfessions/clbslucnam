# Generated migration
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0008_split_member_roles")]

    operations = [
        migrations.AddField(
            model_name="account",
            name="password_hash",
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
    ]
