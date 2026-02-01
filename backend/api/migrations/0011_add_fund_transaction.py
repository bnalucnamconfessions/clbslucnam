# Generated migration for FundTransaction (Thu chi quỹ)

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0010_add_password_reset_token"),
    ]

    operations = [
        migrations.CreateModel(
            name="FundTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("transaction_date", models.DateField()),
                ("content", models.CharField(max_length=500)),
                ("type", models.CharField(choices=[("income", "Thu"), ("expense", "Chi")], max_length=20)),
                ("amount", models.DecimalField(decimal_places=0, max_digits=14)),
                ("requester_name", models.CharField(max_length=255)),
                ("status", models.CharField(choices=[("pending", "Chờ CN duyệt"), ("confirmed", "Đã xác nhận")], default="pending", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("requester_account", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="fund_requests", to="api.Account")),
            ],
            options={
                "db_table": "fund_transactions",
                "ordering": ["-transaction_date", "-id"],
            },
        ),
    ]
