from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os
import json
from dotenv import load_dotenv

# .env dosyasındaki API anahtarını yükler
load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_system_prompt(data):
    # Frontend'den gelen anlık oyun verilerini alıyoruz
    theme = data.get('mode', 'Cyberpunk')
    difficulty = data.get('difficulty', 'Normal')
    narration = data.get('narrationStyle', 'Akıcı')
    health = data.get('health', 100)
    energy = data.get('energy', 100)
    location = data.get('currentScene', {}).get('location', 'Bilinmiyor')
    mission = data.get('currentScene', {}).get('mission', 'Bilinmiyor')
    
    # Hafıza boş mu diye kontrol edip (strip ile boşlukları da siliyoruz) Python'da karar veriyoruz
    story_summary = data.get('storySummary', '').strip()

    # YAPAY ZEKAYI ZORLAYACAK DİNAMİK KURAL SİSTEMİ
    if not story_summary:
        tur_kurali = f"""BAŞLANGIÇ (GİRİZGAH) KURALI - ÇOK KRİTİK:
Bu oyunun İLK TURU! Oyuncunun kim olduğunu henüz bilmiyoruz. 
'aiMessage' kısmına YAZMAYA BAŞLARKEN İLK İŞ OLARAK oyuncuya {theme} evrenine uygun spesifik bir kimlik, isim ve karanlık bir geçmiş ver. 
Örn: "Ben, yıllardır bu karanlıkta saklanan eski bir..." tarzı destansı bir iç sesle başla, ardından oyuncunun yaptığı ilk hamlenin (ve zarın) sonucuna bağla."""
    else:
        tur_kurali = f"""GELİŞME VE HAFIZA KURALI:
Bu oyunun devamıdır. Karakterin kimliğini zaten anlattın, tekrar anlatma. Doğrudan hamleye ve zara odaklan.
'storySummary' kısmını oluştururken, BİR ÖNCEKİ TURDAN GELEN ÖZETİ SİLME; sadece üzerine son yaşanan önemli olayı 1-2 cümle olarak ekle."""

    return f"""Sen, oyuncuyu içine çeken, ciddi, nesnel ve usta bir Dungeon Master'sın (Oyun Yöneticisi). Kullanıcıya {theme} evreninde interaktif bir RPG oynatıyorsun.

ŞU ANKİ OYUN DURUMU:
- Evren: {theme} 
- Zorluk: {difficulty}
- Anlatım: {narration}
- Can: {health}/100 | Enerji: {energy}/100
- Konum: {location}
- Görev: {mission}
- Hafıza: {story_summary if story_summary else 'HENÜZ HİÇBİR ŞEY YAŞANMADI.'}

ZAR VE DİNAMİK ZORLUK MATEMATİĞİ (KRİTİK KURAL):
- DİKKAT: Artık sen zar ATMIYORSUN. Kullanıcının mesajında sana sistem tarafından atılan bir d20 (1-20 arası) zar sonucu gönderilecek.
- Senin görevin, oyuncunun seçtiği eylemin mantıksal bir Zorluk Derecesini (DC) belirlemektir. (Örn: Boş yolda kaçmak DC 5, savaşmak DC 14).
- Sana gönderilen zar sonucunu, belirlediğin DC ile karşılaştır: 
  * Zar >= (DC + 6): Ekstra Başarı (Kusursuz zafer, ödül ver).
  * Zar >= DC: Normal Başarı.
  * Zar < DC: Normal Başarısızlık (Durum kötüleşir, hafif hasar).
  * Zar <= (DC - 6): Ekstra Başarısızlık (Feci hata, ağır ceza).

HİKAYE KURGUSU VE İLERLEYİŞ:
Oyun sonsuz bir hayatta kalma döngüsü DEĞİLDİR. Belirli bir amacı ve sonu olmalıdır.
{tur_kurali}
FİNAL: Hikaye tatmin edici bir noktaya geldiğinde BİTİR. Epik bir final yaz ve 'choices' dizisini BOŞ bırak [].

DM KİŞİLİĞİ VE KURALLAR:
- TON: Ukala olma. Ciddi ve nesnel bir dış ses kullan.
- CEZALANDIRMA: Oyuncu absürt bir hamle yaparsa DC'yi 20 yap. Zar 20 değilse feci şekilde cezalandır.

ÇIKTI FORMATI:
Aşağıdaki JSON yapısını SADECE şablon olarak kullan.
{{
  "scene": {{
    "title": "Mekanın Adı",
    "chapter": "Bölüm Adı",
    "description": "Sadece 1-2 cümlelik kısa ve vurucu mekan tasviri.",
    "imagePrompt": "İngilizce görsel oluşturma komutu.",
    "imageUrl": ""
  }},
  "aiMessage": "Sana verilen zarın sonucuna ve belirlediğin DC'ye göre şekillenen asıl sürükleyici hikaye metni. Zarı tekrar yazma.", 
  "choices": [
    {{ 
      "text": "Seçeneğin asıl eylemi",
      "clue": "İçgüdüsel zorluk ipucusu"
    }},
    {{ 
      "text": "Riskli eylem seçeneği",
      "clue": "İçgüdüsel ipucu"
    }},
    {{
      "text": "Alternatif eylem",
      "clue": "İçgüdüsel ipucu" 
    }}
  ],
  "stats": {{
    "healthChange": 0, 
    "energyChange": -5,
    "location": "Kısa Konum Adı",
    "mission": "Ana Görevin Kısa Özeti",
    "storySummary": "Güncellenmiş genel özet."
  }}
}}"""

def generate_dalle_image(prompt, theme):
    try:
        full_prompt = f"{theme} style atmosphere, cinematic, high detail, {prompt}"
        response = client.images.generate(
            model="dall-e-3",
            prompt=full_prompt,
            size="1024x1024",
            n=1
        )
        return response.data[0].url
    except Exception as e:
        print(f"DALL-E Hatası: {e}")
        return ""

@app.route('/api/story/next', methods=['POST'])
def next_step():
    data = request.json or {}
    user_action = data.get('action', 'Etrafıma bakınıyorum.')
    
    # YENİ EKLENEN KISIM: Frontend'den gelen zarı alıyoruz
    dice_roll = data.get('diceRoll', 10) # Eğer zar gelmezse varsayılan olarak 10 kabul et
    
    # Frontend'den gelen dinamik bilgiler
    theme = data.get('mode', 'Cyberpunk') 
    current_scene = data.get('currentScene', {})
    last_location = current_scene.get('location', '')
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": get_system_prompt(data)},
                # YENİ EKLENEN KISIM: Zarı yapay zekaya hamle ile birlikte gönderiyoruz
                {"role": "user", "content": f"Oyuncunun Hamlesi: {user_action}\nSistem Tarafından Atılan Zar: {dice_roll}"}
            ]
        )
        
        ai_data = json.loads(response.choices[0].message.content)
        new_location = ai_data.get('stats', {}).get('location', '')

        if new_location.lower() != last_location.lower():
            img_prompt = ai_data.get('scene', {}).get('imagePrompt', '')
            if img_prompt:
                ai_data['scene']['imageUrl'] = generate_dalle_image(img_prompt, theme)
            else:
                ai_data['scene']['imageUrl'] = current_scene.get('image', '')
        else:
            ai_data['scene']['imageUrl'] = current_scene.get('image', '')
        
        return jsonify(ai_data)
        
    except Exception as e:
        print(f"Hata detayı: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)