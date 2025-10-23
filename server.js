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
const HF_API_BASE = 'https://router.huggingface.co/v1';
const HF_API_KEY = process.env.HF_API_KEY;

// EXPANDED Model mapping
const MODEL_MAPPING = {
  // 🌙 Kimi/Moonshot (Creative) - VERIFIED ✅
  'kimi-k2': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  'kimi': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  'moonshot': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  
  // 🧠 DeepSeek (Reasoning) - VERIFIED ✅
  'deepseek-r1': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia' },
  'deepseek': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia' },
  
  // 🤖 GLM (via Hugging Face) - FREE! ✅
  'glm-4': { model: 'THUDM/glm-4-9b-chat', provider: 'huggingface' },
  'glm-4-9b': { model: 'THUDM/glm-4-9b-chat', provider: 'huggingface' },
  'chatglm': { model: 'THUDM/glm-4-9b-chat', provider: 'huggingface' },
  
  // 🦙 Llama 3.x Family (Latest) - VERIFIED ✅
  'llama-405b': { model: 'meta/llama-3.1-405b-instruct', provider: 'nvidia', timeout: 300000 },
  'llama-70b': { model: 'meta/llama-3.1-70b-instruct', provider: 'nvidia' },
  'llama-8b': { model: 'meta/llama-3.1-8b-instruct', provider: 'nvidia' },
  'llama-3.3-70b': { model: 'meta/llama-3.3-70b-instruct', provider: 'nvidia' },
  'llama-3-70b': { model: 'meta/llama-3-70b-instruct', provider: 'nvidia' },
  'llama-3-8b': { model: 'meta/llama-3-8b-instruct', provider: 'nvidia' },
  
  // 🦙 Llama 2 Family (Stable) - VERIFIED ✅
  'llama-2-70b': { model: 'meta/llama-2-70b-chat', provider: 'nvidia' },
  'llama-2-13b': { model: 'meta/llama-2-13b-chat', provider: 'nvidia' },
  'llama-2-7b': { model: 'meta/llama-2-7b-chat', provider: 'nvidia' },
  
  // 🎨 Mixtral/Mistral Family - VERIFIED ✅
  'mixtral-8x22b': { model: 'mistralai/mixtral-8x22b-instruct-v0.1', provider: 'nvidia' },
  'mixtral-8x7b': { model: 'mistralai/mixtral-8x7b-instruct-v0.1', provider: 'nvidia' },
  'mistral-7b': { model: 'mistralai/mistral-7b-instruct-v0.3', provider: 'nvidia' },
  
  // 🤖 NVIDIA Nemotron - VERIFIED ✅
  'nemotron-70b': { model: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'nvidia' },
  
  // 🤖 NVIDIA Nemotron Extended - BIG MODELS
  'nemotron-253b': { model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', provider: 'nvidia', timeout: 600000 },
  'nemotron-49b': { model: 'nvidia/llama-3.3-nemotron-super-49b-v1', provider: 'nvidia', timeout: 300000 },
  'nemotron-340b': { model: 'nvidia/nemotron-4-340b-instruct', provider: 'nvidia', timeout: 600000 },
  'nemotron-8b': { model: 'nvidia/llama-3.1-nemotron-nano-8b-v1', provider: 'nvidia' },
  'nemotron-4b': { model: 'nvidia/llama-3.1-nemotron-nano-4b-v1.1', provider: 'nvidia' },
  
  // 🇨🇳 Qwen Family - VERIFIED ✅
  'qwen-72b': { model: 'qwen/qwen2.5-72b-instruct', provider: 'nvidia' },
  'qwen-32b': { model: 'qwen/qwq-32b-preview', provider: 'nvidia' },
  'qwen-7b': { model: 'qwen/qwen2.5-7b-instruct', provider: 'nvidia' },
  
  // 🟢 Google Gemma - VERIFIED ✅
  'gemma-27b': { model: 'google/gemma-2-27b-it', provider: 'nvidia' },
  'gemma-9b': { model: 'google/gemma-2-9b-it', provider: 'nvidia' },
  'gemma-2b': { model: 'google/gemma-2-2b-it', provider: 'nvidia' },
  
  // ⚡ GROQ Models (ULTRA FAST!) - VERIFIED ✅
  'groq-llama-70b': { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  'groq-llama-8b': { model: 'llama-3.1-8b-instant', provider: 'groq' },
  'groq-mixtral': { model: 'mixtral-8x7b-32768', provider: 'groq' },
  'groq-gemma-9b': { model: 'gemma2-9b-it', provider: 'groq' },
  
  // Fast aliases
  'llama-70b-fast': { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  
  // Standard OpenAI aliases
  'gpt-4-turbo': { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  'gpt-4': { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  'gpt-3.5-turbo': { model: 'llama-3.1-8b-instant', provider: 'groq' },
  
  // Fallback
  'default': { model: 'llama-3.1-8b-instant', provider: 'groq' }
};

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    providers: {
      nvidia: NIM_API_KEY ? 'configured' : 'missing',
      groq: GROQ_API_KEY ? 'configured' : 'missing',
      huggingface: HF_API_KEY ? 'configured' : 'missing'
    },
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
  
  res.json({
    object: 'list',
    data: models
  });
});

// Handle both /chat/completions and /v1/chat/completions
app.post(['/chat/completions', '/v1/chat/completions'], async (req, res) => {
  try {
    const { model, messages, temperature, max_tokens, stream } = req.body;
    
    // Get model info
    const modelInfo = MODEL_MAPPING[model] || MODEL_MAPPING['default'];
    const provider = modelInfo.provider;
    const actualModel = modelInfo.model;
    const customTimeout = modelInfo.timeout;
    
    // Select API based on provider
    let apiBase, apiKey, timeout;
    if (provider === 'groq') {
      apiBase = GROQ_API_BASE;
      apiKey = GROQ_API_KEY;
      timeout = customTimeout || 60000;
      if (!apiKey) {
        return res.status(500).json({
          error: { message: 'Groq API key not configured', type: 'configuration_error' }
        });
      }
    } else if (provider === 'huggingface') {
      apiBase = HF_API_BASE;
      apiKey = HF_API_KEY;
      timeout = customTimeout || 180000;
      if (!apiKey) {
        return res.status(500).json({
          error: { message: 'Hugging Face API key not configured. Get one at https://huggingface.co/settings/tokens', type: 'configuration_error' }
        });
      }
    } else {
      apiBase = NIM_API_BASE;
      apiKey = NIM_API_KEY;
      timeout = customTimeout || 180000;
      if (!apiKey) {
        return res.status(500).json({
          error: { message: 'NVIDIA API key not configured', type: 'configuration_error' }
        });
      }
    }
    
    const requestBody = {
      model: actualModel,
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2048,
      stream: stream || false
    };
    
    console.log(`[${provider.toUpperCase()}] ${model} → ${actualModel}`);
    
    const response = await axios.post(`${apiBase}/chat/completions`, requestBody, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: stream ? 'stream' : 'json',
      timeout: timeout
    });
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      response.data.pipe(res);
    } else {
      const openaiResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: response.data.choices.map(choice => ({
          index: choice.index,
          message: choice.message,
          finish_reason: choice.finish_reason
        })),
        usage: response.data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
      
      res.json(openaiResponse);
    }
    
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.message || error.message || 'Internal server error',
        type: 'invalid_request_error',
        code: error.response?.status || 500
      }
    });
  }
});

// 404 handler
app.all('*', (req, res) => {
  console.log(`404 - ${req.method} ${req.path}`);
  res.status(404).json({
    error: {
      message: `Endpoint ${req.path} not found. Available endpoints: /health, /v1/models, /v1/chat/completions`,
      type: 'invalid_request_error',
      code: 404,
      available_endpoints: ['/health', '/v1/models', '/v1/chat/completions']
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Multi-Provider Proxy with ${Object.keys(MODEL_MAPPING).length} models!`);
  console.log(`⚡
