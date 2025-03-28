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

nlp = spacy.load("en_core_web_sm")

def pdf_icerik_ve_resim_anonimlestir(pdf_dosya, cikti_dosya):
    try:
        doc = fitz.open(pdf_dosya)
        sansur_log = []

        for sayfa_num, sayfa in enumerate(doc):
            metin_dict = sayfa.get_text("dict")
            metin = sayfa.get_text("text")  
            konu = konu_modelleme(metin)

            if "REFERENCES" in metin.upper():
                continue
            
            for block in metin_dict["blocks"]:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"]
                            bbox = span["bbox"]
                            yazar_pattern = r"\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\b" 
                            bulunan_yazarlar = re.findall(yazar_pattern, text)
                            
                            for yazar in bulunan_yazarlar:
                                sansur_log.append({
                                    "type": "text",
                                    "page": sayfa_num,
                                    "bbox": bbox,
                                    "original": yazar
                                })
                                text = text.replace(yazar, "ANONIM")
                            
                            sayfa.draw_rect(bbox, color=(1, 1, 1), fill=(1, 1, 1))
                            sayfa.insert_text((bbox[0], bbox[1]), text, fontsize=span["size"], color=(0, 0, 0))
            
            for img in sayfa.get_images(full=True):
                bbox = sayfa.get_image_bbox(img)
                if bbox:
                    sansur_log.append({
                        "type": "image",
                        "page": sayfa_num,
                        "bbox": list(bbox)
                    })
                    sayfa.draw_rect(bbox, color=(0, 0, 0), fill=(0, 0, 0))

        doc.save(cikti_dosya)
        doc.close()

        # 🔍 Log dosyasını oluştur
        log_yolu = cikti_dosya.replace(".pdf", "_anonlog.json")
        with open(log_yolu, "w", encoding="utf-8") as log_file:
            json.dump(sansur_log, log_file)

        print(f"Anonim PDF ve log dosyası oluşturuldu: {log_yolu}")
        return konu

    except Exception as e:
        print(f"Anonimleştirme hatası: {e}")


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

        # 🔓 Anonimleştirilen bölgeleri log dosyasından oku
        if not os.path.exists(anon_log_path):
            raise FileNotFoundError(f"{anon_log_path} bulunamadı.")

        with open(anon_log_path, 'r', encoding='utf-8') as f:
            anon_data = json.load(f)

        # 👇 Yeni log formatına göre her girişe bak
        for entry in anon_data:
            if not isinstance(entry, dict):
                print(f"⚠️ Beklenmeyen entry formatı (atlandı): {entry}")
                continue

            if entry.get("type") != "text":
                continue  # sadece textleri işliyoruz

            page_number = entry.get("page")
            bbox = entry.get("bbox")
            original_text = entry.get("original")

            if page_number is None or bbox is None or original_text is None:
                print(f"⚠️ Eksik bilgi (atlandı): {entry}")
                continue

            try:
                page = doc.load_page(page_number)
            except Exception as e:
                print(f"⚠️ Sayfa yükleme hatası (page {page_number}): {e}")
                continue

            rect = fitz.Rect(*bbox)
            page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))  # temizle
            page.insert_text((rect.x0, rect.y0), original_text, fontsize=11, color=(0, 0, 0))

        # 💾 Geçici dosya oluştur
        temp_restored_path = output_pdf_path.replace(".pdf", "_temp_restored.pdf")
        doc.save(temp_restored_path)
        doc.close()

        # Hakem değerlendirmesini ekle
        append_review_page(temp_restored_path, comment, result, output_pdf_path)

        # Geçici dosyayı sil
        if os.path.exists(temp_restored_path):
            os.remove(temp_restored_path)

        print(f"✅ PDF başarıyla geri döndürüldü ve değerlendirme eklendi: {output_pdf_path}")

    except Exception as e:
        print(f"❌ restore_and_append_review hatası: {e}")
        raise e


    
def append_review_page(input_pdf_path, comment, result, output_pdf_path):
    """PDF sonuna hakem değerlendirmesini ekler"""
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()

    # 🗂️ Tüm sayfaları ekle
    for page in reader.pages:
        writer.add_page(page)

    # 📄 Yeni yorum sayfası oluştur
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=A4)
    can.setFont("Helvetica-Bold", 14)
    can.drawString(50, 800, "📋 Hakem Değerlendirmesi")
    can.setFont("Helvetica", 12)
    can.drawString(50, 770, f"📝 Sonuç: {result}")
    can.drawString(50, 740, "Yorumlar:")

    # Çok satırlı yorum için satır satır yaz
    lines = comment.split("\n")
    y = 720
    for line in lines:
        if y < 100:
            break  # Sayfa taşmasını önle
        can.drawString(60, y, line)
        y -= 20

    can.save()
    packet.seek(0)
    new_pdf = PdfReader(packet)
    writer.add_page(new_pdf.pages[0])

    # 📤 Çıkış dosyasını kaydet
    with open(output_pdf_path, "wb") as f:
        writer.write(f)