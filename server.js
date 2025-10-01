const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const NIM_API_BASE = process.env.NIM_API_BASE || 'https://integrate.api.nvidia.com/v1';
const NIM_API_KEY = process.env.NIM_API_KEY;

// Model mapping - Use these names in Janitor AI!
const MODEL_MAPPING = {
  // Best for Roleplay (Recommended!)
  'gpt-4-turbo': 'meta/llama-3.1-405b-instruct',          // Best quality, slower
  'gpt-4': 'meta/llama-3.1-70b-instruct',                 // Great balance
  'gpt-3.5-turbo': 'meta/llama-3.1-8b-instruct',          // Fast, good quality
  
  // DeepSeek - Great for creative writing!
  'deepseek-chat': 'deepseek-ai/deepseek-r1',
  
  // Llama Models - Excellent for RP
  'llama-405b': 'meta/llama-3.1-405b-instruct',           // Highest quality
  'llama-70b': 'meta/llama-3.3-70b-instruct',             // Very good
  'llama-vision': 'meta/llama-3.2-90b-vision-instruct',   // Can see images!
  
  // Mistral - Creative and fun
  'mistral-large': 'mistralai/mistral-large-2-instruct',
  'mistral-small': 'mistralai/mistral-small-2-instruct',
  
  // Qwen - Smart and creative
  'qwen-72b': 'qwen/qwen2.5-72b-instruct',
  'qwen-coder': 'qwen/qwq-32b-preview',
  
  // Nemotron - NVIDIA's own (great for RP!)
  'nemotron-70b': 'nvidia/llama-3.1-nemotron-70b-instruct',
  
  // Google Gemma - Good alternative
  'gemma-27b': 'google/gemma-2-27b-it',
  'gemma-9b': 'google/gemma-2-9b-it'
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'OpenAI to NVIDIA NIM Proxy for Janitor AI' });
});

app.get('/v1/models', (req, res) => {
  const models = Object.keys(MODEL_MAPPING).map(model => ({
    id: model,
    object: 'model',
    created: Date.now(),
    owned_by: 'nvidia-nim-proxy'
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
    
    // Use the mapped model or default to fast model
    const nimModel = MODEL_MAPPING[model] || MODEL_MAPPING['gpt-3.5-turbo'];
    
    const nimRequest = {
      model: nimModel,
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2048,  // Higher for longer RP responses
      stream: stream || false
    };
    
    const response = await axios.post(`${NIM_API_BASE}/chat/completions`, nimRequest, {
      headers: {
        'Authorization': `Bearer ${NIM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: stream ? 'stream' : 'json',
      timeout: 120000 // 2 minute timeout
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
  console.log(`🚀 Janitor AI Proxy running on port ${PORT}`);
  console.log(`📍 Use this URL in Janitor AI: http://localhost:${PORT}/v1`);
  console.log(`📍 Best models for RP: gpt-4-turbo, llama-405b, nemotron-70b`);
});
