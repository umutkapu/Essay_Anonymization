import json
import fitz  
import spacy
from gensim.corpora.dictionary import Dictionary
from gensim.models.ldamodel import LdaModel
from nltk.corpus import stopwords
import string
import re
from PIL import Image
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io
from reportlab.lib.pagesizes import A4
import os
from django.conf import settings
import cv2
import numpy as np
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image


face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

pdfmetrics.registerFont(TTFont("DejaVu", os.path.join(settings.BASE_DIR, "fonts/DejaVuSans.ttf"))) # Fontu kaydet

nlp = spacy.load("en_core_web_trf")

def pdf_icerik_ve_resim_anonimlestir(pdf_dosya, cikti_dosya):
    try:
        doc = fitz.open(pdf_dosya)
        sansur_log = []

        # İlk 2 sayfadan yazar isimlerini çıkart
        yazar_isimleri = set()
        for sayfa_num in range(min(2, len(doc))):
            metin = doc[sayfa_num].get_text("text")
            doc_nlp = nlp(metin)
            for ent in doc_nlp.ents:
                if ent.label_ == "PERSON":
                    yazar_isimleri.add(ent.text.strip())

        for sayfa_num, sayfa in enumerate(doc):
            metin_dict = sayfa.get_text("dict")
            metin = sayfa.get_text("text")
            konu = konu_modelleme(metin)

            is_references_page = "REFERENCES" in metin.upper()

            for block in metin_dict.get("blocks", []):
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        text = span["text"]
                        bbox = span["bbox"]
                        font_size = span.get("size", 11)
                        rect = fitz.Rect(bbox)
                        matched = False

                        for yazar in yazar_isimleri:
                            if yazar in text:
                                matched = True
                                text = text.replace(yazar, "ANONIM")
                                sansur_log.append({
                                    "type": "text",
                                    "page": sayfa_num,
                                    "bbox": list(bbox),
                                    "original": yazar,
                                    "replaced_with": "ANONIM",
                                    "font_size": font_size
                                })

                        if is_references_page:
                            doc_nlp = nlp(text)
                            for ent in doc_nlp.ents:
                                if ent.label_ == "PERSON" and ent.text.strip() not in yazar_isimleri:
                                    matched = True
                                    text = text.replace(ent.text, "ANONIM")
                                    sansur_log.append({
                                        "type": "text",
                                        "page": sayfa_num,
                                        "bbox": list(bbox),
                                        "original": ent.text.strip(),
                                        "replaced_with": "ANONIM",
                                        "font_size": font_size
                                    })

                        if matched:
                            sayfa.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))
                            sayfa.insert_text((bbox[0], bbox[1]), text, fontsize=font_size, color=(0, 0, 0))

            # 🔲 Sadece son sayfadaki yüze sahip resimleri sansürle
            if sayfa_num == len(doc) - 1:
                for img_index, img in enumerate(sayfa.get_images(full=True)):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]

                    np_arr = np.frombuffer(image_bytes, np.uint8)
                    img_np = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
                    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

                    if len(faces) > 0:
                        bbox = sayfa.get_image_bbox(img)
                        if bbox:
                            sansur_log.append({
                                "type": "face_image",
                                "page": sayfa_num,
                                "bbox": list(bbox)
                            })
                            sayfa.draw_rect(bbox, color=(0, 0, 0), fill=(0, 0, 0))

        doc.save(cikti_dosya)
        doc.close()

        log_yolu = cikti_dosya.replace(".pdf", "_anonlog.json")
        with open(log_yolu, "w", encoding="utf-8") as log_file:
            json.dump(sansur_log, log_file)

        print(f"✅ Anonim PDF ve log dosyası oluşturuldu: {log_yolu}")
        return konu

    except Exception as e:
        print(f"❌ Anonimleştirme hatası: {e}")



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

def add_review_to_pdf(input_pdf_path, comment, result, output_pdf_path):
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=A4)
    can.setFont("Helvetica", 12)
    can.drawString(50, 800, "📋 Hakem Değerlendirmesi")
    can.drawString(50, 770, f"Sonuç: {result}")
    can.drawString(50, 740, f"Yorum: {comment}")
    can.save()

    packet.seek(0)
    new_pdf = PdfReader(packet)
    writer.add_page(new_pdf.pages[0])

    with open(output_pdf_path, "wb") as f:
        writer.write(f)
        
def restore_and_append_review(original_pdf_path, anon_log_path, comment, result, output_pdf_path):
    import fitz
    import os
    import json

    try:
        doc = fitz.open(original_pdf_path)

        if not os.path.exists(anon_log_path):
            raise FileNotFoundError(f"{anon_log_path} bulunamadı.")

        with open(anon_log_path, 'r', encoding='utf-8') as f:
            anon_data = json.load(f)

        restored_positions = set()

        for entry in anon_data:
            if not isinstance(entry, dict):
                continue

            if entry.get("type") != "text":
                continue

            page_number = entry.get("page")
            bbox = tuple(entry.get("bbox"))
            original_text = entry.get("original")
            font_size = entry.get("font_size", 11)  # ❗ Font boyutu yoksa varsayılan 11 kullan

            if page_number is None or bbox is None or original_text is None:
                continue

            key = (page_number, bbox)
            if key in restored_positions:
                continue

            try:
                page = doc.load_page(page_number)
            except Exception:
                continue

            rect = fitz.Rect(*bbox)
            page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))
            page.insert_text((rect.x0, rect.y0), original_text, fontsize=font_size, color=(0, 0, 0))

            restored_positions.add(key)

        temp_restored_path = output_pdf_path.replace(".pdf", "_temp_restored.pdf")
        doc.save(temp_restored_path)
        doc.close()

        append_review_page(temp_restored_path, comment, result, output_pdf_path)

        if os.path.exists(temp_restored_path):
            os.remove(temp_restored_path)

        print(f"✅ PDF başarıyla geri döndürüldü ve değerlendirme eklendi: {output_pdf_path}")

    except Exception as e:
        print(f"❌ restore_and_append_review hatası: {e}")
        raise e

    
def append_review_page(input_pdf_path, comment, result, output_pdf_path):
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=A4)
    
    emoji_path= os.path.join(settings.BASE_DIR, "assets/notes.png")
    can.drawImage(emoji_path, 40, 800, width=14, height=14)

    # Türkçe karakter destekleyen font
    can.setFont("DejaVu", 14)
    can.setFillColorRGB(0.8,0.2,0.2) #Koyu kırmızı renk
    can.drawString(50, 800, "  Hakem Değerlendirmesi")

    can.setFont("DejaVu", 12)
    can.setFillColorRGB(0, 0, 0)
    can.drawString(50, 770, f"Sonuç: {result}")
    can.setFillColorRGB(0, 0, 0)
    can.drawString(50, 740, "Yorumlar:")

    lines = comment.split("\n")
    y = 720
    for line in lines:
        if y < 100:
            break
        can.drawString(60, y, line)
        y -= 20

    can.save()
    packet.seek(0)
    new_pdf = PdfReader(packet)
    writer.add_page(new_pdf.pages[0])

    with open(output_pdf_path, "wb") as f:
        writer.write(f)