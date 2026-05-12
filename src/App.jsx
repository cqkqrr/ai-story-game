import { useState } from "react"
import "./index.css"

const API_URL = "http://127.0.0.1:5000/api/story/next"

const gameModes = [
  {
    id: "fantasy",
    title: "Karanlık Fantastik",
    description: "Sisli ormanlar, eski kuleler, büyülü haritalar ve gizemli varlıklar.",
    icon: "🧙",
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk",
    description: "Neon şehirler, yapay zekâ şirketleri, hackerlar ve dijital sırlar.",
    icon: "🌆",
  },
  {
    id: "sci-fi",
    title: "Bilim Kurgu",
    description: "Uzay istasyonları, kayıp sinyaller, robotlar ve galaktik keşifler.",
    icon: "🚀",
  },
]

const difficulties = [
  { id: "easy", title: "Kolay", description: "Daha az risk, daha fazla ipucu." },
  { id: "normal", title: "Normal", description: "Dengeli hikâye ve karar zorluğu." },
  { id: "hard", title: "Zor", description: "Daha sert sonuçlar, daha az kaynak." },
]

const narrationStyles = [
  { id: "cinematic", title: "Sinematik", description: "Atmosferik, sahne odaklı anlatım." },
  { id: "fast", title: "Kısa ve Hızlı", description: "Daha kısa cevaplar, hızlı oyun akışı." },
  { id: "detailed", title: "Detaylı Hikâye", description: "Uzun betimlemeler ve derin hikâye." },
]

const initialScene = {
  title: "Başlangıç Noktası",
  chapter: "Bölüm 1",
  description:
    "Maceranın eşiğindesin. Seçtiğin evren birazdan yapay zekâ tarafından şekillendirilecek.",
  image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
  location: "Başlangıç",
  mission: "İlk hamleni yap",
  choices: ["Etrafıma bakın", "İleri doğru yürüyün", "Çantamı kontrol edin"],
}

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [selectedMode, setSelectedMode] = useState(gameModes[0])
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulties[1])
  const [selectedNarration, setSelectedNarration] = useState(narrationStyles[0])

  const [currentScene, setCurrentScene] = useState(initialScene)
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Oyuna başlamak için bir seçim yap." },
  ])

  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [health, setHealth] = useState(85)
  const [energy, setEnergy] = useState(60)
  const [saveMessage, setSaveMessage] = useState("")

  const showSaveMessage = (text) => {
    setSaveMessage(text)
    setTimeout(() => setSaveMessage(""), 2200)
  }

  const startGame = () => {
    const startingHealth = selectedDifficulty.id === "hard" ? 70 : 85
    const startingEnergy = selectedDifficulty.id === "hard" ? 50 : 60

    setHealth(startingHealth)
    setEnergy(startingEnergy)
    setCurrentScene({
      ...initialScene,
      title: `${selectedMode.title} Macerası`,
      description: `${selectedMode.description} İlk kararın hikâyeyi başlatacak.`,
    })
    setMessages([
      {
        sender: "ai",
        text: `${selectedMode.title} modunda oyun başladı. İlk hamleni seç.`,
      },
    ])
    setInput("")
    setIsThinking(false)
    setIsGameStarted(true)
  }

  const returnToMenu = () => {
    setIsGameStarted(false)
    setSaveMessage("")
  }

  const callAI = async (actionText) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: actionText,
        mode: selectedMode.title,
        difficulty: selectedDifficulty.title,
        narrationStyle: selectedNarration.title,
        currentScene,
        health,
        energy,
        recentMessages: messages.slice(-6),
      }),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      throw new Error(data.error || "AI servisinden cevap alınamadı.")
    }

    return data
  }

  const normalizeAIData = (data) => {
    return {
      scene: {
        title: data.scene?.title || currentScene.title,
        chapter: data.scene?.chapter || currentScene.chapter,
        description: data.scene?.description || currentScene.description,
        image: data.scene?.imageUrl || currentScene.image,
        location: data.stats?.location || currentScene.location,
        mission: data.stats?.mission || currentScene.mission,
        choices:
          Array.isArray(data.choices) && data.choices.length > 0
            ? data.choices
            : currentScene.choices,
      },
      aiMessage: data.aiMessage || "Hikâye devam ediyor.",
      healthChange: Number(data.stats?.healthChange || 0),
      energyChange: Number(data.stats?.energyChange || 0),
    }
  }

  const handleAction = async (actionText) => {
    if (isThinking) return

    setMessages((prev) => [...prev, { sender: "user", text: actionText }])
    setIsThinking(true)

    try {
      const aiData = await callAI(actionText)
      const result = normalizeAIData(aiData)

      setCurrentScene(result.scene)
      setHealth((prev) => Math.max(0, Math.min(100, prev + result.healthChange)))
      setEnergy((prev) => Math.max(0, Math.min(100, prev + result.energyChange)))

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: result.aiMessage,
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `AI bağlantısında hata oluştu: ${error.message}`,
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  const handleSendMessage = () => {
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    setInput("")
    handleAction(trimmedInput)
  }

  const handleNewGame = () => {
    startGame()
  }

  const handleSaveGame = () => {
    const saveData = {
      selectedMode,
      selectedDifficulty,
      selectedNarration,
      currentScene,
      messages,
      health,
      energy,
    }

    localStorage.setItem("aiStoryQuestSave", JSON.stringify(saveData))
    showSaveMessage("Oyun kaydedildi.")
  }

  const handleLoadGame = () => {
    const savedData = localStorage.getItem("aiStoryQuestSave")

    if (!savedData) {
      showSaveMessage("Kayıt bulunamadı.")
      return
    }

    const parsedData = JSON.parse(savedData)

    setSelectedMode(parsedData.selectedMode)
    setSelectedDifficulty(parsedData.selectedDifficulty)
    setSelectedNarration(parsedData.selectedNarration)
    setCurrentScene(parsedData.currentScene)
    setMessages(parsedData.messages)
    setHealth(parsedData.health)
    setEnergy(parsedData.energy)
    setIsGameStarted(true)

    showSaveMessage("Kayıt yüklendi.")
  }

  if (!isGameStarted) {
    return (
      <main className="app start-screen">
        <div className="start-background-glow" />

        <section className="start-container">
          <div className="start-hero">
            <div className="brand large-brand">
              <div className="brand-icon">✦</div>
              <div>
                <div className="logo">AI Story Quest</div>
                <div className="tagline">Yapay Zeka Destekli Hikâye Oyunu</div>
              </div>
            </div>

            <h1>Kendi hikâyeni seç, yapay zekâ dünyayı oluştursun.</h1>

            <p>
              Hikâye tarzını, zorluk seviyesini ve anlatım biçimini belirle.
              Seçimlerin AI tarafından yorumlanır ve oyun akışı dinamik olarak değişir.
            </p>

            <div className="start-summary">
              <div>
                <span>Hikâye</span>
                <strong>{selectedMode.title}</strong>
              </div>
              <div>
                <span>Zorluk</span>
                <strong>{selectedDifficulty.title}</strong>
              </div>
              <div>
                <span>Anlatım</span>
                <strong>{selectedNarration.title}</strong>
              </div>
            </div>
          </div>

          <div className="setup-panel">
            <div className="setup-section">
              <div className="setup-title">
                <span>01</span>
                <h2>Hikâye Tarzı</h2>
              </div>

              <div className="option-grid">
                {gameModes.map((mode) => (
                  <button
                    key={mode.id}
                    className={`setup-card ${
                      selectedMode.id === mode.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedMode(mode)}
                  >
                    <div className="setup-icon">{mode.icon}</div>
                    <strong>{mode.title}</strong>
                    <p>{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-section">
              <div className="setup-title">
                <span>02</span>
                <h2>Zorluk Modu</h2>
              </div>

              <div className="option-grid three">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty.id}
                    className={`setup-card ${
                      selectedDifficulty.id === difficulty.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedDifficulty(difficulty)}
                  >
                    <strong>{difficulty.title}</strong>
                    <p>{difficulty.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-section">
              <div className="setup-title">
                <span>03</span>
                <h2>AI Anlatım Tarzı</h2>
              </div>

              <div className="option-grid three">
                {narrationStyles.map((style) => (
                  <button
                    key={style.id}
                    className={`setup-card ${
                      selectedNarration.id === style.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedNarration(style)}
                  >
                    <strong>{style.title}</strong>
                    <p>{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="start-actions">
              <button className="start-button" onClick={startGame}>
                Oyuna Başla
              </button>
              <button className="load-button" onClick={handleLoadGame}>
                Kayıttan Devam Et
              </button>
            </div>

            {saveMessage && <div className="menu-message">{saveMessage}</div>}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <div>
            <div className="logo">AI Story Quest</div>
            <div className="tagline">Yapay Zeka Destekli Hikâye Oyunu</div>
          </div>
        </div>

        <div className="nav-menu">
          <a href="#oyun">Oyun</a>
          <a href="#senaryo">Senaryo</a>
          <a href="#karakter">Karakter</a>
          <a href="#galeri">Galeri</a>
        </div>

        <div className="nav-actions">
          <button onClick={handleNewGame}>Yeni Oyun</button>
          <button onClick={handleSaveGame}>Kaydet</button>
          <button onClick={handleLoadGame}>Yükle</button>
          <button onClick={returnToMenu}>Menüye Dön</button>
        </div>
      </nav>

      <section className="game-container" id="oyun">
        <div className="scene-section">
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

          <div className="character-panel" id="karakter">
            <div>
              <span>Karakter</span>
              <strong>Gezgin Arda</strong>
            </div>
            <div>
              <span>Oyun Modu</span>
              <strong>{selectedMode.title}</strong>
            </div>
            <div>
              <span>Zorluk / Anlatım</span>
              <strong>
                {selectedDifficulty.title} / {selectedNarration.title}
              </strong>
            </div>
          </div>
        </div>

        <aside className="chat-section" id="senaryo">
          <div className="chat-header">
            <div>
              <h2>AI Anlatıcı</h2>
              <p>Hikâyeyi seçimlerinle yönlendir</p>
            </div>
            <div className="online-dot" />
          </div>

          {saveMessage && <div className="save-message">{saveMessage}</div>}

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
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
              value={input}
              placeholder="Kendi hamleni yaz..."
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
      </section>
    </main>
  )
}

export default App