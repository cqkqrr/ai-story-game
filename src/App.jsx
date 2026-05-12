import { useEffect, useRef, useState } from "react"
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
  choices: [
    {
      text: "Etrafıma bakın",
      clue: "Güvenli başlangıç hamlesi.",
    },
    {
      text: "İleri doğru yürüyün",
      clue: "Risk orta seviyede.",
    },
    {
      text: "Çantamı kontrol edin",
      clue: "",
    },
  ],
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const rollD20 = () => Math.floor(Math.random() * 20) + 1

const getDiceResult = (roll, difficultyId) => {
  if (roll === 1) return "Kritik Başarısızlık"
  if (roll === 20) return "Kritik Başarı"

  if (difficultyId === "easy") {
    if (roll >= 5) return "Başarılı"
    return "Başarısız"
  }

  if (difficultyId === "hard") {
    if (roll >= 15) return "Mükemmel Başarı"
    if (roll >= 10) return "Kısmi Başarı"
    return "Yetersiz Hamle"
  }

  if (roll >= 8) return "Başarılı"
  return "Başarısız"
}

const preloadSceneImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      reject(new Error("Geçersiz görsel adresi."))
      return
    }

    const image = new Image()
    image.src = imageUrl

    image.onload = () => resolve(imageUrl)
    image.onerror = () => reject(new Error("Görsel yüklenemedi."))
  })
}

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [selectedMode, setSelectedMode] = useState(gameModes[0])
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulties[1])
  const [selectedNarration, setSelectedNarration] = useState(narrationStyles[0])
  const [customScenarioOpen, setCustomScenarioOpen] = useState(false)
  const [customScenario, setCustomScenario] = useState("")

  const [currentScene, setCurrentScene] = useState(initialScene)
  const [displayedImage, setDisplayedImage] = useState(initialScene.image)
  const [isImageLoading, setIsImageLoading] = useState(false)

  const [messages, setMessages] = useState([
    { sender: "ai", text: "Oyuna başlamak için bir seçim yap." },
  ])

  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [isRollingDice, setIsRollingDice] = useState(false)
  const [diceRoll, setDiceRoll] = useState(null)
  const [diceResult, setDiceResult] = useState("")
  const [health, setHealth] = useState(85)
  const [energy, setEnergy] = useState(60)
  const [saveMessage, setSaveMessage] = useState("")

  const chatMessagesRef = useRef(null)

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages, isThinking, isRollingDice, diceRoll])

  const getActiveScenario = () => {
    const trimmedScenario = customScenario.trim()

    if (selectedMode.id === "custom" && trimmedScenario) {
      return {
        id: "custom",
        title: "Özel Senaryo",
        description: trimmedScenario,
        icon: "➕",
      }
    }

    return selectedMode
  }

  const selectDefaultMode = (mode) => {
    setSelectedMode(mode)
    setCustomScenarioOpen(false)
  }

  const selectCustomScenario = () => {
    const trimmedScenario = customScenario.trim()

    setSelectedMode({
      id: "custom",
      title: "Özel Senaryo",
      description: trimmedScenario || "Oyuncunun kendi yazdığı özel hikâye evreni.",
      icon: "➕",
    })

    setCustomScenarioOpen(true)
  }

  const showSaveMessage = (text) => {
    setSaveMessage(text)
    setTimeout(() => setSaveMessage(""), 2200)
  }

  const startGame = () => {
    const activeScenario = getActiveScenario()
    const startingHealth = selectedDifficulty.id === "hard" ? 70 : 85
    const startingEnergy = selectedDifficulty.id === "hard" ? 50 : 60

    const startingScene = {
      ...initialScene,
      title: `${activeScenario.title} Macerası`,
      description: `${activeScenario.description} İlk kararın hikâyeyi başlatacak.`,
    }

    setHealth(startingHealth)
    setEnergy(startingEnergy)
    setCurrentScene(startingScene)
    setDisplayedImage(startingScene.image)
    setIsImageLoading(false)

    setMessages([
      {
        sender: "ai",
        text: `${activeScenario.title} modunda oyun başladı. İlk hamleni seç.`,
      },
    ])

    setInput("")
    setIsThinking(false)
    setIsRollingDice(false)
    setDiceRoll(null)
    setDiceResult("")
    setIsGameStarted(true)
  }

  const returnToMenu = () => {
    setIsGameStarted(false)
    setSaveMessage("")
  }

  const callAI = async (actionText, diceData = null) => {
    const activeScenario = getActiveScenario()

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: actionText,
        dice: diceData,
        mode: activeScenario.title,
        customScenario: activeScenario.description,
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

  const normalizeChoices = (choices) => {
    if (!Array.isArray(choices) || choices.length === 0) {
      return currentScene.choices
    }

    return choices.map((choice) => {
      if (typeof choice === "string") {
        return {
          text: choice,
          clue: "",
        }
      }

      return {
        text: choice.text || choice.label || "Devam et",
        clue: choice.clue || choice.hint || "",
      }
    })
  }

  const normalizeAIData = (data) => {
    return {
      scene: {
        title: data.scene?.title || currentScene.title,
        chapter: data.scene?.chapter || currentScene.chapter,
        description: data.scene?.description || currentScene.description,
        image: data.scene?.imageUrl || data.scene?.image || currentScene.image,
        location: data.stats?.location || currentScene.location,
        mission: data.stats?.mission || currentScene.mission,
        choices: normalizeChoices(data.choices),
      },
      aiMessage: data.aiMessage || "Hikâye devam ediyor.",
      healthChange: Number(data.stats?.healthChange || 0),
      energyChange: Number(data.stats?.energyChange || 0),
    }
  }

  const updateSceneWithPreloadedImage = async (nextScene) => {
    const nextImage = nextScene.image || currentScene.image

    if (nextImage === displayedImage) {
      setCurrentScene(nextScene)
      return
    }

    setIsImageLoading(true)

    try {
      await preloadSceneImage(nextImage)
      setCurrentScene(nextScene)
      setDisplayedImage(nextImage)
    } catch (error) {
      console.error("Image preload failed:", error)
      setCurrentScene(nextScene)
    } finally {
      setIsImageLoading(false)
    }
  }

  const handleAction = async (actionText, diceData = null) => {
    if (isThinking || isRollingDice) return

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: diceData
          ? `${actionText}\n🎲 Zar sonucu: ${diceData.roll}/20 — ${diceData.result}`
          : actionText,
      },
    ])

    setIsThinking(true)

    try {
      const aiData = await callAI(actionText, diceData)
      const normalizedData = normalizeAIData(aiData)

      await updateSceneWithPreloadedImage(normalizedData.scene)

      setHealth((prev) => Math.max(0, Math.min(100, prev + normalizedData.healthChange)))
      setEnergy((prev) => Math.max(0, Math.min(100, prev + normalizedData.energyChange)))

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: normalizedData.aiMessage,
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
      setDiceRoll(null)
      setDiceResult("")
    }
  }

  const handleDiceRoll = async (actionText) => {
    if (isThinking || isRollingDice) return

    const roll = rollD20()
    const result = getDiceResult(roll, selectedDifficulty.id)

    setDiceRoll(null)
    setDiceResult("")
    setIsRollingDice(true)

    await delay(700)

    setDiceRoll(roll)
    setDiceResult(result)

    await delay(900)

    setIsRollingDice(false)

    await handleAction(actionText, {
      type: "d20",
      roll,
      result,
      difficulty: selectedDifficulty.id,
    })
  }

  const handleSendMessage = () => {
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    setInput("")
    handleDiceRoll(trimmedInput)
  }

  const handleNewGame = () => {
    startGame()
  }

  const handleSaveGame = () => {
    const saveData = {
      selectedMode,
      selectedDifficulty,
      selectedNarration,
      customScenario,
      customScenarioOpen,
      currentScene,
      displayedImage,
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
    setCustomScenario(parsedData.customScenario || "")
    setCustomScenarioOpen(parsedData.customScenarioOpen || false)
    setCurrentScene(parsedData.currentScene)
    setDisplayedImage(parsedData.displayedImage || parsedData.currentScene?.image || initialScene.image)
    setMessages(parsedData.messages)
    setHealth(parsedData.health)
    setEnergy(parsedData.energy)
    setIsImageLoading(false)
    setIsGameStarted(true)

    showSaveMessage("Kayıt yüklendi.")
  }

  const activeScenario = getActiveScenario()

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
                <strong>{activeScenario.title}</strong>
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
                    className={`setup-card ${selectedMode.id === mode.id ? "active" : ""
                      }`}
                    onClick={() => selectDefaultMode(mode)}
                  >
                    <div className="setup-icon">{mode.icon}</div>
                    <strong>{mode.title}</strong>
                    <p>{mode.description}</p>
                  </button>
                ))}

                <button
                  className={`setup-card custom-scenario-card ${selectedMode.id === "custom" ? "active" : ""
                    }`}
                  onClick={selectCustomScenario}
                >
                  <div className="setup-icon">＋</div>
                  <strong>Kendi Senaryonu Yaz</strong>
                  <p>İstediğin evreni, karakterleri ve başlangıç olayını sen belirle.</p>
                </button>
              </div>

              {customScenarioOpen && (
                <div className="custom-scenario-box">
                  <label>Kendi senaryon</label>
                  <textarea
                    value={customScenario}
                    placeholder="Örn: Oyuncu, terk edilmiş bir uzay gemisinde uyanır. Geminin yapay zekâsı bozulmuştur ve her kapının arkasında farklı bir zaman kırılması vardır..."
                    onChange={(event) => {
                      setCustomScenario(event.target.value)
                      setSelectedMode({
                        id: "custom",
                        title: "Özel Senaryo",
                        description:
                          event.target.value.trim() ||
                          "Oyuncunun kendi yazdığı özel hikâye evreni.",
                        icon: "➕",
                      })
                    }}
                  />
                </div>
              )}
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
                    className={`setup-card ${selectedDifficulty.id === difficulty.id ? "active" : ""
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
                    className={`setup-card ${selectedNarration.id === style.id ? "active" : ""
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
            <img
              src={displayedImage}
              alt={currentScene.title}
              className={`scene-main-image ${isImageLoading ? "scene-loading" : "scene-loaded"
                }`}
            />

            {isImageLoading && (
              <div className="scene-image-loading-badge">
                Yeni sahne yükleniyor...
              </div>
            )}

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
              <strong>{activeScenario.title}</strong>
            </div>
            <div>
              <span>Zorluk / Anlatım</span>
              <strong>
                {selectedDifficulty.title} / {selectedNarration.title}
              </strong>
            </div>
          </div>
        </div>

        <aside className="chat-section">
          <div className="chat-header">
            <div>
              <h2>AI Anlatıcı</h2>
              <p>Hikâyeyi seçimlerinle yönlendir</p>
            </div>
            <div className="online-dot" />
          </div>

          {saveMessage && <div className="save-message">{saveMessage}</div>}

          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`message ${message.sender === "ai" ? "ai-message" : "user-message"
                  }`}
              >
                {message.text}
              </div>
            ))}

            {isRollingDice && (
              <div className="dice-roll-card">
                <div className="dice-icon">🎲</div>

                <div className="dice-roll-content">
                  <span>Zar atılıyor...</span>

                  {diceRoll ? (
                    <>
                      <strong>{diceRoll}/20</strong>
                      <p>{diceResult}</p>
                    </>
                  ) : (
                    <p>Şans hikâyeyi şekillendiriyor.</p>
                  )}
                </div>
              </div>
            )}

            {isThinking && (
              <div className="message ai-message thinking">
                AI zar sonucuna göre yeni sahneyi oluşturuyor...
              </div>
            )}
          </div>

          <div className="choices">
            {currentScene.choices.map((choice, index) => {
              const choiceText = typeof choice === "string" ? choice : choice.text
              const choiceClue = typeof choice === "string" ? "" : choice.clue

              return (
                <button
                  key={`${choiceText}-${index}`}
                  onClick={() => handleDiceRoll(choiceText)}
                  disabled={isThinking || isRollingDice}
                  className="choice-button"
                >
                  <span className="choice-text">{choiceText}</span>

                  {choiceClue && (
                    <span className="choice-clue">{choiceClue}</span>
                  )}
                </button>
              )
            })}
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
              disabled={isThinking || isRollingDice}
            />
            <button onClick={handleSendMessage} disabled={isThinking || isRollingDice}>
              Gönder
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App