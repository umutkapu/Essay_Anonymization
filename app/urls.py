from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static 

urlpatterns = [
    path('' , views.uploadArticle),
    path('makale_sistemi/' , views.uploadArticle),
    path('editor/' , views.editor),
    path('editor/<int:id>' , views.articledetails , name = "articledetail"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)