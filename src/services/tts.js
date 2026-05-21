function getBestVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.name.includes('Google') && v.lang === 'en-GB') ??
    voices.find(v => v.lang === 'en-GB') ??
    null
  )
}

function speakSequence(words, opts, voice) {
  function speakWord(index) {
    if (index >= words.length) return
    const utterance = new SpeechSynthesisUtterance(words[index])
    utterance.lang = 'en-GB'
    utterance.rate = opts.rate
    utterance.pitch = opts.pitch
    utterance.volume = opts.volume
    if (voice) utterance.voice = voice
    if (index < words.length - 1) {
      utterance.onend = () => setTimeout(() => speakWord(index + 1), opts.pauseMs)
    }
    window.speechSynthesis.speak(utterance)
  }
  speakWord(0)
}

export function speak(text, options = {}) {
  if (!window.speechSynthesis) return

  const opts = {
    rate: options.rate ?? 0.7,
    pitch: options.pitch ?? 1,
    volume: options.volume ?? 1,
    pauseMs: options.pauseMs ?? 350,
  }

  // iOS requires a brief pause after user interaction before synthesis triggers reliably
  setTimeout(() => {
    window.speechSynthesis.cancel()
    const voice = getBestVoice()
    const words = text.trim().split(/\s+/)
    speakSequence(words, opts, voice)
  }, 100)
}
