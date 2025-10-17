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

// EXPANDED Model mapping - VERIFIED WORKING ONLY!
const MODEL_MAPPING = {
  // 🌙 Kimi/Moonshot (Creative) - VERIFIED ✅
  'kimi-k2': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia', timeout: 300000 },
  'kimi': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia', timeout: 300000 },
  'moonshot': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia', timeout: 300000 },
  
  // 🧠 DeepSeek (Reasoning) - VERIFIED ✅ [TIMEOUT AUMENTADO]
  'deepseek-r1': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia', timeout: 600000 },
  'deepseek': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia', timeout: 600000 },
  'deepseek-reasoner': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia', timeout: 600000 },
  
  // 🦙 Llama 3.x Family (Latest) - VERIFIED ✅
  'llama-405b': { model: 'meta/llama-3.1-405b-instruct', provider: 'nvidia', timeout: 240000 },
  'llama-70b': { model: 'meta/llama-3.1-70b-instruct', provider: 'nvidia', timeout: 180000 },
  'llama-8b': { model: 'meta/llama-3.1-8b-instruct', provider: 'nvidia', timeout: 120000 },
  'llama-3.3-70b': { model: 'meta/llama-3.3-70b-instruct', provider: 'nvidia', timeout: 180000 },
  'llama-3-70b': { model: 'meta/llama-3-70b-instruct', provider: 'nvidia', timeout: 180000 },
  'llama-3-8b': { model: 'meta/llama-3-8b-instruct', provider: 'nvidia', timeout: 120000 },
  
  // 🦙 Llama 2 Family (Stable) - VERIFIED ✅
  'llama-2-70b': { model: 'meta/llama-2-70b-chat', provider: 'nvidia', timeout: 180000 },
  'llama-2-13b': { model: 'meta/llama-2-13b-chat', provider: 'nvidia', timeout: 120000 },
  'llama-2-7b': { model: 'meta/llama-2-7b-chat', provider: 'nvidia', timeout: 120000 },
  
  // 🎨 Mixtral/Mistral Family - VERIFIED ✅
  'mixtral-8x22b': { model: 'mistralai/mixtral-8x22b-instruct-v0.1', provider: 'nvidia', timeout: 180000 },
  'mixtral-8x7b': { model: 'mistralai/mixtral-8x7b-instruct-v0.1', provider: 'nvidia', timeout: 120000 },
  'mistral-7b': { model: 'mistralai/mistral-7b-instruct-v0.3', provider: 'nvidia', timeout: 120000 },
  
  // 🤖 NVIDIA Nemotron - VERIFIED ✅
  'nemotron-70b': { model: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'nvidia', timeout: 180000 },
  'nemotron-253b': { model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', provider: 'nvidia', timeout: 240000 },
  'nemotron-49b': { model: 'nvidia/llama-3.3-nemotron-super-49b-v1', provider: 'nvidia', timeout: 180000 },
  'nemotron-8b': { model: 'nvidia/llama-3.1-nemotron-nano-8b-v1', provider: 'nvidia', timeout: 120000 },
  'nemotron-4b': { model: 'nvidia/llama-3.1-nemotron-nano-4b-v1.1', provider: 'nvidia', timeout: 120000 },
  'nemotron-340b': { model: 'nvidia/nemotron-4-340b-instruct', provider: 'nvidia', timeout: 240000 },
  
  // 🇨🇳 Qwen Family - VERIFIED ✅
  'qwen-72b': { model: 'qwen/qwen2.5-72b-instruct', provider: 'nvidia', timeout: 180000 },
  'qwen-32b': { model: 'qwen/qwq-32b-preview', provider: 'nvidia', timeout: 240000 },
  'qwen-7b': { model: 'qwen/qwen2.5-7b-instruct', provider: 'nvidia', timeout: 120000 },
  
  // 🟢 Google Gemma - VERIFIED ✅
  'gemma-27b': { model: 'google/gemma-2-27b-it', provider: 'nvidia', timeout: 120000 },
  'gemma-9b': { model: 'google/gemma-2-9b-it', provider: 'nvidia', timeout: 90000 },
  'gemma-2b': { model: 'google/gemma-2-2b-it', provider: 'nvidia', timeout: 90000 },
  
  // ⚡ GROQ Models (ULTRA FAST!) - VERIFIED ✅
  'groq-llama-70b': { model: 'llama-3.3-70b-versatile', provider: 'groq', timeout: 60000 },
  'groq-llama-8b': { model: 'llama-3.1-8b-instant', provider: 'groq', timeout: 30000 },
  'groq-mixtral': { model: 'mixtral-8x7b-32768', provider: 'groq', timeout: 60000 },
  'groq-gemma-9b': { model: 'gemma2-9b-it', provider: 'groq', timeout: 30000 },
  
  // Fast aliases
  'llama-70b-fast': { model: 'llama-3.3-70b-versatile', provider: 'groq', timeout: 60000 },
  
  // Standard OpenAI aliases (using fast Groq models)
  'gpt-4-turbo': { model: 'llama-3.3-70b-versatile', provider: 'groq', timeout: 60000 },
  'gpt-4': { model: 'llama-3.3-70b-versatile', provider: 'groq', timeout: 60000 },
  'gpt-3.5-turbo': { model: 'llama-3.1-8b-instant', provider: 'groq', timeout: 30000 },
  
  // Fallback
  'default': { model: 'llama-3.1-8b-instant', provider: 'groq', timeout: 30000 }
};

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    version: '2.0-optimized',
    providers: {
      nvidia: NIM_API_KEY ? 'configured ✅' : 'missing ❌',
      groq: GROQ_API_KEY ? 'configured ✅' : 'missing ❌'
    },
    total_models: Object.keys(MODEL_MAPPING).length,
    features: ['extended-timeouts', 'better-streaming', 'error-handling']
  });
});

app.get('/v1/models', (req, res) => {
  const models = Object.keys(MODEL_MAPPING).map(model => ({
    id: model,
    object: 'model',
    created: Date.now(),
    owned_by: MODEL_MAPPING[model].provider,
    timeout: MODEL_MAPPING[model].timeout
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
    
    // Validação básica
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: { 
          message: 'Messages must be an array', 
          type: 'invalid_request_error',
          code: 400
        }
      });
    }
    
    // Get model info
    const modelInfo = MODEL_MAPPING[model] || MODEL_MAPPING['default'];
    const provider = modelInfo.provider;
    const actualModel = modelInfo.model;
    const timeout = modelInfo.timeout || 180000;
    
    // Select API based on provider
    let apiBase, apiKey;
    if (provider === 'groq') {
      apiBase = GROQ_API_BASE;
      apiKey = GROQ_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: { 
            message: 'Groq API key not configured. Set GROQ_API_KEY environment variable.', 
            type: 'configuration_error',
            code: 500
          }
        });
      }
    } else {
      apiBase = NIM_API_BASE;
      apiKey = NIM_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: { 
            message: 'NVIDIA API key not configured. Set NIM_API_KEY environment variable.', 
            type: 'configuration_error',
            code: 500
          }
        });
      }
    }
    
    const requestBody = {
      model: actualModel,
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2048,
      stream: stream !== undefined ? stream : true // Force streaming por padrão
    };
    
    console.log(`[${provider.toUpperCase()}] ${model} → ${actualModel} (timeout: ${timeout}ms)`);
    
    const response = await axios.post(`${apiBase}/chat/completions`, requestBody, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': requestBody.stream ? 'text/event-stream' : 'application/json'
      },
      responseType: requestBody.stream ? 'stream' : 'json',
      timeout: timeout,
      validateStatus: () => true // Aceita qualquer status para tratamento manual
    });
    
    // Verifica status de erro
    if (response.status >= 400) {
      console.error(`API Error ${response.status}:`, response.data);
      return res.status(response.status).json({
        error: {
          message: response.data?.error?.message || response.data?.message || 'API request failed',
          type: 'api_error',
          code: response.status
        }
      });
    }
    
    if (requestBody.stream) {
      // Streaming mode - pipe direto
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      
      // Timeout handler para streaming
      const streamTimeout = setTimeout(() => {
        if (!res.writableEnded) {
          console.error('Stream timeout exceeded');
          res.end();
        }
      }, timeout + 10000); // 10s extra de margem
      
      response.data.on('end', () => {
        clearTimeout(streamTimeout);
        console.log('Stream completed successfully');
      });
      
      response.data.on('error', (err) => {
        clearTimeout(streamTimeout);
        console.error('Stream error:', err.message);
        if (!res.writableEnded) {
          res.end();
        }
      });
      
      response.data.pipe(res);
      
    } else {
      // Non-streaming mode
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
    console.error('Proxy error:', error.code, error.message);
    
    // Timeout específico
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: {
          message: `Request timeout after ${error.config?.timeout || 'unknown'}ms. Try: 1) Shorter messages 2) Lower max_tokens 3) Different model`,
          type: 'timeout_error',
          code: 504,
          timeout: error.config?.timeout,
          suggestions: [
            'Use mensagens mais curtas',
            'Reduza max_tokens para 500-1000',
            'Tente groq-llama-70b (mais rápido)',
            'Ative streaming: stream: true'
          ]
        }
      });
    }
    
    // Outros erros
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        error.message || 
                        'Internal server error';
    
    res.status(statusCode).json({
      error: {
        message: errorMessage,
        type: 'proxy_error',
        code: statusCode,
        details: error.code
      }
    });
  }
});

// 404 handler
app.all('*', (req, res) => {
  console.log(`404 - ${req.method} ${req.path}`);
  res.status(404).json({
    error: {
      message: `Endpoint ${req.path} not found`,
      type: 'invalid_request_error',
      code: 404,
      available_endpoints: [
        'GET /health',
        'GET /v1/models', 
        'POST /v1/chat/completions'
      ]
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Multi-Provider Proxy v2.0 - OPTIMIZED!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔢 Models: ${Object.keys(MODEL_MAPPING).length}`);
  console.log(`\n⚡ GROQ (Ultra Fast):`);
  console.log(`   - groq-llama-70b, groq-mixtral (30-60s)`);
  console.log(`\n🧠 NVIDIA (Quality + Reasoning):`);
  console.log(`   - deepseek-r1 (timeout: 10min) ✅`);
  console.log(`   - kimi-k2, llama-405b, nemotron`);
  console.log(`\n🔧 Improvements:`);
  console.log(`   ✅ Extended timeout for DeepSeek R1 (600s)`);
  console.log(`   ✅ Better streaming with error handling`);
  console.log(`   ✅ Individual timeouts per model`);
  console.log(`   ✅ Helpful error messages\n`);
});
