const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.post('/api/tts', async (req, res) => {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    const speaker = process.env.SARVAM_SPEAKER;

    if (!apiKey || !speaker) {
      return res.status(500).json({
        error: 'Server settings are incomplete.'
      });
    }

    const text = req.body?.text;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Please enter text.' });
    }
    if (text.length > 2500) {
      return res.status(400).json({
        error: 'एका वेळी जास्तीत जास्त 2500 अक्षरे वापरा.'
      });
    }

    const response = await fetch(
      'https://api.sarvam.ai/text-to-speech/stream',
      {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model: 'bulbul:v4-flash',
          speaker,
          language_code: 'mr-IN',
          output_audio_codec: 'mp3',
          pace: 1.0
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('Sarvam API error:', response.status, detail);
      return res.status(502).json({
        error: 'ऑडिओ तयार झाला नाही. सेटिंग तपासा.'
      });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="marathi-audio.mp3"'
    );

    const audio = Buffer.from(await response.arrayBuffer());
    res.send(audio);
  } catch (error) {
    console.error('TTS error:', error.message);
    res.status(500).json({ error: 'सर्व्हरमध्ये त्रुटी आली.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Marathi Audio Maker server started');
});
