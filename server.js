const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Configuration
const NIM_API_BASE = process.env.NIM_API_BASE || 'https://integrate.api.nvidia.com/v1';
const NIM_API_KEY = process.env.NIM_API_KEY;
const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// OPENROUTER DAILY LIMIT PROTECTION!
const OPENROUTER_DAILY_LIMIT = parseFloat(process.env.OPENROUTER_DAILY_LIMIT || '2.0');
let openrouterDailySpend = 0;
let lastResetDate = new Date().toDateString();

function checkAndResetDailyLimit() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    openrouterDailySpend = 0;
    lastResetDate = today;
    console.log('✅ OpenRouter daily limit reset!');
  }
}

const MODEL_MAPPING = {
  // 🌙 Kimi/Moonshot (Creative)
  'kimi-k2': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  'kimi': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  
  // 🧠 DeepSeek (Reasoning) - BOTH PROVIDERS!
  'deepseek-r1': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia', reasoning: true },
  'deepseek': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia', reasoning: true },
  'deepseek-r1-openrouter': { model: 'deepseek/deepseek-r1', provider: 'openrouter', reasoning: true },
  
  // 🤖 GLM (OpenRouter - FREE!)
  'glm-4': { model: 'thudm/glm-4-32b:free', provider: 'openrouter' },
  'glm-4-32b': { model: 'thudm/glm-4-32b:free', provider: 'openrouter' },
  'glm-z1-9b': { model: 'thudm/glm-z1-9b:free', provider: 'openrouter', reasoning: true },
  'chatglm': { model: 'thudm/glm-4-32b:free', provider: 'openrouter' },
  
  // 🦙 Llama Family
  'llama-405b': { model: 'meta/llama-3.1-405b-instruct', provider: 'nvidia', timeout: 300000 },
  'llama-70b': { model: 'meta/llama-3.1-70b-instruct', provider: 'nvidia' },
  'llama-8b': { model: 'meta/llama-3.1-8b-instruct', provider: 'nvidia' },
  'llama-3.3-70b': { model: 'meta/llama-3.3-70b-instruct', provider: 'nvidia' },
  'llama-3-70b': { model: 'meta/llama-3-70b-instruct', provider: 'nvidia' },
  'llama-3-8b': { model: 'meta/llama-3-8b-instruct', provider: 'nvidia' },
  'llama-2-70b': { model: 'meta/llama-2-70b-chat', provider: 'nvidia' },
  'llama-2-13b': { model: 'meta/llama-2-13b-chat', provider: 'nvidia' },
  'llama-2-7b': { model: 'meta/llama-2-7b-chat', provider: 'nvidia' },
  
  // 🎨 Mixtral/Mistral
  'mixtral-8x22b': { model: 'mistralai/mixtral-8x22b-instruct-v0.1', provider: 'nvidia' },
  'mixtral-8x7b': { model: 'mistralai/mixtral-8x7b-instruct-v0.1', provider: 'nvidia' },
  'mistral-7b': { model: 'mistralai/mistral-7b-instruct-v0.3', provider: 'nvidia' },
  
  // 🤖 Nemotron
  'nemotron-70b': { model: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'nvidia' },
  'nemotron-253b': { model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', provider: 'nvidia', timeout: 600000 },
  'nemotron-340b': { model: 'nvidia/nemotron-4-340b-instruct', provider: 'nvidia', timeout: 600000 },
  
  // 🇨🇳 Qwen
  'qwen-72b': { model: 'qwen/qwen2.5-72b-instruct', provider: 'nvidia' },
  'qwen-32b': { model: 'qwen/qwq-32b-preview', provider: 'nvidia', reasoning: true },
  'qwen-7b': { model: 'qwen/qwen2.5-7b-instruct', provider: 'nvidia' },
  
  // 🟢 Gemma
  'gemma-27b': { model: 'google/gemma-2-27b-it', provider: 'nvidia' },
  'gemma-9b': { model: 'google/gemma-2-9b-it', provider: 'nvidia' },
  
  // 🔵 Phi
  'phi-3-medium': { model: 'microsoft/phi-3-medium-128k-instruct', provider: 'nvidia' },
  'phi-3-mini': { model: 'microsoft/phi-3-mini-128k-instruct', provider: 'nvidia' },
  
  // 🏢 Granite
  'granite-34b': { model: 'ibm/granite-34b-code-instruct', provider: 'nvidia' },
  'granite-8b': { model: 'ibm/granite-8b-code-instruct', provider: 'nvidia' },
  
  // 🌐 Yi
  'yi-large': { model: '01-ai/yi-large', provider: 'nvidia' },
  'yi-34b': { model: '01-ai/yi-34b-chat', provider: 'nvidia' },
  
  // ⚡ GROQ
  'groq-llama-70b': { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  'groq-llama-8b': { model: 'llama-3.1-8b-instant', provider: 'groq' },
  'groq-mixtral': { model: 'mixtral-8x7b-32768', provider: 'groq' },
  
  // Aliases
  'gpt-4-turbo': { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  'gpt-4': { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  'gpt-3.5-turbo': { model: 'llama-3.1-8b-instant', provider: 'groq' },
  'default': { model: 'llama-3.1-8b-instant', provider: 'groq' }
};

app.get('/health', (req, res) => {
  checkAndResetDailyLimit();
  res.json({ 
    status: 'ok', 
    providers: {
      nvidia: NIM_API_KEY ? 'configured' : 'missing',
      groq: GROQ_API_KEY ? 'configured' : 'missing',
      openrouter: OPENROUTER_API_KEY ? 'configured' : 'missing'
    },
    openrouter_daily_spend: `$${openrouterDailySpend.toFixed(4)}`,
    openrouter_daily_limit: `$${OPENROUTER_DAILY_LIMIT}`,
    total_models: Object.keys(MODEL_MAPPING).length
  });
});

app.get('/v1/models', (req, res) => {
  const models = Object.keys(MODEL_MAPPING).map(model => ({
    id: model,
    object: 'model',
    created: Date.now(),
    owned_by: MODEL_MAPPING[model].provider
  }));
  res.json({ object: 'list', data: models });
});

app.post(['/chat/completions', '/v1/chat/completions'], async (req, res) => {
  try {
    checkAndResetDailyLimit();
    
    const { model, messages, temperature, max_tokens, stream, frequency_penalty, presence_penalty } = req.body;
    
    const modelInfo = MODEL_MAPPING[model] || MODEL_MAPPING['default'];
    const provider = modelInfo.provider;
    const actualModel = modelInfo.model;
    const customTimeout = modelInfo.timeout;
    const isReasoningModel = modelInfo.reasoning || false;
    
    if (provider === 'openrouter' && openrouterDailySpend >= OPENROUTER_DAILY_LIMIT) {
      return res.status(429).json({
        error: { 
          message: `OpenRouter daily limit reached ($${OPENROUTER_DAILY_LIMIT})`,
          type: 'rate_limit_error'
        }
      });
    }
    
    let apiBase, apiKey, timeout;
    if (provider === 'groq') {
      apiBase = GROQ_API_BASE;
      apiKey = GROQ_API_KEY;
      timeout = 60000;
    } else if (provider === 'openrouter') {
      apiBase = OPENROUTER_API_BASE;
      apiKey = OPENROUTER_API_KEY;
      timeout = 180000;
    } else {
      apiBase = NIM_API_BASE;
      apiKey = NIM_API_KEY;
      timeout = customTimeout || 180000;
    }
    
    if (!apiKey) {
      return res.status(500).json({
        error: { message: `${provider} API key not configured`, type: 'configuration_error' }
      });
    }
    
    const requestBody = {
      model: actualModel,
      messages: messages,
      temperature: temperature || 0.5,
      max_tokens: max_tokens || 100000,
      frequency_penalty: frequency_penalty || 0.4,
      stream: stream || false
    };
    
    console.log(`[${provider.toUpperCase()}] ${model} → ${actualModel}${isReasoningModel ? ' 🧠' : ''}`);
    
    const response = await axios.post(`${apiBase}/chat/completions`, requestBody, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: stream ? 'stream' : 'json',
      timeout: timeout
    });
    
    if (provider === 'openrouter' && response.data.usage) {
      const tokens = (response.data.usage.prompt_tokens || 0) + (response.data.usage.completion_tokens || 0);
      const cost = (tokens / 1000000) * 0.50;
      openrouterDailySpend += cost;
      console.log(`💰 +$${cost.toFixed(6)} (Total: $${openrouterDailySpend.toFixed(4)})`);
    }
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      response.data.pipe(res);
    } else {
      res.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: response.data.choices,
        usage: response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      });
    }
    
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.message || error.message || 'Internal server error',
        type: 'invalid_request_error'
      }
    });
  }
});

app.all('*', (req, res) => {
  res.status(404).json({ error: { message: `Endpoint ${req.path} not found`, type: 'invalid_request_error' } });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy with ${Object.keys(MODEL_MAPPING).length} models!`);
  console.log(`💰 OpenRouter limit: $${OPENROUTER_DAILY_LIMIT}/day`);
  console.log(`🧠 TRY REASONING: deepseek-r1-openrouter (shows thinking better!)`);
});
