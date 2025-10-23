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
const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;

// EXPANDED Model mapping - VERIFIED WORKING ONLY!
const MODEL_MAPPING = {
  // 🌙 Kimi/Moonshot (Creative) - VERIFIED ✅
  'kimi-k2': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  'kimi': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  'moonshot': { model: 'moonshotai/kimi-k2-instruct', provider: 'nvidia' },
  
  // 🧠 DeepSeek (Reasoning) - VERIFIED ✅
  'deepseek-r1': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia' },
  'deepseek': { model: 'deepseek-ai/deepseek-r1', provider: 'nvidia' },
  
  // 🤖 GLM (Zhipu AI) - FREE CREDITS! ✅
  'glm-4': { model: 'glm-4-plus', provider: 'zhipu' },
  'glm-4-plus': { model: 'glm-4-plus', provider: 'zhipu' },
  'glm-4-air': { model: 'glm-4-air', provider: 'zhipu' },
  'glm-4-flash': { model: 'glm-4-flash', provider: 'zhipu' },
  'chatglm': { model: 'glm-4-plus', provider: 'zhipu' },
  
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
  'mistral-7b': { model: 'mist
