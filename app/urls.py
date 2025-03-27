from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static 

urlpatterns = [
    path('' , views.uploadArticle),
    path('makale_sistemi/' , views.uploadArticle),
    path('editor/' , views.editor),
    path('editor/<int:id>' , views.articledetails , name = "articledetail"),
    path('send_message/', views.send_message, name='send_message'),
    path('get-messages/', views.get_messages, name='get_messages'),
    path('get-articles/', views.get_articles, name='get_articles'),
    path('sorgula/', views.get_article_by_tracking, name='get_article_by_tracking'),
    path("anonimlestir/<int:id>/", views.anonimlestir_article, name="anonimlestir_article")
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)