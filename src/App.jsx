import { useState } from "react"
import "./index.css"

const gameModes = [
  {
    id: "fantasy",
    title: "Karanlık Fantastik",
    description: "Sisli ormanlar, eski kuleler, büyülü haritalar ve gizemli varlıklar.",
    icon: "🗡️",
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
  {
    id: "easy",
    title: "Kolay",
    description: "Daha az risk, daha fazla ipucu.",
  },
  {
    id: "normal",
    title: "Normal",
    description: "Dengeli hikâye ve karar zorluğu.",
  },
  {
    id: "hard",
    title: "Zor",
    description: "Daha sert sonuçlar, daha az kaynak.",
  },
]

const narrationStyles = [
  {
    id: "cinematic",
    title: "Sinematik",
    description: "Atmosferik, sahne odaklı ve etkileyici anlatım.",
  },
  {
    id: "fast",
    title: "Kısa ve Hızlı",
    description: "Daha kısa cevaplar, hızlı oyun akışı.",
  },
  {
    id: "detailed",
    title: "Detaylı Hikâye",
    description: "Uzun betimlemeler ve derin hikâye anlatımı.",
  },
]

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
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [selectedMode, setSelectedMode] = useState(gameModes[0])
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulties[1])
  const [selectedNarration, setSelectedNarration] = useState(narrationStyles[0])

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
  const [saveMessage, setSaveMessage] = useState("")

  const currentScene = scenes[sceneIndex]

  const getDifficultyDamage = () => {
    if (selectedDifficulty.id === "easy") {
      return {
        healthChange: -2,
        energyChange: -4,
      }
    }

    if (selectedDifficulty.id === "hard") {
      return {
        healthChange: -9,
        energyChange: -12,
      }
    }

    return {
      healthChange: -5,
      energyChange: -8,
    }
  }

  const getNarrationPrefix = () => {
    if (selectedNarration.id === "fast") {
      return "Hızlıca karar verdin."
    }

    if (selectedNarration.id === "detailed") {
      return "Bu kararın çevrendeki atmosferi değiştiriyor ve hikâyenin yönünü belirgin şekilde etkiliyor."
    }

    return "Sahne sinematik bir şekilde değişiyor."
  }

  const startGame = () => {
    setIsGameStarted(true)
    setSceneIndex(0)
    setHealth(selectedDifficulty.id === "hard" ? 70 : 85)
    setEnergy(selectedDifficulty.id === "hard" ? 50 : 60)
    setInput("")
    setIsThinking(false)
    setSaveMessage("")
    setMessages([
      {
        sender: "ai",
        text: `${selectedMode.title} modunda oyun başladı. ${scenes[0].aiText}`,
      },
    ])
  }

  const returnToMenu = () => {
    setIsGameStarted(false)
    setSaveMessage("")
  }

  const generateAIResponse = (userAction) => {
    const nextIndex = (sceneIndex + 1) % scenes.length
    const nextScene = scenes[nextIndex]
    const difficultyDamage = getDifficultyDamage()
    const narrationPrefix = getNarrationPrefix()

    return {
      nextIndex,
      aiMessage: `${narrationPrefix} "${userAction}" seçimini yaptın. ${nextScene.aiText}`,
      healthChange: difficultyDamage.healthChange,
      energyChange: difficultyDamage.energyChange,
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
    setHealth(selectedDifficulty.id === "hard" ? 70 : 85)
    setEnergy(selectedDifficulty.id === "hard" ? 50 : 60)
    setInput("")
    setIsThinking(false)
    setSaveMessage("")
    setMessages([
      {
        sender: "ai",
        text: `${selectedMode.title} modunda yeni oyun başladı. ${scenes[0].aiText}`,
      },
    ])
  }

  const handleSaveGame = () => {
    const saveData = {
      selectedMode,
      selectedDifficulty,
      selectedNarration,
      sceneIndex,
      messages,
      health,
      energy,
    }

    localStorage.setItem("aiStoryQuestSave", JSON.stringify(saveData))
    setSaveMessage("Oyun kaydedildi.")

    setTimeout(() => {
      setSaveMessage("")
    }, 2000)
  }

  const handleLoadGame = () => {
    const savedData = localStorage.getItem("aiStoryQuestSave")

    if (!savedData) {
      setSaveMessage("Kayıt bulunamadı.")

      setTimeout(() => {
        setSaveMessage("")
      }, 2000)

      return
    }

    const parsedData = JSON.parse(savedData)

    setSelectedMode(parsedData.selectedMode)
    setSelectedDifficulty(parsedData.selectedDifficulty)
    setSelectedNarration(parsedData.selectedNarration)
    setSceneIndex(parsedData.sceneIndex)
    setMessages(parsedData.messages)
    setHealth(parsedData.health)
    setEnergy(parsedData.energy)
    setIsGameStarted(true)
    setSaveMessage("Kayıt yüklendi.")

    setTimeout(() => {
      setSaveMessage("")
    }, 2000)
  }

  if (!isGameStarted) {
    return (
      <div className="start-screen">
        <div className="start-background-glow"></div>

        <div className="start-container">
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
              Oyun başlamadan önce hikâye tarzını, zorluk seviyesini ve AI anlatım
              biçimini belirle. Seçimlerin oyun akışını, risk seviyesini ve anlatıcı
              dilini etkiler.
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
        </div>
      </div>
    )
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
          <button onClick={handleSaveGame}>Kaydet</button>
          <button onClick={handleLoadGame}>Yükle</button>
          <button onClick={returnToMenu}>Menüye Dön</button>
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

          <div className="character-panel">
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
        </section>

        <aside className="chat-section">
          <div className="chat-header">
            <div>
              <h2>AI Anlatıcı</h2>
              <p>Hikâyeyi seçimlerinle yönlendir</p>
            </div>

            <span className="online-dot"></span>
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