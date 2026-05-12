from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os
import json
from dotenv import load_dotenv

# .env dosyasındaki API anahtarını sisteme yükler
load_dotenv()

app = Flask(__name__)
CORS(app)

# OpenAI istemcisini başlatıyoruz
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Bu prompt AI'ın beyni! Nasıl davranacağını ve ne formatta döneceğini belirliyor.
SYSTEM_PROMPT = """
Sen usta ve yaratıcı bir Dungeon Master'sın. Kullanıcıya siberpunk/bilimkurgu evreninde interaktif bir macera oynatıyorsun.
Kullanıcının hamlesine göre hikayeyi mantıklı, heyecanlı ve sürükleyici bir şekilde ilerlet.
Cevabını HER ZAMAN aşağıdaki JSON formatında vermelisin. Başka hiçbir düz metin yazma:

{
  "scene": {
    "title": "Mekanın etkileyici adı",
    "chapter": "Bölüm adı",
    "description": "Mekanın, atmosferin ve kokuların 2-3 cümlelik tasviri.",
    "imagePrompt": "İngilizce olarak, bu sahneyi çizecek bir görsel oluşturma komutu (prompt).",
    "imageUrl": ""
  },
  "aiMessage": "Kullanıcının hamlesinin sonucu ve tam şu an yaşanan olaylar (Kısa ve öz).",
  "choices": [
    "Mantıklı Seçenek 1",
    "Riskli Seçenek 2",
    "Çılgınca Seçenek 3"
  ],
  "stats": {
    "healthChange": 0,
    "energyChange": -5,
    "location": "Kısa Konum Adı",
    "mission": "Mevcut Görev"
  }
}
"""

@app.route('/api/story/next', methods=['POST'])
def next_step():
    data = request.json or {}
    user_action = data.get('action', 'Etrafıma bakınıyorum.')
    
    try:
        # Yapay zekaya isteği atıyoruz
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # Bütçe dostu ve hızlı model
            response_format={ "type": "json_object" }, # AI'ı kesinlikle JSON vermeye zorlayan hayat kurtarıcı ayar
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Oyuncunun hamlesi: {user_action}"}
            ]
        )
        
        # AI'dan gelen string formatındaki JSON'u Python objesine çeviriyoruz
        ai_data = json.loads(response.choices[0].message.content)
        
        # Ve Frontend'e gönderiyoruz!
        return jsonify(ai_data)
        
    except Exception as e:
        # Bir hata olursa sunucu çökmesin, hatayı göstersin
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)