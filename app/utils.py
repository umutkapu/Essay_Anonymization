import fitz  
import spacy
from collections import Counter
from gensim.corpora.dictionary import Dictionary
from gensim.models.ldamodel import LdaModel
import nltk
from nltk.corpus import stopwords
import string
import re
import cv2 , numpy as np
from PIL import Image
import io

nlp = spacy.load("en_core_web_sm")

def pdf_icerik_ve_resim_anonimlestir(pdf_dosya, cikti_dosya):
    try:
        # PDF dosyasını aç
        doc = fitz.open(pdf_dosya)
        
        # Her sayfanın içeriğini düzenle
        for sayfa in doc:
            metin = sayfa.get_text("dict")  # Metni ve koordinatları al
            yazar_adi_koordinatlari = []
            
            # Yazar isimlerini bul ve koordinatlarını al
            for block in metin["blocks"]:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            
                            text = span["text"]
                            doc_nlp = nlp(text)
                            for ent in doc_nlp.ents:
                                if ent.label_ == "PERSON":  # Yazar isimleri genellikle "PERSON" olarak etiketlenir
                                    yazar_adi_koordinatlari.append(span["bbox"])  # Koordinatları kaydet
            
            # Yazar isimlerinin üzerine siyah şerit çek
            for bbox in yazar_adi_koordinatlari:
                sayfa.draw_rect(bbox, color=(0, 0, 0), fill=(0, 0, 0))  # Siyah şerit
                
            
            # Resimlerin üzerine siyah şerit çek
            # for img in sayfa.get_images(full=True):
            #     xref = img[0]
            #     bbox = sayfa.get_image_bbox(xref)
            #     sayfa.draw_rect(bbox, color=(0, 0, 0), fill=(0, 0, 0))  # Siyah şerit
                
      
        # Anonimleştirilmiş PDF'yi kaydet
        doc.save(cikti_dosya)
        doc.close()
        print(f"Anonimleştirilmiş PDF {cikti_dosya} dosyasına kaydedildi.")
    except Exception as e:
        print(f"PDF içeriği ve resimleri anonimleştirme sırasında hata oluştu: {e}")


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






