from django.shortcuts import render , redirect
from .models import *
from .forms import PdfForm
from .utils import  pdf_icerik_ve_resim_anonimlestir,konu_modelleme 
from django.views.decorators.csrf import csrf_exempt
import json
from django.http import JsonResponse
import os
from django.conf import settings

@csrf_exempt
def uploadArticle(request):

    form = PdfForm(request.POST, request.FILES)
    if form.is_valid():
        pdf_dosya = form.save()
        print(pdf_dosya.file.path) 
        return redirect("/editor")
    else:
        print(form.errors) 

    return render(request, "index.html") 


def editor(request):
    articles = Article.objects.all()  
    return render(request, "editor.html", {"articles": articles})

@csrf_exempt
def articledetails(request , id):
    article = Article.objects.get(id=id)
    reviewers = Reviewer.objects.all()
    pdf_dosya = article.file.path

    anonim_pdf_yolu = f"media/uploads/anonim_{article.id}.pdf"
    save_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
    file_path = os.path.join(save_dir, f"anonim_{article.id}.pdf")

    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    # PDF dosyasını kopyala
    with open(pdf_dosya, 'rb') as source, open(file_path, 'wb') as dest:
        dest.write(source.read())

    konu = pdf_icerik_ve_resim_anonimlestir(pdf_dosya, anonim_pdf_yolu)

    article.konu = konu

    if request.method == "POST":
        reviewer_id = request.POST.get("reviewers")
        
        try:
            reviewer_id = int(reviewer_id)
            reviewer = Reviewer.objects.get(id=reviewer_id)
            
            article.hakem = reviewer
            review = Review.objects.create(
                article=article,
                reviewer=reviewer,
                anon_pdf=anonim_pdf_yolu
            )
            review.save()
            article.save()
            
            return redirect("/editor/")  # 🟢 BAŞARILI OLUNCA /editor SAYFASINA GİT
            
        except (ValueError, Reviewer.DoesNotExist):
            return render(request, "article_detail.html", {
                "article": article,
                "anonim_pdf_yolu": anonim_pdf_yolu,
                "reviewers": reviewers,
                "error": "Geçersiz veya bulunamayan reviewer ID!"
            })

    return render(request, "article_detail.html", {
        "article": article,
        "anonim_pdf_yolu": anonim_pdf_yolu,
        "reviewers": reviewers
    })
    
    
@csrf_exempt
def anonimlestir_article(request, id):
    try:
        article = Article.objects.get(id=id)
        pdf_yolu = article.file.path
        anonim_yolu = f"media/uploads/anonim_{article.id}.pdf"
        konu = pdf_icerik_ve_resim_anonimlestir(pdf_yolu, anonim_yolu)

        article.konu = konu
        article.status = "Anonimleştirilmiş"
        article.save()

        return JsonResponse({"success": True, "message": "Anonimleştirildi"})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@csrf_exempt
def send_message(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("GELEN DATA:", data)  # 🔍 Bu logu mutlaka ekle!

            email = data.get("email")
            content = data.get("message")

            if not email or not content:
                return JsonResponse({"status": "fail", "message": "Alanlar boş olamaz"}, status=400)

            # Veritabanına kaydet
            msg = Message.objects.create(sender_email=email, content=content)
            print("KAYIT EDİLDİ:", msg.id)

            return JsonResponse({"status": "success", "message": "Mesaj başarıyla kaydedildi"})
        except Exception as e:
            print("💥 BACKEND HATASI:", str(e))  # Hata logu
            return JsonResponse({"status": "fail", "message": str(e)}, status=500)
    return JsonResponse({"status": "fail", "message": "Yalnızca POST isteği desteklenir"}, status=400)

@csrf_exempt
def get_messages(request):
    messages = Message.objects.all().order_by('-timestamp')
    data = [
        {
            "id": msg.id,
            "sender_email": msg.sender_email,
            "content": msg.content,
            "timestamp": msg.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for msg in messages
    ]
    return JsonResponse(data, safe=False)

@csrf_exempt
def get_articles(request):
    articles = Article.objects.all().order_by('-upload_date')
    data = [
        {
            "id": article.id,
            "title": article.file.name.split('/')[-1],  # Dosya adını başlık gibi kullan
            "author": article.author_email,
            "date": article.upload_date.strftime("%Y-%m-%d %H:%M"),
            "status": article.status
        }
        for article in articles
    ]
    return JsonResponse(data, safe=False)

@csrf_exempt
def get_article_by_tracking(request):
    if request.method == "GET":
        email = request.GET.get("email")
        tracking = request.GET.get("tracking")

        try:
            article = Article.objects.get(author_email=email, tracking_number=tracking)
            data = {
                "title": article.file.name.split('/')[-1],
                "status": article.status,
                "upload_date": article.upload_date.strftime("%Y-%m-%d %H:%M"),
                "konu": article.konu or "Henüz belirlenmedi"
            }
            return JsonResponse(data)
        except Article.DoesNotExist:
            return JsonResponse({"error": "Makale bulunamadı."}, status=404)




