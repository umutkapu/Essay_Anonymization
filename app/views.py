from django.shortcuts import render , redirect
from .models import *
from .forms import PdfForm
from .utils import pdf_metni_cikart, konu_modelleme ,anonim_metin_pdf_kaydet


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


def articledetails(request , id):
    article = Article.objects.get(id=id)
    pdf_dosya = article.file.path

    
    # PDF metnini çıkar ve anonimleştir 
    anonim_metin = pdf_metni_cikart(pdf_dosya)
    
    # Anonimleştirilmiş metni PDF olarak kaydet
    anonim_pdf_yolu = f"media/uploads/anonim_{article.id}.pdf"
    anonim_metin_pdf_kaydet(anonim_metin, anonim_pdf_yolu)
    
    # Konu modelleme işlemi
    konu = konu_modelleme(anonim_metin)
    Article.objects.filter(id=id).update(konu=konu)
    
    return render(request, "article_detail.html", {"article": article, "anonim_pdf_yolu": anonim_pdf_yolu})



