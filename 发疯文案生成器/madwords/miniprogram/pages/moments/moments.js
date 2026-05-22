Page({
  data: {
    pageReady: false,
    currentStyle: 'short',
    styles: [
      { name: 'short', label: '简短干净' },
      { name: 'literary', label: '文艺走心' },
      { name: 'funny', label: '搞笑沙雕' },
      { name: 'cool', label: '高冷高级' },
      { name: 'gentle', label: '温柔治愈' },
      { name: 'custom', label: '自定义' }
    ],
    topicSeeds: ['干饭', '周末', '旅行', '自拍', '下班', '咖啡', '加班', '散步', '看展', '拍照', '追剧', '开会', '通勤', '健身'],
    appScene: '',
    customAppScene: '',
    showCustomAppSceneInput: false,
    customStyle: '',
    showCustomStyleInput: false,
    optionsState: {
      emoji: true,
      length: '短句'
    },
    keyword: '',
    result: '',
    displayText: '',
    tips: '输入应用场景和关键词，生成更像朋友圈的轻松文案。',
    loading: false,
    history: [],
    typingTimer: null
  },

  onLoad() {
    console.log('[moments] onLoad start')

    const savedAppScene = wx.getStorageSync('moments_app_scene') || ''
    const savedKeyword = wx.getStorageSync('moments_query_keyword') || ''
    const history = wx.getStorageSync('moments_history') || []
    const customStyle = wx.getStorageSync('moments_custom_style') || ''
    const customAppScene = wx.getStorageSync('moments_custom_app_scene') || ''

    console.log('[moments] storage snapshot', {
      savedAppScene,
      savedKeyword,
      historyLength: Array.isArray(history) ? history.length : -1,
      hasCloud: !!wx.cloud,
      callFunctionType: typeof wx.cloud?.callFunction
    })

    const nextHistory = Array.isArray(history)
      ? history.map(item => ({
          id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ...item
        })).slice(0, 5)
      : []

    this.setData({
      appScene: savedAppScene,
      customAppScene,
      showCustomAppSceneInput: savedAppScene === 'custom',
      keyword: savedKeyword,
      customStyle,
      showCustomStyleInput: false,
      history: nextHistory,
      pageReady: true
    })

    console.log('[moments] onLoad data ready', {
      appScene: this.data.appScene,
      customAppScene: this.data.customAppScene,
      keyword: this.data.keyword,
      currentStyle: this.data.currentStyle,
      pageReady: this.data.pageReady
    })

    if (!wx.cloud) {
      this.setData({ tips: '当前基础库不支持云开发，请升级微信开发者工具。' })
    }
  },

  onReady() {
    console.log('[moments] onReady', {
      pageReady: this.data.pageReady,
      appScene: this.data.appScene,
      keyword: this.data.keyword,
      currentStyle: this.data.currentStyle
    })
  },

  onShow() {
    console.log('[moments] onShow', {
      pageReady: this.data.pageReady,
      appScene: this.data.appScene,
      keyword: this.data.keyword,
      resultExists: !!this.data.result,
      historyLength: this.data.history.length
    })

    if (!this._momentsErrorHandlersInstalled) {
      this._momentsErrorHandlersInstalled = true
      wx.onError((error) => {
        console.error('[moments] wx.onError', error)
      })
      wx.onUnhandledRejection((event) => {
        console.error('[moments] wx.onUnhandledRejection', event?.reason || event)
      })
    }
  },

  onSelectStyle(e) {
    const currentStyle = e.currentTarget.dataset.name
    console.log('[moments] onSelectStyle', { currentStyle })
    this.setData({
      currentStyle,
      showCustomStyleInput: currentStyle === 'custom',
      tips: `已切换到「${this.getStyleLabel(currentStyle)}」`
    })
  },

  onCustomStyleInput(e) {
    const customStyle = e.detail.value.trim()
    console.log('[moments] onCustomStyleInput', { customStyle })
    this.setData({ customStyle })
    wx.setStorageSync('moments_custom_style', customStyle)
  },

  onSelectTopicSeed(e) {
    const appScene = e.currentTarget.dataset.value || ''
    console.log('[moments] onSelectTopicSeed', { appScene })
    this.setData({
      appScene,
      showCustomAppSceneInput: false,
      tips: `已切换到「${appScene}」应用场景`
    })
    wx.setStorageSync('moments_app_scene', appScene)
  },

  onFocusCustomTopic() {
    console.log('[moments] onFocusCustomTopic')
    this.setData({ appScene: 'custom', showCustomAppSceneInput: true, tips: '可以直接在输入框里写自己的应用场景。' })
    wx.setStorageSync('moments_app_scene', 'custom')
  },

  onCustomAppSceneInput(e) {
    const customAppScene = e.detail.value.trim()
    console.log('[moments] onCustomAppSceneInput', { customAppScene })
    this.setData({ customAppScene })
    wx.setStorageSync('moments_custom_app_scene', customAppScene)
  },

  onClearKeyword() {
    console.log('[moments] onClearKeyword')
    this.setData({ keyword: '', tips: '关键词已清空，继续输入也行。' })
    wx.removeStorageSync('moments_query_keyword')
  },

  onKeywordInput(e) {
    const keyword = e.detail.value.trim()
    console.log('[moments] onKeywordInput', { keyword })
    this.setData({ keyword })
    wx.setStorageSync('moments_query_keyword', keyword)
  },

  onOptionToggle(e) {
    const { key } = e.currentTarget.dataset
    if (!key) return
    console.log('[moments] onOptionToggle', { key, currentValue: this.data.optionsState[key] })
    this.setData({ [`optionsState.${key}`]: !this.data.optionsState[key] })
  },

  onOptionChange(e) {
    const { key, value } = e.currentTarget.dataset
    if (!key || value === undefined || value === null) return
    console.log('[moments] onOptionChange', { key, value })
    this.setData({ [`optionsState.${key}`]: value })
  },

  onGenerate() {
    if (this.data.loading) return

    console.log('[moments] onGenerate start', {
      appScene: this.getAppSceneValue(),
      keyword: this.data.keyword,
      currentStyle: this.data.currentStyle,
      customStyle: this.data.customStyle,
      optionsState: this.data.optionsState,
      pageReady: this.data.pageReady
    })

    const prompt = this.buildMomentsPrompt()
    console.log('[moments] prompt preview', prompt)

    this.setData({ loading: true, tips: '正在调用云函数...' })

    if (!wx.cloud || typeof wx.cloud.callFunction !== 'function') {
      console.log('[moments] wx.cloud unavailable at tap time', !!wx.cloud, typeof wx.cloud?.callFunction)
      const text = this.buildMomentsCopy()
      this.setData({ result: text, displayText: '', loading: false, tips: '当前基础库未就绪，已回退到本地文案。' })
      this.startTyping(text)
      this.appendHistory(text)
      return
    }

    wx.cloud.callFunction({
      name: 'deepseek',
      data: {
        scene: 'moments',
        style: this.data.currentStyle,
        appScene: this.getAppSceneValue(),
        keyword: this.data.keyword,
        emoji: this.data.optionsState.emoji,
        length: this.data.optionsState.length,
        prompt
      },
      success: (res) => {
        console.log('[moments] callFunction success raw', res)
        const text = res?.result?.data?.text || res?.result?.text || this.buildMomentsCopy()
        console.log('[moments] callFunction response text', text)
        this.setData({ result: text, displayText: '', loading: false, tips: '生成完成' })
        this.startTyping(text)
        this.appendHistory(text)
        wx.showModal({
          title: '生成结果',
          content: text,
          showCancel: false,
          confirmText: '知道了'
        })
      },
      fail: (err) => {
        console.error('[moments] callFunction fail', err)
        const text = this.buildMomentsCopy()
        this.setData({ result: text, displayText: '', loading: false, tips: '云函数生成失败，已回退到本地文案。' })
        this.startTyping(text)
        this.appendHistory(text)
      }
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

  appendHistory(text) {
    const item = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      style: this.data.currentStyle,
      appScene: this.getAppSceneValue(),
      keyword: this.data.keyword,
      time: this.formatTime(new Date())
    }
    const history = [item, ...this.data.history].slice(0, 5)
    this.setData({ history })
    wx.setStorageSync('moments_history', history)
  },

  startTyping(text) {
    if (this.data.typingTimer) {
      clearInterval(this.data.typingTimer)
    }

    let index = 0
    const timer = setInterval(() => {
      index += 1
      this.setData({ displayText: text.slice(0, index) })
      if (index >= text.length) {
        clearInterval(timer)
        this.setData({ loading: false, typingTimer: null })
      }
    }, 24)

    this.setData({ typingTimer: timer })
  },

  buildMomentsCopy() {
    const appScene = this.getAppSceneValue() || '今天'
    const keyword = this.data.keyword || ''
    const style = this.data.currentStyle === 'custom' && this.data.customStyle ? this.data.customStyle : this.data.currentStyle
    const emojiEnabled = !!this.data.optionsState.emoji
    const length = this.data.optionsState.length || '短句'

    const templates = {
      short: [
        `${appScene}，刚刚好。`,
        `${appScene}，今天也算有点小开心。`,
        `${appScene}，记录一下平凡又舒服的一天。`,
        `${appScene}，简单点，反而更舒服。`,
        `${appScene}，小日子也有小闪光。`
      ],
      literary: [
        `关于${appScene}，总觉得生活会在不经意间给人一点温柔。`,
        `今天的${appScene}，像一段慢慢展开的小确幸。`,
        `把${appScene}留在今天，像把一束光藏进日常。`,
        `${appScene}这件事，本身就很值得被好好记住。`,
        `在${appScene}里，突然接住了今天的情绪。`
      ],
      funny: [
        `${appScene}，主打一个随便活着也很认真。`,
        `今天的${appScene}，虽然普通，但我很满意。`,
        `${appScene}，人虽然没怎么进步，快乐倒是有一点。`,
        `${appScene}，没发大财，但发了点小开心。`,
        `${appScene}，日子不大，但情绪挺满。`
      ],
      cool: [
        `${appScene}，简单点，反而更有感觉。`,
        `关于${appScene}，我只想留一点刚刚好的松弛。`,
        `${appScene}，不喧哗，也足够成立。`,
        `${appScene}，干净一点，舒服很多。`,
        `今天的${appScene}，刚好和我的状态对上了。`
      ],
      gentle: [
        `${appScene}，今天也被一点小温柔接住了。`,
        `关于${appScene}，是很轻、很舒服的一天。`,
        `${appScene}，平平淡淡，但心情有被照亮。`,
        `${appScene}，没有很热烈，但刚刚好。`,
        `把${appScene}放进今天，像给生活盖了个小章。`
      ],
      custom: [
        `${appScene}，今天也想认真记录一下。`,
        `关于${appScene}，我想留住这一点点轻松。`,
        `${appScene}，刚刚好适合发一条朋友圈。`,
        `${appScene}，不一定特别，但值得发出来。`,
        `今天的${appScene}，有点普通，但我喜欢。`
      ]
    }

    const emojiPool = {
      short: ['✨', '🌿', '☕', '📷', '🍃'],
      literary: ['🌙', '🍂', '✨', '🌿', '🫧'],
      funny: ['🤣', '🫠', '😎', '🍉', '📸'],
      cool: ['🖤', '✨', '📷', '🌙', '🧊'],
      gentle: ['☁️', '🌷', '🍀', '🫶', '🌼'],
      custom: ['✨', '🌿', '📷', '🫶', '☕']
    }

    const list = templates[style] || templates.short
    const count = length === '常规' ? 3 : 2
    const items = list.slice(0, count).map((item, index) => {
      if (!emojiEnabled) return item
      const emoji = (emojiPool[style] || emojiPool.short)[index % 5]
      return `${item} ${emoji}`
    })

    if (keyword) {
      items.push(`关键词：${keyword}`)
    }

    return items.join('\n')
  },

  buildMomentsPrompt() {
    const styleLabel = this.getStyleLabel(this.data.currentStyle)
    const appScene = this.getAppSceneValue() || '今天'
    const keyword = this.data.keyword || '无'
    console.log('[moments] buildMomentsPrompt args', {
      styleLabel,
      appScene,
      keyword,
      optionsState: this.data.optionsState
    })
    return [
      '请直接生成朋友圈文案。',
      `应用场景：${appScene}`,
      `关键词：${keyword}`,
      `风格：${styleLabel}`,
      `emoji：${this.data.optionsState.emoji ? '开启' : '关闭'}`,
      `长度：${this.data.optionsState.length === '常规' ? '常规' : '短句'}`,
      '要求：应用场景和关键词是两个不同参数，应用场景决定整体画面，关键词只做补充，不要互相覆盖。',
      '要求：不要出现发疯嘴替、阴阳怪气、攻击吐槽等语气。',
      '要求：偏生活化、年轻、清新、自然、分享感。',
      '只输出最终文案，不要解释。'
    ].join('\n')
  },

  getAppSceneValue() {
    return this.data.appScene === 'custom' ? (this.data.customAppScene || '') : this.data.appScene
  },

  getStyleLabel(name) {
    if (name === 'custom') {
      return this.data.customStyle ? `自定义：${this.data.customStyle}` : '自定义'
    }

    const hit = this.data.styles.find(item => item.name === name)
    return hit ? hit.label : '简短干净'
  },

  formatTime(date) {
    const pad = value => (value < 10 ? `0${value}` : `${value}`)
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  },

  onUnload() {
    if (this.data.typingTimer) {
      clearInterval(this.data.typingTimer)
    }
  }
})
