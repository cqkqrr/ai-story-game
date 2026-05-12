import { useState } from "react"
import "./index.css"

const scenes = [
  {
    title: "Karanlık Orman Girişi",
    chapter: "Bölüm 1",
    description:
      "Sisli ormanın kıyısındasın. Uzakta terk edilmiş bir kule parlıyor. Cebindeki eski harita titremeye başladı.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
    location: "Orman",
    mission: "Kuleyi Bul",
    aiText:
      "Yol ikiye ayrılıyor. Sol tarafta yoğun sis, sağ tarafta ise eski taşlardan yapılmış bir patika var.",
    choices: [
      "Sisin içine gir",
      "Taş patikadan ilerle",
      "Haritayı tekrar incele",
      "Bulunduğun yeri araştır",
    ],
  },
  {
    title: "Sisli Patika",
    chapter: "Bölüm 2",
    description:
      "Sisin içine adım attığında çevrendeki sesler boğuklaşır. Haritadaki semboller mavi bir ışıkla yanmaya başlar.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b",
    location: "Sisli Patika",
    mission: "Işığı Takip Et",
    aiText:
      "Sislerin arasında eski bir taş kapı beliriyor. Kapının üzerinde bilinmeyen bir dilde yazılar var.",
    choices: [
      "Kapıdaki yazıyı incele",
      "Kapıyı açmaya çalış",
      "Geri dön",
      "Haritadaki ışığı takip et",
    ],
  },
  {
    title: "Terk Edilmiş Kule",
    chapter: "Bölüm 3",
    description:
      "Kulenin önüne ulaştın. Taş duvarlar çatlamış, kapı ise içeriden gelen mor bir ışıkla aralanmış durumda.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    location: "Eski Kule",
    mission: "Kuleye Gir",
    aiText:
      "Kule kapısının ardında seni bekleyen bir enerji hissediyorsun. İçeri girmek cesaret istiyor.",
    choices: [
      "Kuleye gir",
      "Kapının çevresini araştır",
      "Bir süre bekle",
      "Ormana geri dön",
    ],
  },
]

function App() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: scenes[0].aiText,
    },
  ])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [health, setHealth] = useState(85)
  const [energy, setEnergy] = useState(60)

  const currentScene = scenes[sceneIndex]

  const generateAIResponse = (userAction) => {
    const nextIndex = (sceneIndex + 1) % scenes.length
    const nextScene = scenes[nextIndex]

    return {
      nextIndex,
      aiMessage: `"${userAction}" seçimini yaptın. ${nextScene.aiText}`,
      healthChange: -5,
      energyChange: -8,
    }
  }

  const handleAction = (actionText) => {
    if (isThinking) return

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: actionText,
      },
    ])

    setIsThinking(true)

    setTimeout(() => {
      const result = generateAIResponse(actionText)

      setSceneIndex(result.nextIndex)
      setHealth((prev) => Math.max(0, prev + result.healthChange))
      setEnergy((prev) => Math.max(0, prev + result.energyChange))

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: result.aiMessage,
        },
      ])

      setIsThinking(false)
    }, 1200)
  }

  const handleSendMessage = () => {
    const trimmedInput = input.trim()

    if (!trimmedInput) return

    handleAction(trimmedInput)
    setInput("")
  }

  const handleNewGame = () => {
    setSceneIndex(0)
    setHealth(85)
    setEnergy(60)
    setInput("")
    setIsThinking(false)
    setMessages([
      {
        sender: "ai",
        text: scenes[0].aiText,
      },
    ])
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">✦</div>

          <div>
            <div className="logo">AI Story Quest</div>
            <div className="tagline">Yapay Zeka Destekli Hikâye Oyunu</div>
          </div>
        </div>

        <nav className="nav-menu">
          <a href="#">Oyun</a>
          <a href="#">Senaryo</a>
          <a href="#">Karakter</a>
          <a href="#">Galeri</a>
        </nav>

        <div className="nav-actions">
          <button onClick={handleNewGame}>Yeni Oyun</button>
          <button>Kaydet</button>
          <button>Ayarlar</button>
        </div>
      </header>

      <main className="game-container">
        <section className="scene-section">
          <div className="scene-image">
            <img src={currentScene.image} alt={currentScene.title} />

            <div className="scene-overlay">
              <span>{currentScene.chapter}</span>
              <h1>{currentScene.title}</h1>
              <p>{currentScene.description}</p>
            </div>
          </div>

          <div className="status-bar">
            <div>
              <span>Can</span>
              <strong>{health}</strong>
            </div>

            <div>
              <span>Enerji</span>
              <strong>{energy}</strong>
            </div>

            <div>
              <span>Konum</span>
              <strong>{currentScene.location}</strong>
            </div>

            <div>
              <span>Görev</span>
              <strong>{currentScene.mission}</strong>
            </div>
          </div>
        </section>

        <aside className="chat-section">
          <div className="chat-header">
            <div>
              <h2>AI Anlatıcı</h2>
              <p>Hikâyeyi seçimlerinle yönlendir</p>
            </div>

            <span className="online-dot"></span>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.sender === "ai" ? "ai-message" : "user-message"
                }`}
              >
                {message.text}
              </div>
            ))}

            {isThinking && (
              <div className="message ai-message thinking">
                AI yeni sahneyi oluşturuyor...
              </div>
            )}
          </div>

          <div className="choices">
            {currentScene.choices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleAction(choice)}
                disabled={isThinking}
              >
                {choice}
              </button>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Kendi hamleni yaz..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSendMessage()
                }
              }}
              disabled={isThinking}
            />

            <button onClick={handleSendMessage} disabled={isThinking}>
              Gönder
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App