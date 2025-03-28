import fitz  
import spacy
from gensim.corpora.dictionary import Dictionary
from gensim.models.ldamodel import LdaModel
from nltk.corpus import stopwords
import string
import re
from PIL import Image, ImageFilter
import io


def pdf_icerik_anonimlestir(pdf_dosya, cikti_dosya):
    
    try:
        doc = fitz.open(pdf_dosya)
    
        # İngilizce dil modeli yükle (uyumlu sürüm)
        nlp = spacy.load("en_core_web_lg")  # model adında alt çizgi kullanın
        
        # E-posta regex deseni
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        
        for sayfa in doc:
            metin_dict = sayfa.get_text("dict")
            metin = sayfa.get_text("text")  
            
            # REFERENCES bölümü varsa atla
            if "REFERENCES" in metin.upper():
                print("REFERENCES section found, skipping.")
                continue 
            
            
            nlp_doc = nlp(metin)
            yazar_isimleri = [ent.text for ent in nlp_doc.ents if ent.label_ == "PERSON"]
            
            bulunan_email = re.findall(email_pattern, metin)
            
            # Her bloğu kontrol et
            for block in metin_dict["blocks"]:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"]  # Metni al
                            bbox = span["bbox"]  # Koordinatları al

                            # Yazarlar ve e-postaları anonimleştir
                            for yazar in yazar_isimleri:
                                text = text.replace(yazar, "ANONYMIZED")
                            
                            for email in bulunan_email:
                                text = text.replace(email, "anonymous@example.com")
                            
                            if any(yazar in span["text"] for yazar in yazar_isimleri) or any(email in span["text"] for email in bulunan_email):
                                sayfa.draw_rect(bbox, color=(1, 1, 1), fill=(1, 1, 1))  # Beyaz dikdörtgen
                                sayfa.insert_text((bbox[0], bbox[1]), text, fontsize=span["size"], color=(0, 0, 0))

            # Resimleri kontrol et ve yalnızca yazarla ilişkili resimleri bulanıklaştır
            # images = sayfa.get_images(full=True)  # Sayfadaki tüm resimleri al
            
            # # Eğer sayfada resimler varsa, bunları işleyelim
            # if images:
            #     for img_data in images:
            #         xref = img_data[0]  # Xref numarasını al
                    
            #         # Resim verilerini çıkart
            #         metadata = doc.extract_image(xref)
            #         img_bytes = metadata["image"]  # Resmin byte verisini al
                    
            #         # Resmi Pillow ile aç
            #         img = Image.open(io.BytesIO(img_bytes))
                    
            #         # Resmi bulanıklaştır
            #         blurred_img = img.filter(ImageFilter.GaussianBlur(5))  # Burada 5, bulanıklık seviyesini belirler
                    
            #         # Bulanık resmi tekrar byte veri olarak kaydet
            #         img_byte_arr = io.BytesIO()
            #         blurred_img.save(img_byte_arr, format="PNG")
            #         img_byte_arr.seek(0)
                    
            #         # Bulanık resmi PDF'ye yerleştir
            #         sayfa.insert_image(sayfa.rect, stream=img_byte_arr.read())
                    
            # else:
            #     print(f"Sayfada resim bulunamadı, anonimleştirme sadece metinle devam ediyor.")

        # Anonimleştirilmiş PDF'yi kaydet
        doc.save(cikti_dosya)
        doc.close()
        print(f"Anonymized PDF saved as {cikti_dosya}.")
    except Exception as e:
        print(f"Error occurred during PDF anonymization: {e}")



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






