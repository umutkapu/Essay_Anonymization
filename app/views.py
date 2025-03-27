from django.shortcuts import render , redirect
from .models import *
from .forms import PdfForm
from .utils import *
import os
from django.conf import settings


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
    reviewers = Reviewer.objects.all()
    pdf_dosya = article.file.path

    anonim_pdf_yolu = f"media/uploads/anonim_{article.id}.pdf"
    save_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
    file_path = os.path.join(save_dir,f"anonim_{article.id}.pdf" )
    with open(file_path, 'w') as f:
        f.write(pdf_dosya)
    konu = pdf_icerik_ve_resim_anonimlestir(pdf_dosya, anonim_pdf_yolu)

    article.konu = konu
    

    if request.method == "POST":
        reviewer_id = request.POST.get("reviewers")

        try:
            reviewer = Reviewer.objects.get(id=reviewer_id)
            article.hakem = reviewer
            review = Review.objects.create(article=article, reviewer=reviewer , anon_pdf = anonim_pdf_yolu)
            review.save()
            article.save() 

            return redirect("/editor")
        
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


def reviewer(request):
    reviewers = Reviewer.objects.all()
    return render(request, "reviewer.html", {"reviewers": reviewers})

def reviewerdetail(request , id):
    reviewer = Reviewer.objects.get(id=id)
    reviews = Review.objects.filter(reviewer=reviewer)
    return render(request, "reviewer_detail.html", {"reviewer": reviewer, "reviews": reviews}) 
    
    







