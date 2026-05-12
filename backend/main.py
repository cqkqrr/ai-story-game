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
    # Frontend'den gelen anlık oyun verilerini alıyoruz
    theme = data.get('mode', 'Cyberpunk')
    difficulty = data.get('difficulty', 'Normal')
    narration = data.get('narrationStyle', 'Akıcı')
    health = data.get('health', 100)
    energy = data.get('energy', 100)
    location = data.get('currentScene', {}).get('location', 'Bilinmiyor')
    mission = data.get('currentScene', {}).get('mission', 'Bilinmiyor')
    story_summary = data.get('storySummary', '')

    # Python f-string içinde JSON kullanırken süslü parantezlerin çökmemsi için {{ ve }} kullanılır.
    return f"""Sen, oyuncuyu içine çeken, ciddi, nesnel ve usta bir Dungeon Master'sın (Oyun Yöneticisi). Kullanıcıya {theme} evreninde interaktif bir RPG oynatıyorsun.

ŞU ANKİ OYUN DURUMU:
- Evren: {theme} 
- Zorluk: {difficulty}
- Anlatım: {narration}
- Can: {health}/100 | Enerji: {energy}/100
- Konum: {location}
- Görev: {mission}
- Hafıza: {story_summary}

GİZLİ ZAR VE DİNAMİK ZORLUK MATEMATİĞİ (KRİTİK KURAL):
- ZARI OYUNCUYA GÖSTERME. Arka planda gizli bir d20 (1 ile 20 arası) zarı at. 
- Oyuncunun seçtiği eylemin mantıksal bir Zorluk Derecesi (DC) belirle. (Örn: Boş yolda kaçmak DC 5, iki kişiyle silahsız savaşmak DC 14). 
- Oyuncunun geçmiş hamleleri ve avantajları bu DC'yi düşürür veya artırır. 
- Atılan zarı belirlediğin DC ile matematiksel olarak karşılaştır ve sonucu hikayeye şöyle yansıt: 
  * Zar >= (DC + 6): Ekstra Başarı (Kritik). Zar, zorluktan 6 veya daha yüksekse kusursuz zaferdir. Ekstra avantaj, Can veya Enerji ödülü ver. 
  * Zar >= DC (ama DC+6'dan küçük): Normal Başarı. Hamle tam olarak planlandığı gibi gerçekleşir. 
  * Zar < DC (ama DC-6'dan büyük): Normal Başarısızlık. Hamle işe yaramaz ve durumu kötüleştirir. Hafif hasar aldır. 
  * Zar <= (DC - 6): Ekstra Başarısızlık (Kritik Felaket). Zar, zorluktan 6 veya daha düşükse feci bir hatadır. Silah geri teper, çok ağır Can/Enerji cezası kes.

HİKAYE KURGUSU VE İLERLEYİŞ (PACING):
Oyun sonsuz bir hayatta kalma döngüsü DEĞİLDİR. Belirli bir amacı ve sonu olmalıdır.
1. BAŞLANGIÇ (GİRİZGAH): Eğer '{story_summary}' verisi BOŞ ise, bu oyunun ilk turudur. Oyuncuya {theme} evrenine uygun spesifik bir kimlik ve geçmiş ver. (Örn: "Kendimi bildim bileli kaçıyorum..."). Bu etkileyici girişi ve hikayeyi 'aiMessage' kısmına yaz.
2. GELİŞME VE HAFIZA: Her turda ANA AMACI 'mission' kısmında özetle. 'storySummary' kısmını oluştururken, BİR ÖNCEKİ TURDAN GELEN ÖZETİ SİLME; sadece üzerine son yaşanan önemli olayı 1-2 cümle olarak ekle.
3. FİNAL (SON): Hikaye tatmin edici bir noktaya geldiğinde BİTİR. Epik bir "Zafer" finali yaz ve 'choices' dizisini BOŞ bırak [].

DM KİŞİLİĞİ VE KURALLAR:
- TON: Ukala veya yargılayıcı olma. Ciddi, sürükleyici ve nesnel bir dış ses kullan.
- CEZALANDIRMA: Oyuncu evrenin kurallarını bozan absürt bir hamle yaparsa, bu eylemin zorluğunu (DC) 20 olarak belirle. Zar tam 20 gelmezse feci şekilde başarısızlığa uğrat.

ÇIKTI FORMATI:
Aşağıdaki JSON yapısını SADECE yapısal bir şablon olarak kullan. İçindeki örnek metinleri ASLA kopyalama, kendi oluşturduğun hikaye ve değerlerle doldur.
{{
  "scene": {{
    "title": "Mekanın Adı",
    "chapter": "Bölüm Adı",
    "description": "Sadece 1-2 cümlelik kısa ve vurucu mekan tasviri.",
    "imagePrompt": "İngilizce görsel oluşturma komutu.",
    "imageUrl": ""
  }},
  "aiMessage": "Gizli atılan zarın sonucuna göre şekillenen asıl sürükleyici hikaye metni. (Zarı oyuncuya söyleme, sadece sonucu yaşat).", 
  "choices": [
    {{ 
      "text": "Seçeneğin asıl eylemi (Örn: Sokağın sonuna doğru koş)",
      "clue": "Karakterin iç sesiyle zorluğu belirten ipucu. Zorluğa göre gerekirse boş bırak."
    }},
    {{ 
      "text": "İkinci farklı ve riskli eylem seçeneği",
      "clue": "İkinci seçenek için içgüdüsel ipucu."
    }},
    {{
      "text": "Üçüncü farklı çevresel veya alternatif eylem seçeneği",
      "clue": "Üçüncü seçenek için içgüdüsel ipucu." 
    }}
  ],
  "stats": {{
    "healthChange": 0, 
    "energyChange": -5,
    "location": "Kısa Konum Adı",
    "mission": "Ana Görevin Kısa Özeti",
    "storySummary": "Önceki olayların üzerine sadece son yaşanan eylemi ekleyerek güncellenmiş genel özet."
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
    except:
        return ""

@app.route('/api/story/next', methods=['POST'])
def next_step():
    data = request.json or {}
    user_action = data.get('action', '')
    
    theme = data.get('mode', 'Cyberpunk')
    last_location = data.get('currentScene', {}).get('location', '')
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": get_system_prompt(data)},
                {"role": "user", "content": f"Oyuncunun Hamlesi: {user_action}"}
            ]
        )
        
        ai_data = json.loads(response.choices[0].message.content)
        new_location = ai_data.get('stats', {}).get('location', '')

        if new_location.lower() != last_location.lower():
            img_prompt = ai_data.get('scene', {}).get('imagePrompt', '')
            ai_data['scene']['imageUrl'] = generate_dalle_image(img_prompt, theme)
        else:
            ai_data['scene']['imageUrl'] = data.get('currentScene', {}).get('image', '')
        
        return jsonify(ai_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)