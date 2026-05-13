from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_system_prompt(data):
    theme = data.get('theme', 'fantasy')
    
    # DÜZELTME 1: React'ten gelen customScenario parametresini doğru yakalıyoruz
    custom_scenario = data.get('customScenario', '') 
    if theme == 'custom' or custom_scenario:
        theme = f"Özel Senaryo: {custom_scenario}"
    else:
        theme = data.get('mode', 'Karanlık Fantastik') # Örn: "Karanlık Fantastik"

    difficulty = data.get('difficultyTitle', 'Normal')
    narration = data.get('narrationStyleTitle', 'Akıcı')
    health = data.get('health', 100)
    energy = data.get('energy', 100)
    location = data.get('currentScene', {}).get('location', 'Bilinmiyor')
    mission = data.get('currentScene', {}).get('mission', 'Bilinmiyor')
    
    story_summary = data.get('storySummary', '').strip()

    if not story_summary:
        tur_kurali = f"""BAŞLANGIÇ (GİRİZGAH) KURALI - ÇOK KRİTİK:
Bu oyunun İLK TURU! 'loreMessage' kısmına ASLA "TODO" veya açıklama yazma! Doğrudan oyuncuya {theme} evrenine uygun spesifik bir kimlik, isim ve karanlık bir geçmiş UYDUR VE YAZ. 
1. 'loreMessage' alanı: Buraya oyuncunun kim olduğunu, geçmişini ve {theme} evrenindeki amacını anlatan o destansı giriş hikayesini en az 6 cümle olacak şekilde yaz.
2. 'aiMessage' alanı: Buraya ise karakterin ŞU AN bulunduğu mekanı, atılan zarın sonucunu ve olayı ilerletecek bir mesaj yaz (tehlikeli bir durum ilerlemesi gereken bir mekan veya alabileceği bir eşya vb.)."""
    else:
        tur_kurali = f"""GELİŞME VE HAFIZA KURALI:
Bu oyunun devamıdır. Karakterin kimliğini zaten anlattın. 'loreMessage' alanını KESİNLİKLE BOŞ ("") bırak.
'storySummary' kısmını oluştururken, BİR ÖNCEKİ TURDAN GELEN ÖZETİ SİLME; sadece üzerine son yaşanan önemli olayı 1-2 cümle olarak ekle."""

    return f"""Sen, oyuncuyu içine çeken, ciddi, nesnel ve usta bir Dungeon Master'sın. Kullanıcıya {theme} evreninde interaktif bir RPG oynatıyorsun.

ŞU ANKİ OYUN DURUMU:
- Evren: {theme} 
- Zorluk: {difficulty}
- Anlatım: {narration}
- Can: {health}/100 | Enerji: {energy}/100
- Konum: {location}
- Görev: {mission}
- Hafıza: {story_summary if story_summary else 'HENÜZ HİÇBİR ŞEY YAŞANMADI.'}

ZAR VE DİNAMİK ZORLUK MATEMATİĞİ:
- Sen zar ATMIYORSUN. Kullanıcının mesajında sana sistem tarafından atılan bir zar sonucu gönderilecek.
- Oyuncunun eyleminin Zorluk Derecesini (DC) belirle ve zar ile karşılaştır: 
  * Zar >= (DC + 6): Ekstra Başarı
  * Zar >= DC: Normal Başarı
  * Zar < DC: Normal Başarısızlık
  * Zar <= (DC - 6): Ekstra Başarısızlık (Ağır ceza)

  CAN VE ENERJİ YÖNETİMİ (ÇOK ÖNEMLİ):
1. Enerji Değişimi (energyChange): Yapılan eyleme göre DİNAMİK olarak belirle.
   - Savaşma, kaçma, tırmanma, ağır efor: -5 ile -15 arası.
   - Yürüme, etrafa bakınma, konuşma, araştırma: 0 veya -1.
   - Dinlenme, uyuma, yemek yeme, su içme: +10 ile +25 arası.
2. Can Değişimi (healthChange): 
   - Başarısız savaş/tuzak zarlarında hasar ver: -10 ile -30 arası.
   - İyileşme eylemlerinde (ilk yardım vb.) can ver: +10 ile +40 arası.
3. HAYATTA KALMA SEÇENEKLERİ: Eğer oyuncunun Canı veya Enerjisi çok düşükse, ona mutlaka dinlenebileceği, yiyecek/kaynak arayabileceği veya güvenli bir yere saklanabileceği HAYATTA KALMA ODAKLI seçenekler sun.
  
  
HİKAYE KURGUSU VE İLERLEYİŞ:
{tur_kurali}
FİNAL: Hikaye tatmin edici bir noktaya geldiğinde BİTİR. Epik bir final yaz ve 'choices' dizisini BOŞ bırak [].

DM KİŞİLİĞİ VE KURALLAR:
- DİL VE ANLATIM: Hikayeyi HER ZAMAN 2. Tekil Şahıs ("Sen") ağzından anlat. (Örn: "Yürüyorsun, görüyorsun").
- TON: Ukala olma. Ciddi ve nesnel bir dış ses kullan.
- YASAK (ÇOK ÖNEMLİ): Oyuncuya ASLA attığı zarı, DC'yi (Zorluk Derecesini) veya "Normal başarı, kritik başarısızlık" gibi oyun mekaniklerini metin içinde SÖYLEME! Zarın sonucunu sadece hikayenin gidişatını (kılıcın sekmesi, zombinin ısırması vb.) anlatmak için kullan.

ÇIKTI FORMATI:
Aşağıdaki JSON yapısını SADECE şablon olarak kullan.
{{
  "scene": {{
    "title": "Mekanın Adı",
    "chapter": "Bölüm Adı",
    "description": "1-2 cümlelik kısa mekan tasviri.",
    "imagePrompt": "İngilizce görsel komutu.",
    "imageUrl": ""
  }},
  "loreMessage": "SADECE İLK TURDA doldurulacak. Karakterin kimliği, geçmişi ve amacı. Diğer turlarda boş bırak.",
  "aiMessage": "Karakterin şu anki anlık durumu, atılan zarın sonucu ve karar anı.", 
  "choices": [
    {{ "text": "Asıl eylem", "clue": "Zorluk ipucusu" }},
    {{ "text": "Riskli eylem", "clue": "Zorluk ipucusu" }},
    {{ "text": "Alternatif eylem", "clue": "Zorluk ipucusu" }}
  ],
  "stats": {{
    "healthChange": 0, 
    "energyChange": 0,
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
    
    # DÜZELTME 2: React'ten 'dice' objesi olarak gelen zarı yakalıyoruz
    dice_data = data.get('dice') or {}
    dice_roll = dice_data.get('roll', 10)
    
    theme = data.get('mode', 'Karanlık Fantastik') 
    current_scene = data.get('currentScene', {})
    last_location = current_scene.get('location', '')
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": get_system_prompt(data)},
                {"role": "user", "content": f"Oyuncunun Hamlesi: {user_action}\nSistem Tarafından Atılan Zar: {dice_roll}"}
            ]
        )
        
        ai_data = json.loads(response.choices[0].message.content)
        new_location = ai_data.get('stats', {}).get('location', '')
        is_first_turn = not data.get('storySummary', '').strip()
       
        if is_first_turn or new_location.lower() != last_location.lower():
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