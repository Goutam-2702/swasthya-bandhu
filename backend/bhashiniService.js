// ============================================================
// BHASHINI API SERVICE - Swasthya Bandhu
// Supports: ASR (Speech → Text) & TTS (Text → Speech)
// Languages: Hindi, Bengali, Tamil, Telugu, Gujarati, Marathi, English
// Docs: https://bhashini.gov.in/ulca/model/explore-models
// ============================================================

const axios = require('axios');

// --- Bhashini Config ---
// Get your free API key from: https://bhashini.gov.in/
const BHASHINI_USER_ID     = process.env.BHASHINI_USER_ID     || '';
const BHASHINI_API_KEY     = process.env.BHASHINI_API_KEY     || '';
const BHASHINI_PIPELINE_ID = process.env.BHASHINI_PIPELINE_ID || 'your-pipeline-id';

// Bhashini + Google TTS language code map (all 22 official Indian languages)
const LANGUAGE_CODE_MAP = {
  // ── Tier 1: Full Bhashini + Google TTS support ──────────────────────────
  'English':    'en',
  'Hindi':      'hi',
  'Bengali':    'bn',
  'Tamil':      'ta',
  'Telugu':     'te',
  'Gujarati':   'gu',
  'Marathi':    'mr',
  'Kannada':    'kn',
  'Malayalam':  'ml',
  'Punjabi':    'pa',
  'Urdu':       'ur',
  'Nepali':     'ne',
  // ── Tier 2: Bhashini support (Google TTS may not have all voices) ────────
  'Odia':       'or',       // Oriya
  'Assamese':   'as',
  'Maithili':   'mai',
  'Konkani':    'gom',
  'Sindhi':     'sd',
  'Dogri':      'doi',
  'Kashmiri':   'ks',
  'Santali':    'sat',
  'Sanskrit':   'sa',
  'Manipuri':   'mni',      // Meitei
  'Bodo':       'brx',
};

// ─── Helper: Get Bhashini Pipeline Config ──────────────────────────────────
async function getPipelineConfig(task, sourceLanguage, targetLanguage = null) {
  try {
    const payload = {
      pipelineTasks: [
        {
          taskType: task,  // 'asr', 'tts', or 'translation'
          config: {
            language: {
              sourceLanguage: LANGUAGE_CODE_MAP[sourceLanguage] || 'hi',
              ...(targetLanguage && { targetLanguage: LANGUAGE_CODE_MAP[targetLanguage] || 'en' })
            }
          }
        }
      ],
      pipelineRequestConfig: {
        pipelineId: BHASHINI_PIPELINE_ID
      }
    };

    const res = await axios.post(
      'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline',
      payload,
      {
        headers: {
          'userID': BHASHINI_USER_ID,
          'ulcaApiKey': BHASHINI_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data;
  } catch (err) {
    console.error('[Bhashini] getPipelineConfig error:', err?.response?.data || err.message);
    throw err;
  }
}

// ─── TEXT TO SPEECH (TTS) ──────────────────────────────────────────────────
// Returns: base64 encoded audio (wav/mp3)
async function bhashiniTTS(text, language = 'Hindi', gender = 'female') {
  try {
    const langCode = LANGUAGE_CODE_MAP[language] || 'hi';

    // Step 1: Get the pipeline config for TTS
    const pipelineConfig = await getPipelineConfig('tts', language);
    const serviceConfig = pipelineConfig?.pipelineResponseConfig?.[0]?.config?.[0];

    if (!serviceConfig) {
      throw new Error('No TTS service config returned from Bhashini');
    }

    const serviceId     = serviceConfig.serviceId;
    const callbackUrl   = pipelineConfig.pipelineInferenceAPIEndPoint?.callbackUrl;
    const inferenceApiKey = pipelineConfig.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

    // Step 2: Call Bhashini TTS inference
    const ttsPayload = {
      pipelineTasks: [
        {
          taskType: 'tts',
          config: {
            language: { sourceLanguage: langCode },
            serviceId: serviceId,
            gender: gender,     // 'male' or 'female'
            samplingRate: 8000
          }
        }
      ],
      inputData: {
        input: [{ source: text }]
      }
    };

    const ttsRes = await axios.post(callbackUrl, ttsPayload, {
      headers: {
        Authorization: inferenceApiKey,
        'Content-Type': 'application/json'
      }
    });

    const audioContent = ttsRes.data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
    if (!audioContent) throw new Error('No audio returned from Bhashini TTS');

    return audioContent; // base64 string (wav)
  } catch (err) {
    console.error('[Bhashini TTS] Error:', err?.response?.data || err.message);
    throw err;
  }
}

// ─── AUTOMATIC SPEECH RECOGNITION (ASR) ────────────────────────────────────
// Input: base64 audio string, language
// Returns: transcribed text
async function bhashiniASR(audioBase64, language = 'Hindi') {
  try {
    const langCode = LANGUAGE_CODE_MAP[language] || 'hi';

    // Step 1: Get pipeline config for ASR
    const pipelineConfig = await getPipelineConfig('asr', language);
    const serviceConfig = pipelineConfig?.pipelineResponseConfig?.[0]?.config?.[0];

    if (!serviceConfig) {
      throw new Error('No ASR service config returned from Bhashini');
    }

    const serviceId     = serviceConfig.serviceId;
    const callbackUrl   = pipelineConfig.pipelineInferenceAPIEndPoint?.callbackUrl;
    const inferenceApiKey = pipelineConfig.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

    // Step 2: Call Bhashini ASR inference
    const asrPayload = {
      pipelineTasks: [
        {
          taskType: 'asr',
          config: {
            language: { sourceLanguage: langCode },
            serviceId: serviceId,
            audioFormat: 'wav',
            samplingRate: 16000
          }
        }
      ],
      inputData: {
        audio: [{ audioContent: audioBase64 }]
      }
    };

    const asrRes = await axios.post(callbackUrl, asrPayload, {
      headers: {
        Authorization: inferenceApiKey,
        'Content-Type': 'application/json'
      }
    });

    const transcript = asrRes.data?.pipelineResponse?.[0]?.output?.[0]?.source;
    if (!transcript) throw new Error('No transcript returned from Bhashini ASR');

    return transcript;
  } catch (err) {
    console.error('[Bhashini ASR] Error:', err?.response?.data || err.message);
    throw err;
  }
}

// ─── TRANSLATION ───────────────────────────────────────────────────────────
// Translate text between any two supported languages
async function bhashiniTranslate(text, sourceLanguage = 'English', targetLanguage = 'Hindi') {
  try {
    const sourceLangCode = LANGUAGE_CODE_MAP[sourceLanguage] || 'en';
    const targetLangCode = LANGUAGE_CODE_MAP[targetLanguage] || 'hi';

    const pipelineConfig = await getPipelineConfig('translation', sourceLanguage, targetLanguage);
    const serviceConfig = pipelineConfig?.pipelineResponseConfig?.[0]?.config?.[0];

    if (!serviceConfig) throw new Error('No translation service config returned from Bhashini');

    const serviceId     = serviceConfig.serviceId;
    const callbackUrl   = pipelineConfig.pipelineInferenceAPIEndPoint?.callbackUrl;
    const inferenceApiKey = pipelineConfig.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

    const translatePayload = {
      pipelineTasks: [
        {
          taskType: 'translation',
          config: {
            language: {
              sourceLanguage: sourceLangCode,
              targetLanguage: targetLangCode
            },
            serviceId: serviceId
          }
        }
      ],
      inputData: {
        input: [{ source: text }]
      }
    };

    const transRes = await axios.post(callbackUrl, translatePayload, {
      headers: {
        Authorization: inferenceApiKey,
        'Content-Type': 'application/json'
      }
    });

    const translated = transRes.data?.pipelineResponse?.[0]?.output?.[0]?.target;
    if (!translated) throw new Error('No translation returned from Bhashini');

    return translated;
  } catch (err) {
    console.error('[Bhashini Translate] Error:', err?.response?.data || err.message);
    throw err;
  }
}

module.exports = { bhashiniTTS, bhashiniASR, bhashiniTranslate, LANGUAGE_CODE_MAP };
