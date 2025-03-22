# forms.py
from django import forms
from .models import Article

class PdfForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ['file' , 'author_email' ]

