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

def get_system_prompt(theme, difficulty):
    return f"""
    Sen usta bir Dungeon Master'sın. Şu an '{theme}' evreninde ve '{difficulty}' zorluk seviyesinde bir oyun yönetiyorsun.
    
    KURALLAR:
    1. Hikayeyi tamamen '{theme}' temasına uygun terimlerle anlat.
    2. Zorluk seviyesi '{difficulty}' olduğu için olayların risk oranını buna göre ayarla.
    3. Kullanıcıdan gelen zar sonuçlarını (1-20) mutlak başarı veya başarısızlık kriteri olarak kullan.
    4. Sadece mekan değiştiğinde 'location' bilgisini güncelle.
    
    Cevabı şu JSON formatında ver:
    {{
      "scene": {{ "title": "", "chapter": "", "description": "", "imagePrompt": "", "imageUrl": "" }},
      "aiMessage": "",
      "choices": [],
      "stats": {{ "healthChange": 0, "energyChange": 0, "location": "", "mission": "" }}
    }}
    """

def generate_dalle_image(prompt, theme):
    try:
        # Temayı DALL-E promptuna ekliyoruz ki görsel uyumlu olsun
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
    
    # Frontend'den gelen dinamik bilgiler
    theme = data.get('mode', 'Cyberpunk') # Seçilen veya elle girilen tema
    difficulty = data.get('difficulty', 'Normal')
    last_location = data.get('currentScene', {}).get('location', '')
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={{ "type": "json_object" }},
            messages=[
                {"role": "system", "content": get_system_prompt(theme, difficulty)},
                {"role": "user", "content": f"Hamle/Zar Sonucu: {user_action}"}
            ]
        )
        
        ai_data = json.loads(response.choices[0].message.content)
        new_location = ai_data.get('stats', {}).get('location', '')

        # Mekan değiştiyse görsel üret
        if new_location.lower() != last_location.lower():
            img_prompt = ai_data.get('scene', {{}}).get('imagePrompt', '')
            ai_data['scene']['imageUrl'] = generate_dalle_image(img_prompt, theme)
        else:
            ai_data['scene']['imageUrl'] = data.get('currentScene', {{}}).get('image', '')
        
        return jsonify(ai_data)
    except Exception as e:
        return jsonify({{"error": str(e)}}), 500