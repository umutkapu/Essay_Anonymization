import fitz  
import spacy
from gensim.corpora.dictionary import Dictionary
from gensim.models.ldamodel import LdaModel
from nltk.corpus import stopwords
import string
import re
from PIL import Image



nlp = spacy.load("en_core_web_sm")

def pdf_icerik_ve_resim_anonimlestir(pdf_dosya, cikti_dosya):
    
    try:
        # PDF dosyasını aç
        doc = fitz.open(pdf_dosya)
        
        # Her sayfanın içeriğini düzenle
        for sayfa in doc:
            # Sayfa metnini ve koordinatlarını al
            metin_dict = sayfa.get_text("dict")
            metin = sayfa.get_text("text")  
            konu = konu_modelleme(metin)

            # "REFERENCES" bölümünü tespit et
            if "REFERENCES" in metin.upper():
                print("REFERENCES bölümü bulundu, bu sayfa anonimleştirme işleminden hariç tutulacak.")
                continue  # Bu sayfayı atla
            
            # Her bloğu kontrol et
            for block in metin_dict["blocks"]:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"]  # Metni al
                            bbox = span["bbox"]  # Metnin koordinatlarını al
                            
                            # Yazar isimlerini tespit etmek için regex
                            yazar_pattern = r"\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\b" 
                            bulunan_yazarlar = re.findall(yazar_pattern, text)
                            
                            # Yazar isimlerini "Anonim" ile değiştir
                            for yazar in bulunan_yazarlar:
                                text = text.replace(yazar, "ANONIM")
                            
                            # Metnin bulunduğu alanı beyaz bir dikdörtgenle kapat
                            sayfa.draw_rect(bbox, color=(1, 1, 1), fill=(1, 1, 1))  # Beyaz dikdörtgen
                            
                            # Güncellenmiş metni aynı koordinatlara yaz
                            sayfa.insert_text((bbox[0], bbox[1]), text, fontsize=span["size"], color=(0, 0, 0))
            
            for img in sayfa.get_images(full=True):
                    name = img
                    bbox = sayfa.get_image_bbox(name = name)
                    if bbox:  
                        sayfa.draw_rect(bbox, color=(0, 0, 0), fill=(0, 0, 0))  # Siyah şerit
                
        
        # Anonimleştirilmiş PDF'yi kaydet
        doc.save(cikti_dosya)
        doc.close()
        print(f"Anonimleştirilmiş PDF {cikti_dosya} olarak kaydedildi.")
        return konu
    except Exception as e:
        print(f"PDF yazar anonimleştirme sırasında hata oluştu: {e}") 


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