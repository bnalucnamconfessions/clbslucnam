# Migration: Thêm ngày mua cho sách
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0024_add_book_code")]

    operations = [
        migrations.AddField(
            model_name="book",
            name="purchase_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]
