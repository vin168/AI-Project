const https = require('https')

const samples = {
  sharp_roar: [
    '够了！真的够了！！别再跟我说那些废话！！！',
    '你能不能闭嘴！我忍你很久了知道吗？！',
    '烦死了烦死了烦死了！今天谁也别来惹我！'
  ],
  cold_sarcasm: [
    '嗯，您说得都对，我笑一下只是出于礼貌。',
    '没事，您继续，我在心里已经给您打完分了。',
    '好哦，您开心就好呢，我真的没有在阴阳怪气。'
  ],
  chaos_quit: [
    '随便吧，爱咋咋地，我已经躺平了。',
    '累了，毁灭吧，今天也是无所谓的一天。',
    '不重要，都不重要，反正我选择摆烂。'
  ],
  magic_mumble: [
    '我在想我是不是应该想点什么…算了不想了…还是想一下吧…算了。',
    '今天星期几来着？不重要。我在干嘛来着？也不重要。',
    '我没有在碎碎念我没有在碎碎念我没有在碎碎念…好吧我就是。'
  ],
  tsundere_obsess: [
    '你最好是在忙，而不是不想理我，虽然我也不是特别在意。',
    '哼，我才没有一直在等你消息，只是刚好每次都在看手机而已。',
    '你跟她说话为什么比跟我说话多？算了你不用解释，我不想听。'
  ],
  zen_collapse: [
    '都挺好的，我也挺好的，就是灵魂已经飘走了而已。',
    '没事的，一切都会好起来的…至少我是这么骗自己的。',
    '今天的我也很平静呢，平静到感觉自己已经碎成渣了。'
  ],
  custom: [
    '你给的关键词太有戏了，我已经开始发疯嘴替了。',
    '这个关键词一出来，嘴替模式直接启动。',
    '今天的我，决定围绕这个关键词认真发疯。'
  ]
}

const seedMap = {
  default: '',
  acute: '我真的要急了，',
  collapse: '我现在已经快碎了，',
  gossip: '先礼貌一下，',
  lazy: '我有点困了，',
  angry: '我先炸毛一下，',
  empty: '我现在有点空，'
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildCopy(style, seed, keyword) {
  const list = samples[style] || samples.sharp_roar
  const prefix = keyword ? `关于${keyword}，` : ''
  return prefix + (seedMap[seed] || '') + pick(list)
}

function buildPrompt(style, styleSeed, seed, keyword) {
  const styleLabel = {
    sharp_roar: '尖锐嘶吼疯',
    cold_sarcasm: '阴阳冷讽疯',
    chaos_quit: '混沌摆烂疯',
    magic_mumble: '魔性碎碎疯',
    tsundere_obsess: '傲娇偏执疯',
    zen_collapse: '佛系崩坏疯',
    custom: '自定义发疯'
  }[styleSeed] || '尖锐嘶吼疯'

  const styleDescription = {
    sharp_roar: '直白暴躁、短句爆破，情绪直接宣泄，主打歇斯底里，攻击性强',
    cold_sarcasm: '阴阳怪气、慢条斯理，看似平静实则句句扎心，阴柔式发疯',
    chaos_quit: '破罐子破摔、躺平虚无，放弃抵抗，摆烂式自我放逐发疯',
    magic_mumble: '重复念叨、逻辑混乱，自言自语式絮叨，无厘头精神内耗发疯',
    tsundere_obsess: '占有欲强、自我纠结，敏感极端，爱钻牛角尖的偏执型发疯',
    zen_collapse: '表面淡定温和，内里彻底崩盘，平静语气讲崩溃内容，反差发疯',
    custom: '自定义发疯风格'
  }[styleSeed] || ''

  const seedLabel = {
    default: '',
    acute: '急了',
    collapse: '崩了',
    gossip: '阴阳怪气',
    lazy: '摆烂',
    angry: '发疯',
    empty: '虚无',
    custom: '自定义'
  }[seed] || ''

  return [
    '你是一个发疯嘴替。',
    '请生成一段适合朋友圈、小红书、短视频评论区使用的中文文案。',
    `发疯风格：${styleLabel}。风格特征：${styleDescription}。${seedLabel ? `情绪状态：${seedLabel}。` : ''}`,
    keyword ? `围绕关键词展开：${keyword}。` : '关键词：无。',
    '要求：严格按照指定风格特征来发疯，表现要贴合风格的个性。简短、有梗、不要解释、字数控制在20到80字。',
    '不要输出任何额外说明，只输出最终文案。'
  ].join('\n')
}

function buildMomentsPrompt(stage, input) {
  const styleLabel = {
    short: '简短干净',
    literary: '文艺走心',
    funny: '搞笑沙雕',
    cool: '高冷高级',
    gentle: '温柔治愈',
    custom: '自定义'
  }[input?.style] || '简短干净'

  const appScene = input?.appScene || '今天'
  const keyword = input?.keyword || '无'
  const emojiText = input?.emoji ? '允许适当加入emoji' : '不要加入emoji'
  const lengthText = input?.length === '常规' ? '输出3条文案' : '输出2条文案'

  return [
    '你是一个朋友圈文案生成器，禁止输出发疯嘴替、阴阳怪气、吐槽攻击类内容。',
    `请根据用户当前选择，直接生成朋友圈文案。应用场景=${appScene}；关键词=${keyword}；风格=${styleLabel}；${emojiText}；${lengthText}。`,
    '要求：应用场景和关键词是两个不同参数，应用场景决定整体画面，关键词只做补充，不要互相覆盖。',
    '要求：输出自然、清新、适合朋友圈发布的中文文案，像真实用户发朋友圈。',
    '不要解释，不要分点，只输出最终文案。',
    '字数控制在50字左右。'
  ].join('\n')
}

function requestDeepSeek({ apiKey, apiBase, model, prompt }) {
  const payload = JSON.stringify({
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false
  })
  const url = new URL(`${apiBase.replace(/\/$/, '')}/chat/completions`)

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json'
        }
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => resolve({ statusCode: res.statusCode || 0, data }))
      }
    )

    req.on('error', reject)
    req.write(payload)
    req.end()
  }).then((result) => {
    let parsed = null
    try {
      parsed = result.data ? JSON.parse(result.data) : null
    } catch (err) {
      throw new Error(`DeepSeek response is not valid JSON: ${err.message}`)
    }

    if (result.statusCode < 200 || result.statusCode >= 300) {
      const error = new Error(parsed?.error?.message || `DeepSeek HTTP ${result.statusCode}`)
      error.code = parsed?.error?.type
      error.requestId = parsed?.id
      error.response = parsed
      throw error
    }

    if (parsed?.error) {
      const error = new Error(parsed.error.message || 'DeepSeek API error')
      error.code = parsed.error.type
      error.requestId = parsed.id
      error.response = parsed
      throw error
    }

    return parsed
  })
}

exports.main = async (event, context) => {
  const { style = 'sharp_roar', styleSeed = 'sharp_roar', seed = 'default', keyword = '' } = event || {}
  const apiKey = (process.env.DEEPSEEK_API_KEY || '').replace(/^\uFEFF/, '').trim()
  const apiBase = (process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com').replace(/\/$/, '')
  const model = (process.env.DEEPSEEK_MODEL || 'deepseek-chat').trim()

  if (event?.scene === 'moments') {
    const appScene = event?.appScene || '今天'
    const keyword = event?.keyword || '无'
    const styleLabel = {
      short: '简短干净',
      literary: '文艺走心',
      funny: '搞笑沙雕',
      cool: '高冷高级',
      gentle: '温柔治愈',
      custom: '自定义'
    }[event?.style] || '简短干净'

    const emojiText = event?.emoji ? '允许适当加入emoji' : '不要加入emoji'
    const lengthText = event?.length === '常规' ? '输出3条文案' : '输出2条文案'
    const prompt = [
      '你是一个朋友圈文案生成器，禁止输出发疯嘴替、阴阳怪气、吐槽攻击类内容。',
      `请根据用户当前选择，直接生成朋友圈文案。应用场景=${appScene}；关键词=${keyword}；风格=${styleLabel}；${emojiText}；${lengthText}。`,
      '要求：应用场景和关键词是两个不同参数，应用场景决定整体画面，关键词只做补充，不要互相覆盖。',
      '要求：输出自然、清新、适合朋友圈发布的中文文案，像真实用户发朋友圈。',
      '不要解释，不要分点，只输出最终文案。',
      '不要生成提示词。'
    ].join('\n')

    console.log('[DeepSeek Cloud][moments] prompt', prompt)
    console.log('[DeepSeek Cloud][moments] request', {
      style: event?.style,
      appScene: event?.appScene,
      keyword: event?.keyword,
      emoji: event?.emoji,
      length: event?.length,
      promptPreview: String(prompt).slice(0, 120)
    })

    if (!apiKey) {
      return {
        ok: true,
        data: {
          text: `关于${appScene}，今天也想认真记录一下。`,
          scene: 'moments',
          stage: 'copy',
          appScene,
          keyword,
          source: 'local-mock'
        }
      }
    }

    try {
      const parsed = await requestDeepSeek({ apiKey, apiBase, model, prompt })
      const text = parsed?.choices?.[0]?.message?.content?.trim() || ''
      console.log('[DeepSeek Cloud][moments] response', { stage: 'moments', textPreview: text.slice(0, 120) })
      return {
        ok: true,
        data: {
          text,
          scene: 'moments',
          stage: 'moments',
          appScene,
          keyword,
          source: 'real-api',
          raw: parsed
        }
      }
    } catch (error) {
      return {
        ok: true,
        data: {
          text: `关于${appScene}，今天也想认真记录一下。`,
          scene: 'moments',
          stage: 'copy',
          appScene,
          keyword,
          source: 'local-mock',
          error: error?.message || 'Unknown error'
        }
      }
    }
  }

  if (!apiKey) {
    const fallback = buildCopy(style, seed, keyword)
    return {
      ok: true,
      data: {
        text: fallback,
        style,
        seed,
        keyword,
        source: 'local-mock',
        error: 'Missing DeepSeek API key'
      }
    }
  }

  const prompt = buildPrompt(style, styleSeed, seed, keyword)

  try {
    console.log('[DeepSeek Cloud][frenzy] prompt', prompt)
    console.log('[DeepSeek Cloud] request params', {
      model,
      apiBase,
      style,
      styleSeed,
      seed,
      keyword,
      promptPreview: prompt.slice(0, 80)
    })

    const parsed = await requestDeepSeek({ apiKey, apiBase, model, prompt })
    const text = parsed?.choices?.[0]?.message?.content?.trim() || buildCopy(style, seed, keyword)

    console.log('[DeepSeek Cloud] success', {
      model,
      apiBase,
      style,
      seed,
      keyword
    })

    return {
      ok: true,
      data: {
        text,
        style,
        styleSeed,
        seed,
        keyword,
        source: 'real-api',
        raw: parsed
      }
    }
  } catch (error) {
    console.error('[DeepSeek Cloud] failed', {
      model,
      apiBase,
      style,
      seed,
      keyword,
      message: error?.message,
      code: error?.code,
      requestId: error?.requestId,
      response: error?.response
    })

    const fallback = buildCopy(style, seed, keyword)
    return {
      ok: true,
      data: {
        text: fallback,
        style,
        styleSeed,
        seed,
        keyword,
        source: 'local-mock',
        error: error?.message || 'Unknown error'
      }
    }
  }
}


