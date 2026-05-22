require('dotenv').config({ path: require('path').join(__dirname, '.env') })

console.log('[env] loaded from', require('path').join(__dirname, '.env'))
console.log('[env] deepseek api key exists:', Boolean(process.env.DEEPSEEK_API_KEY), 'len=', (process.env.DEEPSEEK_API_KEY || '').length)
console.log('[env] deepseek api base=', process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com')
console.log('[env] deepseek model=', process.env.DEEPSEEK_MODEL || 'deepseek-chat')

const express = require('express')
const cors = require('cors')
const https = require('https')
const { URL } = require('url')

const app = express()
const PORT = process.env.PORT || 3000
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || '').replace(/^\uFEFF/, '').trim()
const DEEPSEEK_API_BASE = (process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com').replace(/\/$/, '')
const DEEPSEEK_MODEL = (process.env.DEEPSEEK_MODEL || 'deepseek-chat').trim()

app.use(cors())
app.use(express.json())

const samples = {
  bailan: [
    '今天先摆烂，别催，催了也不动。',
    '我不是不努力，我是在为明天保留情绪。',
    '如果人生要打卡，我今天先请假。'
  ],
  yinyang: [
    '嘴上说没事，心里已经开了三场发布会。',
    '表面风平浪静，实际内心已经翻了十座山。',
    '我很普通，但我会在心里精准点评每个人。'
  ],
  emo: [
    '我不是难过，我只是突然很想消失一会儿。',
    '情绪像没充满电的手机，亮一下就没了。',
    '我只是安静，不是没崩。'
  ],
  shadou: [
    '人生就像外卖，总有一单会迟到。',
    '今天的我，精神状态像 WiFi，时强时弱。',
    '我不焦虑，我只是常年处于待机发疯模式。'
  ],
  lianai: [
    '对象一句话，我能脑补一整部连续剧。',
    '爱是爱了，疯也是真疯了。',
    '我不是恋爱脑，我是情绪自动续费。'
  ],
  zhichang: [
    '上班不是在工作，是在和灵魂谈判。',
    '会议开完了，人生也被顺手安排了。',
    '工资像月亮，初一十五都见不到。'
  ],
  custom: [
    '你给的关键词太有戏了，我已经开始发疯了。',
    '这个关键词一出来，文案直接精神失控。',
    '今天的我，决定围绕这个关键词认真抽象。'
  ]
}

const seedMap = {
  default: '',
  acute: '我真的要急了，',
  collapse: '我现在已经快碎了，',
  gossip: '先礼貌一下，'
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildCopy(style, seed, keyword) {
  const list = samples[style] || samples.bailan
  const prefix = keyword ? `关于${keyword}，` : ''
  return prefix + (seedMap[seed] || '') + pick(list)
}

function buildPrompt(style, seed, keyword) {
  const styleLabel = {
    bailan: '摆烂发疯',
    yinyang: '阴阳发疯',
    emo: 'emo发疯',
    shadou: '沙雕发疯',
    lianai: '恋爱发疯',
    zhichang: '职场发疯',
    custom: '自定义发疯'
  }[style] || '摆烂发疯'

  const seedLabel = {
    default: '',
    acute: '急了',
    collapse: '崩了',
    gossip: '阴阳怪气'
  }[seed] || ''

  return [
    '你是一个发疯文案生成器。',
    '请生成一段适合朋友圈、小红书、短视频评论区使用的中文文案。',
    `风格：${styleLabel}${seedLabel ? `；情绪种子：${seedLabel}` : ''}。`,
    keyword ? `关键词：${keyword}。` : '关键词：无。',
    '要求：口语化、情绪化、简短、有梗、不要书面语、不要分点、不要解释、字数控制在10到60字。',
    '不要输出任何额外说明，只输出最终文案。'
  ].join('\n')
}

function postJson({ url, headers, payload }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${headers.apiKey}`,
          'Content-Type': headers.contentType,
          Accept: 'application/json'
        }
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 0, data })
        })
      }
    )

    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function callDeepSeek(prompt) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Missing DeepSeek API key')
  }

  const body = {
    model: DEEPSEEK_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    stream: false
  }

  const payload = JSON.stringify(body)
  const url = new URL(`${DEEPSEEK_API_BASE}/chat/completions`)

  console.log('[DeepSeek] request params', {
    model: DEEPSEEK_MODEL,
    base: DEEPSEEK_API_BASE,
    messageCount: body.messages.length,
    promptPreview: prompt.slice(0, 80)
  })

  const result = await postJson({
    url,
    headers: {
      apiKey: DEEPSEEK_API_KEY,
      contentType: 'application/json; charset=utf-8'
    },
    payload
  })

  console.log('[DeepSeek] raw response', {
    statusCode: result.statusCode,
    bodyPreview: (result.data || '').slice(0, 500)
  })

  let parsed = null
  try {
    parsed = result.data ? JSON.parse(result.data) : null
  } catch (parseError) {
    throw new Error(`DeepSeek response is not valid JSON: ${parseError.message}`)
  }

  if (result.statusCode < 200 || result.statusCode >= 300) {
    const err = new Error(parsed?.error?.message || `DeepSeek HTTP ${result.statusCode}`)
    err.statusCode = result.statusCode
    err.response = parsed
    err.code = parsed?.error?.type
    err.requestId = parsed?.id
    throw err
  }

  if (parsed?.error) {
    const err = new Error(parsed.error.message || 'DeepSeek API error')
    err.code = parsed.error.type
    err.requestId = parsed.id
    err.response = parsed
    throw err
  }

  const text = parsed?.choices?.[0]?.message?.content || ''
  return { text, raw: parsed }
}

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'server running' })
})

app.post('/api/generate', (req, res) => {
  ;(async () => {
    const { style = 'bailan', seed = 'default', keyword = '' } = req.body || {}
    const prompt = buildPrompt(style, seed, keyword)

    try {
      const result = await callDeepSeek(prompt)
      const text = (result.text || '').trim() || buildCopy(style, seed, keyword)

      console.log('[DeepSeek] success', {
        style,
        seed,
        keyword,
        source: 'real-api',
        model: DEEPSEEK_MODEL,
        base: DEEPSEEK_API_BASE
      })

      return res.json({
        ok: true,
        data: {
          text,
          style,
          seed,
          keyword,
          source: 'real-api',
          raw: result.raw
        }
      })
    } catch (error) {
      console.error('[DeepSeek] failed', {
        style,
        seed,
        keyword,
        model: DEEPSEEK_MODEL,
        base: DEEPSEEK_API_BASE,
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        code: error?.code,
        response: error?.response,
        requestId: error?.requestId,
        statusCode: error?.statusCode
      })

      const fallback = buildCopy(style, seed, keyword)
      return res.status(200).json({
        ok: true,
        data: {
          text: fallback,
          style,
          seed,
          keyword,
          source: 'local-mock',
          error: error?.message || 'Unknown error'
        }
      })
    }
  })()
})

app.listen(PORT, () => {
  console.log(`发疯文案本地服务已启动: http://localhost:${PORT}`)
})
