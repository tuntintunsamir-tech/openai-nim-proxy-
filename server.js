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

// EXPANDED Model mapping with 40+ models!
const MODEL_MAPPING = {
  // 🌙 Kimi/Moonshot (Creative)
  'kimi-k2': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  'kimi': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  'moonshot': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  
  // 🧠 DeepSeek (Reasoning)
  'deepseek-r1': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia' },
  'deepseek': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia' },
  'deepseek-coder': { model: 'deepseek-ai/deepseek-coder-v2-lite-instruct', provider: 'nvidia' },
  
  // 🦙 Llama 3.x Family (Latest)
  'llama-405b': { model: 'meta/llama-3.1-405b-instruct', provider: 'nvidia' },
  'llama-70b': { model: 'meta/llama-3.1-70b-instruct', provider: 'nvidia' },
  'llama-8b': { model: 'meta/llama-3.1-8b-instruct', provider: 'nvidia' },
  'llama-3.3-70b': { model: 'meta/llama-3.3-70b-instruct', provider: 'nvidia' },
  'llama-3.2-3b': { model: 'meta/llama-3.2-3b-instruct', provider: 'nvidia' },
  'llama-3.2-1b': { model: 'meta/llama-3.2-1b-instruct', provider: 'nvidia' },
  'llama-3-70b': { model: 'meta/llama-3-70b-instruct', provider: 'nvidia' },
  'llama-3-8b': { model: 'meta/llama-3-8b-instruct', provider: 'nvidia' },
  
  // 🦙 Llama 2 Family (Stable)
  'llama-2-70b': { model: 'meta/llama-2-70b-chat', provider: 'nvidia' },
  'llama-2-13b': { model: 'meta/llama-2-13b-chat', provider: 'nvidia' },
  'llama-2-7b': { model: 'meta/llama-2-7b-chat', provider: 'nvidia' },
  
  // 💻 Code Llama (For Coding)
  'codellama-70b': { model: 'meta/codellama-70b-instruct', provider: 'nvidia' },
  'codellama-34b': { model: 'meta/codellama-34b-instruct', provider: 'nvidia' },
  'codellama-13b': { model: 'meta/codellama-13b-instruct', provider: 'nvidia' },
  
  // 🎨 Mixtral/Mistral Family
  'mixtral-8x22b': { model: 'mistralai/mixtral-8x22b-instruct-v0.1', provider: 'nvidia' },
  'mixtral-8x7b': { model: 'mistralai/mixtral-8x7b-instruct-v0.1', provider: 'nvidia' },
  'mistral-7b': { model: 'mistralai/mistral-7b-instruct-v0.3', provider: 'nvidia' },
  'mistral-nemo-12b': { model: 'nv-mistralai/mistral-nemo-12b-instruct', provider: 'nvidia' },
  'mistral-small': { model: 'mistralai/mistral-small-24b-instruct-2501', provider: 'nvidia' },
  
  // 🤖 NVIDIA Nemotron Family
  'nemotron-70b': { model: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'nvidia' },
  'nemotron-ultra-253b': { model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', provider: 'nvidia' },
  'nemotron-super-49b': { model: 'nvidia/llama-3.3-nemotron-super-49b-v1', provider: 'nvidia' },
  'nemotron-nano-8b': { model: 'nvidia/llama-3.1-nemotron-nano-8b-v1', provider: 'nvidia' },
  'nemotron-nano-4b': { model: 'nvidia/llama-3.1-nemotron-nano-4b-v1.1', provider: 'nvidia' },
  'nemotron-340b': { model: 'nvidia/nemotron-4-340b-instruct', provider: 'nvidia' },
  
  // 🇨🇳 Qwen Family
  'qwen-72b': { model: 'qwen/qwen2.5-72b-instruct', provider: 'nvidia' },
  'qwen-32b': { model: 'qwen/qwq-32b-preview', provider: 'nvidia' },
  'qwen-7b': { model: 'qwen/qwen2.5-7b-instruct', provider: 'nvidia' },
  'qwen-coder-32b': { model: 'qwen/qwen2.5-coder-32b-instruct', provider: 'nvidia' },
  
  // 🟢 Google Gemma
  'gemma-27b': { model: 'google/gemma-2-27b-it', provider: 'nvidia' },
  'gemma-9b': { model: 'google/gemma-2-9b-it', provider: 'nvidia' },
  'gemma-2b': { model: 'google/gemma-2-2b-it', provider: 'nvidia' },
  
  // 🔵 Microsoft Phi
  'phi-3-mini': { model: 'microsoft/phi-3-mini-4k-instruct', provider: 'nvidia' },
  
  // 🏢 IBM Granite
  'granite-8b': { model: 'ibm/granite-3.3-8b-instruct', provider: 'nvidia' },
  
  // ⚡ GROQ Models (ULTRA FAST!)
  'groq-llama-70b': { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  'groq-llama-8b': { model: 'llama-3.1-8b-instant', provider: 'groq' },
  'groq-mixtral': { model: 'mixtral-8x7b-32768', provider: 'groq' },
  'groq-gemma-9b': { model: 'gemma2-9b-it', provider: 'groq' },
  
  // Fast aliases
  'llama-70b-fast': { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  
  // Standard OpenAI aliases (using fast Groq models)
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
      groq: GROQ_API_KEY ? 'configured' : 'missing'
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
    
    // Select API based on provider
    let apiBase, apiKey;
    if (provider === 'groq') {
      apiBase = GROQ_API_BASE;
      apiKey = GROQ_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: { message: 'Groq API key not configured', type: 'configuration_error' }
        });
      }
    } else {
      apiBase = NIM_API_BASE;
      apiKey = NIM_API_KEY;
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
      timeout: provider === 'groq' ? 60000 : 180000
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
  console.log(`⚡ GROQ (Fast): groq-llama-70b, groq-mixtral`);
  console.log(`🌙 NVIDIA (Quality): kimi-k2, deepseek-r1, llama-405b`);
  console.log(`🆕 NEW: Nemotron, Phi-3, Granite, Qwen expanded!`);
});
