Page({
  data: {
    scenarios: [
      {
        key: 'frenzy',
        label: '发疯嘴替',
        title: '发疯嘴替',
        placeholder: '请输入具体事件，生成发疯嘴替文案',
        styleLabel: '选择风格',
        styleHint: '选择风格',
        styles: [
          { name: 'sharp_roar', label: '尖锐嘶吼疯' },
          { name: 'cold_sarcasm', label: '阴阳冷讽疯' },
          { name: 'chaos_quit', label: '混沌摆烂疯' },
          { name: 'magic_mumble', label: '魔性碎碎疯' },
          { name: 'tsundere_obsess', label: '傲娇偏执疯' },
          { name: 'zen_collapse', label: '佛系崩坏疯' },
          { name: 'custom', label: '自定义' }
        ],
        defaultStyle: 'sharp_roar',
        outputHint: '发疯嘴替已生成，可直接复制使用',
        outputBadge: '发疯嘴替已生成 ✅',
        extraHint: '支持修改文案长度（短句/长句）',
        extras: [
          { type: 'segmented', key: 'length', label: '调整长度', options: ['短句', '长句'], defaultValue: '短句' }
        ]
      },
      {
        key: 'moments',
        label: '朋友圈文案',
        title: '朋友圈文案',
        placeholder: '输入朋友圈主题（比如：干饭、旅行、下班、自拍），生成适配朋友圈的短句/文案',
        styleLabel: '可选风格',
        styleHint: '选择一个更贴合朋友圈气质的风格',
        styles: [
          { name: 'short', label: '简短干净' },
          { name: 'literary', label: '文艺走心' },
          { name: 'funny', label: '搞笑沙雕' },
          { name: 'cool', label: '高冷高级' },
          { name: 'gentle', label: '温柔治愈' },
          { name: 'custom', label: '自定义' }
        ],
        defaultStyle: 'short',
        outputHint: '朋友圈文案已生成，适配配图，可直接复制',
        outputBadge: '朋友圈文案已生成 ✅',
        extraHint: '适合配图与生活碎片分享',
        extras: [
          { type: 'checkbox', key: 'emoji', label: '添加emoji', defaultValue: true },
          { type: 'segmented', key: 'length', label: '文案长度', options: ['短句', '常规'], defaultValue: '短句' }
        ]
      }
    ],
    currentScenario: 'frenzy',
    currentScenarioIndex: 0,
    scenarioTabs: [
      { key: 'frenzy', label: '发疯嘴替' },
      { key: 'moments', label: '朋友圈文案' }
    ],
    styles: [
      { name: 'sharp_roar', label: '尖锐嘶吼疯' },
      { name: 'cold_sarcasm', label: '阴阳冷讽疯' },
      { name: 'chaos_quit', label: '混沌摆烂疯' },
      { name: 'magic_mumble', label: '魔性碎碎疯' },
      { name: 'tsundere_obsess', label: '傲娇偏执疯' },
      { name: 'zen_collapse', label: '佛系崩坏疯' },
      { name: 'custom', label: '自定义发疯' }
    ],
    currentStyle: 'sharp_roar',
    currentStyleSeed: 'sharp_roar',
    styleSeeds: [
      { name: 'sharp_roar', label: '尖锐嘶吼疯' },
      { name: 'cold_sarcasm', label: '阴阳冷讽疯' },
      { name: 'chaos_quit', label: '混沌摆烂疯' },
      { name: 'magic_mumble', label: '魔性碎碎疯' },
      { name: 'tsundere_obsess', label: '傲娇偏执疯' },
      { name: 'zen_collapse', label: '佛系崩坏疯' },
      { name: 'custom', label: '自定义' }
    ],
    currentSeed: 'acute',
    seeds: [
      { name: 'acute', label: '急了' },
      { name: 'collapse', label: '崩了' },
      { name: 'gossip', label: '阴阳怪气' },
      { name: 'lazy', label: '摆烂' },
      { name: 'angry', label: '发疯' },
      { name: 'empty', label: '虚无' },
      { name: 'custom', label: '自定义' }
    ],
    customStyle: '',
    customStyleSeed: '',
    customSeed: '',
    showCustomStyleInput: false,
    showCustomStyleSeedInput: false,
    showCustomSeedInput: false,
    keyword: '',
    optionsState: {
      length: '短句'
    },
    loading: false,
    result: '',
    displayText: '',
    tips: '选个风格，丢个关键词，马上给你整一段。',
    history: [],
    isHistoryEmpty: true,
    apiStatus: 'local',
    typingTimer: null
  },

  onLoad() {
    const savedScenario = wx.getStorageSync('crazy_scenario')
    const savedStyle = wx.getStorageSync('crazy_style')
    const savedSeed = wx.getStorageSync('crazy_seed')
    const savedCustomStyle = wx.getStorageSync('crazy_custom_style')
    const savedCustomSeed = wx.getStorageSync('crazy_custom_seed')
    const savedKeyword = wx.getStorageSync('crazy_keyword')
    const savedHistory = wx.getStorageSync('crazy_history')
    const history = Array.isArray(savedHistory)
      ? savedHistory.map(item => ({
        id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...item
      }))
      : []
    this.setData({
      currentScenario: savedScenario || 'frenzy',
      currentScenarioIndex: (savedScenario || 'frenzy') === 'moments' ? 1 : 0,
      currentStyle: savedStyle || 'sharp_roar',
      currentStyleSeed: wx.getStorageSync('crazy_style_seed') || 'sharp_roar',
      currentSeed: savedSeed || 'acute',
      customStyle: savedCustomStyle || '',
      customStyleSeed: wx.getStorageSync('crazy_custom_style_seed') || '',
      customSeed: savedCustomSeed || '',
      showCustomStyleInput: (savedStyle || 'sharp_roar') === 'custom',
      showCustomStyleSeedInput: (wx.getStorageSync('crazy_style_seed') || 'sharp_roar') === 'custom',
      showCustomSeedInput: (savedSeed || 'acute') === 'custom',
      keyword: savedKeyword || '',
      history,
      isHistoryEmpty: !history.length
    })

    this.applyScenario(this.getScenario(savedScenario || 'frenzy') || this.data.scenarios[0], false)

    if (!wx.cloud) {
      this.setData({ tips: '当前基础库不支持云开发，请先升级微信开发者工具。' })
    }
  },

  onSelectStyle(e) {
    const currentStyle = e.currentTarget.dataset.name
    const nextStyle = currentStyle === 'custom' ? 'custom' : currentStyle
    this.setData({
      currentStyle: nextStyle,
      showCustomStyleInput: nextStyle === 'custom',
      tips: `已切换到「${this.getStyleLabel(nextStyle)}」`
    })
    wx.setStorageSync('crazy_style', nextStyle)
  },

  onSelectStyleSeed(e) {
    const currentStyleSeed = e.currentTarget.dataset.name
    this.setData({
      currentStyleSeed,
      showCustomStyleSeedInput: currentStyleSeed === 'custom',
      tips: `发疯风格已选「${this.getStyleSeedLabel(currentStyleSeed)}」`
    })
    wx.setStorageSync('crazy_style_seed', currentStyleSeed)
  },

  onSelectScenarioPicker(e) {
    const index = Number(e.detail.value)
    const scenario = this.data.scenarioTabs[index] ? this.getScenario(this.data.scenarioTabs[index].key) : null
    if (!scenario) return
    this.setData({ currentScenarioIndex: index })
    if (scenario.key === 'moments') {
      wx.navigateTo({ url: '/pages/moments/moments' })
      wx.setStorageSync('crazy_scenario', scenario.key)
      return
    }
    this.applyScenario(scenario, true)
    wx.setStorageSync('crazy_scenario', scenario.key)
    wx.setStorageSync('crazy_style', scenario.defaultStyle)
  },

  onSelectSeed(e) {
    const currentSeed = e.currentTarget.dataset.name
    this.setData({
      currentSeed,
      showCustomSeedInput: currentSeed === 'custom',
      tips: `情绪种子已选「${this.getSeedLabel(currentSeed)}」`
    })
    wx.setStorageSync('crazy_seed', currentSeed)
  },

  onCustomStyleInput(e) {
    const customStyle = e.detail.value.trim()
    this.setData({ customStyle })
    wx.setStorageSync('crazy_custom_style', customStyle)
  },

  onCustomStyleSeedInput(e) {
    const customStyleSeed = e.detail.value.trim()
    this.setData({ customStyleSeed })
    wx.setStorageSync('crazy_custom_style_seed', customStyleSeed)
  },

  onCustomSeedInput(e) {
    const customSeed = e.detail.value.trim()
    this.setData({ customSeed })
    wx.setStorageSync('crazy_custom_seed', customSeed)
  },

  onKeywordInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({ keyword })
    wx.setStorageSync('crazy_keyword', keyword)
  },

  onClearKeyword() {
    this.setData({ keyword: '', tips: '关键词已清空，继续输入也行。' })
    wx.removeStorageSync('crazy_keyword')
  },

  onGenerate() {
    if (this.data.loading) return

    if (!wx.cloud) {
      wx.showModal({
        title: '云开发未启用',
        content: '当前基础库不支持 wx.cloud，请先升级微信开发者工具或基础库。',
        showCancel: false
      })
      return
    }

    const style = this.data.currentStyle === 'custom' && this.data.customStyle ? this.data.customStyle : this.data.currentStyle
    const styleSeed = this.data.currentStyleSeed === 'custom' && this.data.customStyleSeed ? this.data.customStyleSeed : this.data.currentStyleSeed
    const seed = this.data.currentSeed === 'custom' && this.data.customSeed ? this.data.customSeed : this.data.currentSeed
    const styleLabel = this.getStyleLabel(this.data.currentStyle)
    const styleSeedLabel = this.getStyleSeedLabel(this.data.currentStyleSeed)
    const seedLabel = this.getSeedLabel(this.data.currentSeed)

    this.setData({ loading: true, tips: '正在发疯生成中...' })
    console.log('[index] onGenerate request', {
      scenario: this.data.currentScenario,
      style,
      styleLabel,
      styleSeed,
      styleSeedLabel,
      seed,
      seedLabel,
      keyword: this.data.keyword,
      optionsState: this.data.optionsState,
      prompt: this.buildPromptPreview(style, styleSeed, seed)
    })
    wx.cloud.callFunction({
      name: 'deepseek',
      data: {
        style: this.data.currentStyle,
        styleSeed: this.data.currentStyleSeed,
        seed: this.data.currentSeed,
        keyword: this.data.keyword,
        options: this.data.optionsState,
        styleLabel,
        styleSeedLabel,
        seedLabel
      },
      success: (res) => {
        const payload = res?.result?.data || res?.result || {}
        const source = payload.source || 'local-mock'
        const text = payload.text || this.buildCopy()
        const apiError = payload.error || ''
        if (this.isIllegal(text)) {
          wx.navigateTo({ url: '/pages/illegal/illegal' })
          this.setData({ loading: false, tips: '检测到不适合展示的内容，已拦截。' })
          return
        }
        this.setData({ result: text, displayText: '', apiStatus: source })
        this.startTyping(text)
        this.appendHistory(text)
      },
      fail: () => {
        const text = this.buildCopy()
        this.setData({ tips: '云函数未连接，已回退到前端兜底文案。', result: text, displayText: '', apiStatus: 'fallback' })
        this.startTyping(text)
        this.appendHistory(text)
      }
    })
  },

  buildPromptPreview(style, styleSeed, seed) {
    const keyword = this.data.keyword || '无'
    return [
      `风格=${style}`,
      `风格标签=${this.getStyleLabel(this.data.currentStyle)}`,
      `风格种子=${styleSeed}`,
      `风格种子标签=${this.getStyleSeedLabel(this.data.currentStyleSeed)}`,
      `情绪种子=${seed}`,
      `情绪种子标签=${this.getSeedLabel(this.data.currentSeed)}`,
      `关键词=${keyword}`
    ].join(' | ')
  },

  applyScenario(scenario, clearResult) {
    this.setData({
      currentScenario: scenario.key,
      currentScenarioIndex: scenario.key === 'moments' ? 1 : 0,
      currentStyle: scenario.defaultStyle,
      scenarioStyles: scenario.styles,
      result: clearResult ? '' : this.data.result,
      displayText: clearResult ? '' : this.data.displayText,
      tips: `已切换到「${scenario.label}」`,
      optionsState: this.resetScenarioOptions(scenario)
    })
  },

  onRegenerate() {
    if (this.data.loading) return
    this.onGenerate()
  },

  onCopy() {
    if (!this.data.result) return
    wx.setClipboardData({
      data: this.data.result,
      success: () => wx.showToast({ title: '复制成功', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.result || '发疯文案生成器',
      path: '/pages/index/index'
    }
  },

  buildCopy() {
    const keyword = this.data.keyword
    const style = this.data.currentStyle === 'custom' && this.data.customStyle ? this.data.customStyle : this.data.currentStyle
    const seed = this.data.currentSeed === 'custom' && this.data.customSeed ? this.data.customSeed : this.data.currentSeed
    const styleSeed = this.data.currentStyleSeed === 'custom' && this.data.customStyleSeed ? this.data.customStyleSeed : this.data.currentStyleSeed
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
    const list = samples[styleSeed] || samples.sharp_roar
    const prefix = keyword ? `关于${keyword}，` : ''
    const seedMap = {
      acute: '我真的要急了，',
      collapse: '我现在已经快碎了，',
      gossip: '先礼貌一下，',
      lazy: '我有点困了，',
      angry: '我先炸毛一下，',
      empty: '我现在有点空，'
    }
    const customStylePrefix = this.data.currentStyle === 'custom' && this.data.customStyle ? `${this.data.customStyle}风格，` : ''
    const customSeedPrefix = this.data.currentSeed === 'custom' && this.data.customSeed ? `${this.data.customSeed}，` : ''
    const customStyleSeedPrefix = this.data.currentStyleSeed === 'custom' && this.data.customStyleSeed ? `${this.data.customStyleSeed}，` : ''
    const styleText = this.data.currentScenario === 'moments' ? this.buildMomentsCopy() : (prefix + customStylePrefix + customStyleSeedPrefix + customSeedPrefix + (seedMap[seed] || '') + list[Math.floor(Math.random() * list.length)])
    return styleText
  },

  buildMomentsCopy() {
    const topic = this.data.keyword || '今天'
    const style = this.data.currentStyle === 'custom' && this.data.customStyle ? this.data.customStyle : this.data.currentStyle
    const emojiEnabled = !!this.data.optionsState.emoji
    const length = this.data.optionsState.length || '短句'

    const emojiPool = {
      short: ['✨', '🌿', '☕', '📷', '🍃'],
      literary: ['🌙', '🍂', '✨', '🌿', '🫧'],
      funny: ['🤣', '🫠', '😎', '🍉', '📸'],
      cool: ['🖤', '✨', '📷', '🌙', '🧊'],
      gentle: ['☁️', '🌷', '🍀', '🫶', '🌼'],
      custom: ['✨', '🌿', '📷', '🫶', '☕']
    }

    const templates = {
      short: [
        `${topic}，刚刚好。`,
        `${topic}，今天也算有点小开心。`,
        `${topic}，记录一下平凡又舒服的一天。`,
        `${topic}，简单点，反而更舒服。`,
        `${topic}，小日子也有小闪光。`
      ],
      literary: [
        `关于${topic}，总觉得生活会在不经意间给人一点温柔。`,
        `今天的${topic}，像一段慢慢展开的小确幸。`,
        `把${topic}留在今天，像把一束光藏进日常。`,
        `${topic}这件事，本身就很值得被好好记住。`,
        `在${topic}里，突然接住了今天的情绪。`
      ],
      funny: [
        `${topic}，主打一个随便活着也很认真。`,
        `今天的${topic}，虽然普通，但我很满意。`,
        `${topic}，人虽然没怎么进步，快乐倒是有一点。`,
        `${topic}，没发大财，但发了点小开心。`,
        `${topic}，日子不大，但情绪挺满。`
      ],
      cool: [
        `${topic}，简单点，反而更有感觉。`,
        `关于${topic}，我只想留一点刚刚好的松弛。`,
        `${topic}，不喧哗，也足够成立。`,
        `${topic}，干净一点，舒服很多。`,
        `今天的${topic}，刚好和我的状态对上了。`
      ],
      gentle: [
        `${topic}，今天也被一点小温柔接住了。`,
        `关于${topic}，是很轻、很舒服的一天。`,
        `${topic}，平平淡淡，但心情有被照亮。`,
        `${topic}，没有很热烈，但刚刚好。`,
        `把${topic}放进今天，像给生活盖了个小章。`
      ],
      custom: [
        `${topic}，今天也想认真记录一下。`,
        `关于${topic}，我想留住这一点点轻松。`,
        `${topic}，刚刚好适合发一条朋友圈。`,
        `${topic}，不一定特别，但值得发出来。`,
        `今天的${topic}，有点普通，但我喜欢。`
      ]
    }

    const list = templates[style] || templates.short
    const count = length === '常规' ? 3 : 2
    const baseItems = list.slice(0, count)
    const items = baseItems.map((item, index) => {
      if (!emojiEnabled) return item
      const emojis = emojiPool[style] || emojiPool.short
      const emoji = emojis[index % emojis.length]
      return `${item}${index % 2 === 0 ? ` ${emoji}` : `${emoji}`}`
    })
    return items.join('\n')
  },

  getScenario(key) {
    return this.data.scenarios.find(item => item.key === key)
  },

  getCurrentScenarioConfig() {
    return this.getScenario(this.data.currentScenario) || this.data.scenarios[0]
  },

  getStyleHint() {
    return this.getCurrentScenarioConfig().styleHint || '选择风格'
  },

  resetScenarioOptions(scenario) {
    const next = {}
    scenario.extras.forEach(extra => {
      next[extra.key] = extra.defaultValue
    })
    return next
  },

  onOptionToggle(e) {
    const { key } = e.currentTarget.dataset
    this.setData({ [`optionsState.${key}`]: !this.data.optionsState[key] })
  },

  onOptionChange(e) {
    const { key } = e.currentTarget.dataset
    this.setData({ [`optionsState.${key}`]: e.detail.value })
  },

  getConnectionFailMessage() {
    return '当前暂时没有连上服务，请稍后再试。'
  },

  appendHistory(text) {
    const item = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      style: this.data.currentStyle,
      styleSeed: this.data.currentStyleSeed,
      seed: this.data.currentSeed,
      keyword: this.data.keyword,
      time: this.formatTime(new Date())
    }
    const history = [item, ...this.data.history].slice(0, 6)
    this.setData({ history, isHistoryEmpty: false })
    wx.setStorageSync('crazy_history', history)
  },

  isIllegal(text) {
    const keywords = ['违法', '暴力', '自杀', '仇恨', '色情']
    return keywords.some(word => text.includes(word))
  },

  startTyping(text) {
    clearInterval(this.data.typingTimer)
    let i = 0
    const timer = setInterval(() => {
      i += 1
      this.setData({ displayText: text.slice(0, i) })
      if (i >= text.length) {
        clearInterval(timer)
        this.setData({ loading: false, typingTimer: null, tips: '生成完成，可复制或分享。' })
      }
    }, 32)
    this.setData({ typingTimer: timer })
  },

  getStyleLabel(name) {
    if (name === 'custom') return this.data.customStyle ? `自定义：${this.data.customStyle}` : '自定义'
    const hit = this.data.styles.find(item => item.name === name)
    return hit ? hit.label : '尖锐嘶吼疯'
  },

  getSeedLabel(name) {
    if (name === 'custom') return this.data.customSeed ? `自定义：${this.data.customSeed}` : '自定义'
    const hit = this.data.seeds.find(item => item.name === name)
    return hit ? hit.label : '急了'
  },

  getStyleSeedLabel(name) {
    if (name === 'custom') return this.data.customStyleSeed ? `自定义：${this.data.customStyleSeed}` : '自定义'
    const hit = this.data.styleSeeds.find(item => item.name === name)
    return hit ? hit.label : '尖锐嘶吼疯'
  },

  formatTime(date) {
    const pad = n => (n < 10 ? `0${n}` : `${n}`)
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  },

  onUnload() {
    clearInterval(this.data.typingTimer)
  }
})
