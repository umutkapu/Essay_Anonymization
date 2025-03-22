import fitz  
import spacy
from collections import Counter
from gensim.corpora.dictionary import Dictionary
from gensim.models.ldamodel import LdaModel
import nltk
from nltk.corpus import stopwords
import string
import re

nlp = spacy.load("en_core_web_sm")

def pdf_metni_cikart(pdf_dosya):
    try:
        # PDF dosyasını aç
        doc = fitz.open(pdf_dosya)
        anonim_metinler = []
        
        # Her sayfanın metnini çıkar ve anonimleştir
        for sayfa in doc:
            metin = sayfa.get_text("text")
            anonim_metin = anonimlestir(metin)
            anonim_metinler.append(anonim_metin)
        
        # PDF dosyasını kapat
        doc.close()
        return anonim_metinler
    except Exception as e:
        print(f"PDF metni çıkarılamadı: {e}")
        return []

def anonimlestir(metin):
    metin = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '******', metin)
    
    metin = re.sub(r'\b[A-Z][a-z]+\s[A-Z][a-z]+\b', '******', metin)
    
    metin = re.sub(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', '******', metin)
    
    return metin

def anonim_metin_pdf_kaydet(metinler, dosya_adi):
    # Yeni bir PDF belgesi oluştur
    pdf = fitz.open()
    
    # Her sayfa için metni ekle
    for metin in metinler:
        # Yeni bir sayfa ekle
        sayfa = pdf.new_page()
        
        # Metni sayfaya ekle
        sayfa.insert_text((72, 72), metin)  # (72, 72) başlangıç koordinatlarıdır
    
    # PDF dosyasını kaydet
    pdf.save(dosya_adi)
    pdf.close()
    print(f"Anonimleştirilmiş metin {dosya_adi} dosyasına kaydedildi.")

nltk.download('stopwords')


def konu_modelleme(metin):
    
    stop_words = set(stopwords.words('english'))

    if isinstance(metin, list):
        metin = " ".join(metin)
    
    # Metni temizliyoruz
    kelimeler = [
        [kelime.lower().strip(string.punctuation) for kelime in cumle.split() if kelime.lower() not in stop_words]
        for cumle in metin.split('.')
    ]
    
    # Sözlük ve kelime frekansları
    dictionary = Dictionary(kelimeler)
    corpus = [dictionary.doc2bow(kelime) for kelime in kelimeler]
    
    # LDA modeli
    lda = LdaModel(corpus, num_topics=1, id2word=dictionary, passes=15)
    konular = lda.print_topics(num_words=5)
    temiz_konular = []
    for konu in konular:
        kelimeler = [kelime.split('*')[1].strip().strip('"') for kelime in konu[1].split('+')]
        temiz_konular.append(", ".join(kelimeler))
    
    return temiz_konular[0]






