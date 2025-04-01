from django.shortcuts import render , redirect
from .models import *
from .forms import PdfForm
from .utils import  pdf_icerik_ve_resim_anonimlestir,konu_modelleme,add_review_to_pdf,restore_and_append_review 
from django.views.decorators.csrf import csrf_exempt
import json
from django.http import JsonResponse
import os
from django.conf import settings
from django.db import transaction
import uuid
from django.core.mail import EmailMessage

@csrf_exempt
def uploadArticle(request):
    if request.method == "POST":
        form = PdfForm(request.POST, request.FILES)
        if form.is_valid():
            article = form.save(commit=False)

            # 🔁 Benzersiz tracking number üret
            while True:
                tracking = str(uuid.uuid4())[:8]  # örnek: "a1b2c3d4"
                if not Article.objects.filter(tracking_number=tracking).exists():
                    article.tracking_number = tracking
                    break

            article.save()
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
        article.anon_pdf.name = f"uploads/anonim_{article.id}.pdf"  # ✅ Güncelleme burada
        article.save()

        return JsonResponse({"success": True, "message": "Anonimleştirildi"})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

    
@csrf_exempt
def get_reviewers_by_topic(request, article_id):
    try:
        article = Article.objects.get(id=article_id)
        konu_kelimeleri = article.konu.lower().split(",")  # LDA çıktısı: "word1, word2, word3"
        konu_kelimeleri = [k.strip() for k in konu_kelimeleri]

        reviewers = Reviewer.objects.all()
        uygun_hakemler = []

        for reviewer in reviewers:
            if reviewer.alan:
                alan_kelimeleri = reviewer.alan.lower().split(",")
                alan_kelimeleri = [a.strip() for a in alan_kelimeleri]
                if any(konu in alan_kelimeleri for konu in konu_kelimeleri):
                    uygun_hakemler.append({
                        "id": reviewer.id,
                        "name": reviewer.name,
                        "alan": reviewer.alan,
                    })

        return JsonResponse(uygun_hakemler, safe=False)
    
    except Article.DoesNotExist:
        return JsonResponse({"error": "Makale bulunamadı."}, status=404)
    
@csrf_exempt
def save_review(request):
    if request.method == 'POST':
        try:
            # 🔍 Gelen JSON veriyi yükle
            data = json.loads(request.body)

            if not isinstance(data, dict):
                return JsonResponse({"success": False, "message": "Geçersiz veri formatı."}, status=400)

            # 📥 Verileri al
            article_id = data.get("article_id")
            reviewer_id = data.get("reviewer_id")
            comment = data.get("comment")
            result = data.get("result")

            if not all([article_id, reviewer_id, comment, result]):
                return JsonResponse({"success": False, "message": "Eksik alanlar var."}, status=400)

            # 🎯 İlgili veritabanı nesnelerini al
            article = Article.objects.get(id=article_id)
            reviewer = Reviewer.objects.get(id=reviewer_id)

            # 📄 Dosya yollarını hazırla
            original_pdf_path = article.file.path
            anon_log_path = os.path.join(settings.MEDIA_ROOT, f"uploads/anonim_{article.id}_anonlog.json")


            final_pdf_filename = f"degerlendirilmis_{article.id}.pdf"
            final_pdf_path = os.path.join(settings.MEDIA_ROOT, "uploads", final_pdf_filename)

            # 🛠️ PDF'i geri döndür ve sonuna hakem değerlendirmesini ekle
            restore_and_append_review(
                original_pdf_path=original_pdf_path,
                anon_log_path=anon_log_path,
                comment=comment,
                result=result,
                output_pdf_path=final_pdf_path
            )

            # 📝 Article güncelle
            article.status = "Değerlendirildi"
            article.degerlendirilmis_pdf.name = f"uploads/{final_pdf_filename}"
            article.save()

            # ✅ Review oluştur
            Review.objects.create(
                article=article,
                reviewer=reviewer,
                comment=comment,
                result=result,
                anon_pdf=article.anon_pdf
            )

            return JsonResponse({"success": True})

        except Exception as e:
            print("❌ Hata oluştu:", e)
            return JsonResponse({"success": False, "message": str(e)}, status=500)

    return JsonResponse({"success": False, "message": "Yalnızca POST isteği desteklenir."}, status=405)

@csrf_exempt
def send_reviewed_to_author(request):
    if request.method == "POST":
        try:
            import json
            data = json.loads(request.body)
            print("📥 Gelen veri:", data)

            article_id = data.get("article_id")
            print("🆔 Article ID:", article_id)

            article = Article.objects.get(id=article_id)
            print("📄 Article bulundu:", article.file.name.split('/')[-1])

            if not article.degerlendirilmis_pdf:
                print("🚫 PDF bulunamadı.")
                return JsonResponse({"success": False, "message": "Değerlendirilmiş PDF bulunamadı."}, status=400)

            file_path = os.path.join(article.degerlendirilmis_pdf.path)
            print("📂 Dosya yolu:", file_path)

            if not os.path.exists(file_path):
                print("🚫 Dosya sistemde yok.")
                return JsonResponse({"success": False, "message": "Dosya mevcut değil."}, status=404)

            email = EmailMessage(
                subject="Makale Değerlendirme Sonucu",
                body="Sayın yazar, makalenizin değerlendirmesi tamamlanmış ve tarafınıza iletilmiştir. Ekten inceleyebilirsiniz.",
                to=[article.author_email]
            )
            email.attach_file(file_path)
            email.send()
            print("✅ Mail gönderildi!")

            article.status = "Yayında"
            article.save()

            return JsonResponse({"success": True})

        except Exception as e:
            print("❌ Sunucu hatası:", str(e))  # 🧨 En kritik satır
            return JsonResponse({"success": False, "message": str(e)}, status=500)

    return JsonResponse({"success": False, "message": "Sadece POST destekleniyor."}, status=400)



@csrf_exempt
def get_reviewer_list(request):
    reviewers = Reviewer.objects.all()
    data = [
        {"id": reviewer.id, "name": reviewer.name}
        for reviewer in reviewers
    ]
    return JsonResponse(data, safe=False)

@csrf_exempt
def get_review_for_article(request, article_id):
    try:
        review = Review.objects.get(article_id=article_id)
        return JsonResponse({
            "reviewer": review.reviewer.name,
            "comment": review.comment,
            "result": review.result,
            "timestamp": review.timestamp.strftime("%Y-%m-%d %H:%M"),
        })
    except Review.DoesNotExist:
        return JsonResponse({"message": "Henüz değerlendirme yapılmamış."}, status=404)



@csrf_exempt
def get_assigned_essays(request):
    articles = Article.objects.filter(status="Yönlendirildi")
    data = []

    for article in articles:
        data.append({
            "id": article.id,
            "title": article.file.name.split('/')[-1],
            "reviewerId": article.hakem.id if article.hakem else None,
            "anon_pdf": article.anon_pdf.url if article.anon_pdf else "",
        })

    return JsonResponse(data, safe=False)




@csrf_exempt
def assign_reviewer(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            print("📥 Gelen Veri:", data)

            article_id = data.get("article_id")
            reviewer_name = data.get("reviewer_name")

            article = Article.objects.get(id=article_id)
            reviewer = Reviewer.objects.get(name=reviewer_name)

            article.hakem = reviewer
            article.status = "Yönlendirildi"
            article.save()

            return JsonResponse({"success": True})
        except Exception as e:
            print("💥 Atama Hatası:", e)
            return JsonResponse({"success": False, "error": str(e)}, status=500)
    else:
        return JsonResponse({"success": False, "error": "Sadece POST istekleri desteklenir"}, status=400)



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
            "degerlendirilmis_pdf": article.degerlendirilmis_pdf.name if article.degerlendirilmis_pdf else None,
            "anon_pdf": article.anon_pdf.url if article.anon_pdf else None,
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

            # Değerlendirme varsa al
            review = Review.objects.filter(article=article).first()
            review_data = None
            if review:
                review_data = {
                    "comment": review.comment,
                    "result": review.result,
                    "timestamp": review.timestamp.strftime("%Y-%m-%d %H:%M"),
                    "reviewer_name": review.reviewer.name,
                }

            data = {
                "title": article.file.name.split('/')[-1],
                "status": article.status,
                "upload_date": article.upload_date.strftime("%Y-%m-%d %H:%M"),
                "konu": article.konu or "Henüz belirlenmedi",
                "review": review_data
            }
            return JsonResponse(data)
        except Article.DoesNotExist:
            return JsonResponse({"error": "Makale bulunamadı."}, status=404)





