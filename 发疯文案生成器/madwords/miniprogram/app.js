App({
  globalData: {
    theme: 'dark'
  },

  onLaunch() {
    if (!wx.cloud) {
      console.warn('当前基础库不支持 wx.cloud，请升级微信开发者工具或基础库。')
      return
    }

    wx.cloud.init({
      traceUser: true
    })
  }
})
