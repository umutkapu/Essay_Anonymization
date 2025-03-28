from django.db import models
from django.contrib.auth.models import AbstractUser
import random , string
from django.db.models.signals import post_save
from django.dispatch import receiver

def generate_tracking_number():
    while True:
        # Takip numarasını rastgele oluştur
        tracking_number = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
        
        # Veritabanında bu takip numarasının daha önce var olup olmadığını kontrol et
        if not Article.objects.filter(tracking_number=tracking_number).exists():
            return tracking_number
        

class Reviewer(models.Model):
    name = models.CharField(max_length=255)
    alan = models.CharField(max_length=255 , null=True , blank=True)  
    
    def __str__(self):
        return f"Review for {self.article.title} by {self.reviewer.username}"   

# models.py
class Article(models.Model):
    file = models.FileField(upload_to='uploads/')
    author_email = models.EmailField()
    upload_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=255, default="Anonimleştirilmemiş")
    konu = models.TextField(blank=True, null=True)
    hakem = models.ForeignKey("Reviewer", on_delete=models.SET_NULL, null=True, blank=True)
    tracking_number = models.CharField(max_length=100, unique=True)
    anon_pdf = models.FileField(upload_to='uploads/', null=True, blank=True)  # 🟢 Burada tutulacak
    degerlendirilmis_pdf = models.FileField(upload_to='uploads/', null=True, blank=True)


    def __str__(self): 
        return self.title
    
@receiver(post_save, sender=Article)
def create_log_on_article_upload(sender, instance, created, **kwargs):
    if created:  # Eğer yeni bir makale oluşturuluyorsa
        Log.objects.create(
            article=instance,
            action=f"Article '{instance.file}' uploaded", 
            timestamp=instance.upload_date
        )

class Editor(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()

# models.py
class Message(models.Model):
    sender_email = models.EmailField()
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.sender_email} - {self.timestamp}"

class Log(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.article.title} - {self.action} at {self.timestamp}"
    
    
class Review(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    reviewer = models.ForeignKey(Reviewer, on_delete=models.CASCADE)
    comment = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    result = models.TextField()
    anon_pdf = models.FileField(upload_to='uploads/')

    def __str__(self):
        return f"Review for {self.article.title} by {self.reviewer.username}"
