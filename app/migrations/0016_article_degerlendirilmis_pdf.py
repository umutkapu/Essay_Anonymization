# Generated by Django 5.1.7 on 2025-03-28 12:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0015_alter_article_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='degerlendirilmis_pdf',
            field=models.FileField(blank=True, null=True, upload_to='uploads/'),
        ),
    ]
