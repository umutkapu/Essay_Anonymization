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
    path("anonimlestir/<int:id>/", views.anonimlestir_article, name="anonimlestir_article"),
    path("get-reviewers/<int:article_id>/", views.get_reviewers_by_topic),
    path('assign-reviewer/', views.assign_reviewer),
    path('save-review/', views.save_review),
    path("get-reviewer-list/", views.get_reviewer_list, name="get-reviewer-list"),
    path("get-assigned-essays/", views.get_assigned_essays, name="get-assigned-essays"),
    path('get-review-for-article/<int:article_id>/', views.get_review_for_article, name='get_review_for_article'),
    path('send-reviewed-to-author/', views.send_reviewed_to_author, name='send_reviewed_to_author'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)