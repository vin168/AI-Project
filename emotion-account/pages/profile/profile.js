// 我的页面逻辑
const app = getApp();
const cloud = require('../../utils/cloud');

Page({
  data: {
    recordCount: 0,
    monthlyBudget: 0,
    monthlyBudgetDisplay: '0.00',
    monthExpense: 0,
    monthExpenseDisplay: '0.00',
    monthIncome: 0,
    monthIncomeDisplay: '0.00',
    monthNet: 0,
    monthNetDisplay: '0.00',
    budgetProgress: 0,
    budgetProgressDisplay: '0.0',
    budgetRemaining: 0,
    budgetRemainingDisplay: '0.00',
    lastReportDate: '',
    showAnnualReportPicker: false,
    annualReportYearOptions: [],
    annualReportYearIndex: 0,
    selectedAnnualReportYearLabel: '',
    hasWechatProfile: false,
    wechatNickname: '',
    wechatAvatarUrl: '',
    cloudBackupStatus: '未登录',
    cloudBackupDescription: '点击登录后即可使用云备份与云恢复',
    isLoading: true
  },

  onLoad: function() {
    this.initAnnualReportPickerOptions();
    this.loadPageData();
  },

  onShow: function() {
    this.loadPageData();
  },

  loadPageData: function() {
    const records = app.getAccountRecords();
    const recordCount = records.length;
    const monthlyBudget = Number(app.globalData.monthlyBudget || 0);
    const monthStats = app.getStatistics('month');
    const monthExpense = Number(monthStats.totalExpense || 0);
    const monthIncome = Number(monthStats.totalIncome || 0);
    const monthNet = monthIncome - monthExpense;
    const budgetProgress = monthlyBudget > 0 ? (monthExpense / monthlyBudget) * 100 : 0;
    const budgetRemaining = Math.max(monthlyBudget - monthExpense, 0);
    const cloudStatus = cloud.getCloudStatus();
    const wechatProfile = cloudStatus.wechatProfile || this.getWechatProfile();
    const cloudDescription = this.buildCloudDescription(cloudStatus);

    this.setData({
      recordCount: recordCount,
      monthlyBudget: monthlyBudget,
      monthlyBudgetDisplay: monthlyBudget.toFixed(2),
      monthExpense: monthExpense,
      monthExpenseDisplay: monthExpense.toFixed(2),
      monthIncome: monthIncome,
      monthIncomeDisplay: monthIncome.toFixed(2),
      monthNet: monthNet,
      monthNetDisplay: Math.abs(monthNet).toFixed(2),
      budgetProgress: budgetProgress,
      budgetProgressDisplay: budgetProgress.toFixed(1),
      budgetRemaining: budgetRemaining,
      budgetRemainingDisplay: budgetRemaining.toFixed(2),
      hasWechatProfile: !!wechatProfile,
      wechatNickname: wechatProfile ? wechatProfile.nickName || '微信用户' : '',
      wechatAvatarUrl: wechatProfile ? wechatProfile.avatarUrl || '' : '',
      cloudBackupStatus: cloudStatus.isLoggedIn ? '已登录' : '未登录',
      cloudBackupDescription: cloudDescription,
      lastReportDate: this.getLastReportDate(),
      isLoading: false
    });
  },

  buildCloudDescription: function(cloudStatus) {
    if (!cloudStatus || !cloudStatus.isLoggedIn) {
      return '点击登录后即可使用云备份与云恢复';
    }

    const lastBackupTime = cloudStatus.lastBackupTime;
    if (!lastBackupTime) {
      return '已登录，可随时云备份/云恢复';
    }

    const date = new Date(lastBackupTime);
    if (isNaN(date.getTime())) {
      return '已登录，可随时云备份/云恢复';
    }

    const pad = (n) => (n < 10 ? `0${n}` : String(n));
    const display = `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return `已登录，上次备份 ${display}`;
  },

  getWechatProfile: function() {
    try {
      return wx.getStorageSync('cloudBackupWechatProfile') || null;
    } catch (e) {
      console.error('读取微信资料失败:', e);
      return null;
    }
  },

  saveWechatProfile: function(profile) {
    try {
      wx.setStorageSync('cloudBackupWechatProfile', profile);
    } catch (e) {
      console.error('保存微信资料失败:', e);
    }
  },

  onCloudBackupTap: function() {
    const cloudStatus = cloud.getCloudStatus();

    if (!cloudStatus.isLoggedIn) {
      if (!wx.getUserProfile) {
        wx.showModal({
          title: '当前版本不支持',
          content: '当前微信基础库暂不支持获取微信资料，请升级微信后再试。',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }

      wx.getUserProfile({
        desc: '用于登录并绑定云备份账号',
        success: (res) => {
          const userInfo = (res && res.userInfo) ? res.userInfo : {};
          cloud.saveWechatProfileForDisplay(userInfo);

          wx.showLoading({ title: '正在登录...' });

          // 原生微信请求调试 - 先获取微信code
          wx.login({
            success: (loginRes) => {
              if (!loginRes.code) {
                wx.hideLoading();
                app.showToast('获取登录code失败', 'none');
                return;
              }

              // 构建device信息（简化版）
              let systemInfo = null;
              try {
                systemInfo = wx.getSystemInfoSync();
              } catch (e) {
                systemInfo = null;
              }

              const device = {
                deviceCode: `debug_${Date.now()}`,
                deviceName: systemInfo ? `${systemInfo.brand || ''} ${systemInfo.model || ''}`.trim() : '调试设备',
                platform: systemInfo ? systemInfo.platform : 'devtools'
              };

              // 构建userProfile
              const userProfile = userInfo ? {
                nickname: userInfo.nickName || '',
                avatarUrl: userInfo.avatarUrl || '',
                gender: Number(userInfo.gender || 0),
                country: userInfo.country || '',
                province: userInfo.province || '',
                city: userInfo.city || ''
              } : null;

              // 原生wx.request调用
              wx.request({
                url: 'https://stunningvin.abrdns.com/api/v1/auth/wx-login',
                method: 'POST',
                header: {
                  'content-type': 'application/json'  // 微信要求小写
                },
                data: {
                  code: loginRes.code,
                  userProfile: userProfile,
                  device: device
                },
                success: (res) => {
                  console.log('✅ 原生请求成功！', res.data);

                  if (res.data && res.data.code === 0) {
                    // 保存token（模拟cloud.js逻辑）
                    if (res.data.data && res.data.data.accessToken) {
                      wx.setStorageSync('cloudAccessToken', res.data.data.accessToken);
                    }

                    wx.hideLoading();
                    this.loadPageData();
                    wx.showModal({
                      title: '登录成功',
                      content: '原生请求验证通过！已接入云备份服务。',
                      showCancel: false,
                      confirmText: '知道了'
                    });
                  } else {
                    // 业务逻辑错误
                    wx.hideLoading();
                    console.log('❌ 业务逻辑失败:', res.data);
                    const errorMsg = res.data && res.data.message ? res.data.message : '未知业务错误';
                    wx.showModal({
                      title: '登录失败',
                      content: `业务错误: ${errorMsg}`,
                      showCancel: false,
                      confirmText: '知道了'
                    });
                  }
                },
                fail: (err) => {
                  wx.hideLoading();
                  console.log('❌ 网络请求失败:', err);

                  // 错误处理
                  let errorMsg = err.errMsg || '网络连接失败';
                  if (err.errMsg && err.errMsg.includes('url not in domain list')) {
                    errorMsg = '域名未在微信公众平台配置，请配置合法域名';
                  } else if (err.errMsg && err.errMsg.includes('CONNECTION_RESET')) {
                    errorMsg = '连接被重置，请检查服务器是否运行、Nginx配置和SSL证书';
                  }

                  wx.showModal({
                    title: '网络错误',
                    content: `错误: ${errorMsg}\n\n调试建议：\n1. 检查服务器Node.js进程\n2. 检查Nginx反向代理配置\n3. 验证SSL证书有效性\n4. 检查微信公众平台域名白名单`,
                    showCancel: false,
                    confirmText: '知道了'
                  });
                }
              });
            },
            fail: (loginErr) => {
              wx.hideLoading();
              app.showToast('微信登录失败', 'none');
            }
          });
        },
        fail: (error) => {
          if (error && /cancel/i.test(error.errMsg || '')) {
            app.showToast('你已取消授权', 'none');
            return;
          }

          wx.showModal({
            title: '暂时无法授权',
            content: '没有拿到微信公开资料，请稍后再试。',
            showCancel: false,
            confirmText: '知道了'
          });
        }
      });

      return;
    }

    wx.showActionSheet({
      itemList: ['云备份', '云恢复'],
      success: (res) => {
        if (!res || typeof res.tapIndex !== 'number') {
          return;
        }

        if (res.tapIndex === 0) {
          this.doCloudBackup();
          return;
        }

        if (res.tapIndex === 1) {
          this.doCloudRestore();
        }
      }
    });
  },

  doCloudBackup: function() {
    wx.showLoading({ title: '正在备份...' });
    cloud.cloudFullBackup()
      .then((result) => {
        wx.hideLoading();
        this.loadPageData();
        const recordCount = result && typeof result.recordCount === 'number' ? result.recordCount : null;
        app.showToast(recordCount === null ? '备份成功' : `备份成功（${recordCount}条）`, 'success');
      })
      .catch((err) => {
        wx.hideLoading();
        this.handleCloudError(err, '备份失败');
      });
  },

  doCloudRestore: function() {
    wx.showModal({
      title: '云恢复',
      content: '将从云端恢复并覆盖当前本地数据（记录、自定义分类/情绪、预算）。确认继续吗？',
      confirmText: '继续',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (!res.confirm) {
          return;
        }

        wx.showLoading({ title: '正在恢复...' });
        cloud.cloudFullRestore()
          .then((data) => {
            wx.hideLoading();
            try {
              if (typeof app.loadLocalData === 'function') {
                app.loadLocalData();
              }
            } catch (e) {
              // ignore
            }
            this.loadPageData();

            const payload = data && data.payload ? data.payload : null;
            const recordCount = payload && Array.isArray(payload.records) ? payload.records.length : null;
            app.showToast(recordCount === null ? '恢复成功' : `恢复成功（${recordCount}条）`, 'success');
          })
          .catch((err) => {
            wx.hideLoading();
            this.handleCloudError(err, '恢复失败');
          });
      }
    });
  },

  handleCloudError: function(err, fallbackTitle) {
    const body = err && err.body ? err.body : null;
    const statusCode = err && err.statusCode ? err.statusCode : null;
    const message = (body && body.message) ? body.message : (err && err.error && err.error.errMsg ? err.error.errMsg : '请稍后再试');

    // token 失效：清理并提示重新登录
    if (statusCode === 401) {
      cloud.clearStoredAuth();
      this.loadPageData();
      wx.showModal({
        title: '登录状态已过期',
        content: '请重新点击云备份进行登录。',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    wx.showModal({
      title: fallbackTitle || '操作失败',
      content: message,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  getLastReportDate: function() {
    try {
      const lastReport = wx.getStorageSync('lastReportDate');
      if (lastReport) {
        const date = new Date(lastReport);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    } catch (e) {
      console.error('获取上次报告日期失败:', e);
    }
    return '';
  },

  onBudgetInput: function(e) {
    const value = e.detail.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      this.setData({
        monthlyBudget: value
      });
    }
  },

  onSaveBudget: function() {
    const budget = parseFloat(this.data.monthlyBudget);

    if (isNaN(budget) || budget < 0) {
      app.showToast('请输入有效的预算金额', 'none');
      return;
    }

    app.setMonthlyBudget(budget, (success) => {
      if (success) {
        app.showToast('预算设置成功', 'success');
        const nextProgress = budget > 0 ? (this.data.monthExpense / budget) * 100 : 0;
        this.loadPageData();

        if (budget > 0 && nextProgress > 80) {
          wx.showToast({
            title: nextProgress >= 100 ? '预算已超支！' : '预算即将用完',
            icon: 'none',
            duration: 2000
          });
        }
      } else {
        app.showToast('保存失败', 'error');
      }
    });
  },

  onViewReport: function() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;

    const report = app.generateMonthlyReport(year, month);

    if (report) {
      wx.navigateTo({
        url: `/pages/report2/report2?year=${year}&month=${month}`
      });
    } else {
      wx.showModal({
        title: '暂无报告',
        content: `上个月(${year}年${month}月)没有记账记录，无法生成报告。`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  onGenerateReport: function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const report = app.generateMonthlyReport(year, month);

    if (report) {
      try {
        wx.setStorageSync('lastReportDate', new Date().toISOString());
      } catch (e) {
        console.error('保存报告日期失败:', e);
      }

      this.setData({
        lastReportDate: `${month}月`
      });

      wx.navigateTo({
        url: `/pages/report2/report2?year=${year}&month=${month}&force=true`
      });
    } else {
      app.showToast('本月暂无记账记录', 'none');
    }
  },

  onViewAnnualReport: function() {
    const now = new Date();
    const year = now.getFullYear();

    const report = app.generateAnnualReport(year);

    if (report) {
      wx.navigateTo({
        url: `/pages/report2/report2?year=${year}&mode=year`
      });
    } else {
      wx.showModal({
        title: '暂无报告',
        content: `${year}年还没有记账记录，暂时无法生成年度报告。`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  initAnnualReportPickerOptions: function() {
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2020, currentYear - 5);
    const annualReportYearOptions = [];

    for (let year = currentYear; year >= startYear; year--) {
      annualReportYearOptions.push(`${year}年`);
    }

    this.setData({
      annualReportYearOptions: annualReportYearOptions,
      annualReportYearIndex: 0,
      selectedAnnualReportYearLabel: annualReportYearOptions[0] || `${currentYear}年`
    });
  },

  openAnnualReportPicker: function() {
    this.setData({
      showAnnualReportPicker: true,
      annualReportYearIndex: 0,
      selectedAnnualReportYearLabel: this.data.annualReportYearOptions[0] || `${new Date().getFullYear()}年`
    });
  },

  closeAnnualReportPicker: function() {
    this.setData({
      showAnnualReportPicker: false
    });
  },

  noop: function() {},

  onAnnualReportYearChange: function(e) {
    const index = Number(e.detail.value);
    const selectedAnnualReportYearLabel = this.data.annualReportYearOptions[index] || this.data.selectedAnnualReportYearLabel;

    this.setData({
      annualReportYearIndex: index,
      selectedAnnualReportYearLabel: selectedAnnualReportYearLabel
    });
  },

  confirmAnnualReportPicker: function() {
    const yearLabel = this.data.selectedAnnualReportYearLabel || '';
    const year = parseInt(yearLabel, 10);

    if (!year) {
      app.showToast('请选择有效的年度', 'none');
      return;
    }

    const report = app.generateAnnualReport(year);

    if (report) {
      this.setData({
        showAnnualReportPicker: false
      });

      wx.navigateTo({
        url: `/pages/report2/report2?year=${year}&mode=year`
      });
    } else {
      wx.showModal({
        title: '暂无报告',
        content: `${year}年还没有记账记录，暂时无法生成年度报告。`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  onAbout: function() {
    wx.showModal({
      title: '关于情绪账本',
      content: '版本: 1.0.0\n\n情绪账本是一款记录生活情绪的小账本，通过消费和收入时的感受，帮助你看见金钱背后的心情。\n\n我们注重您的隐私，所有数据都保存在您的设备本地。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onFeedback: function() {
    wx.showModal({
      title: '反馈建议',
      content: '如果您有任何建议或发现问题，欢迎通过以下方式联系我们：\n\n1. 在小程序内提交反馈\n2. 发送邮件到 vin.ji@foxmail.com\n\n感谢您的支持！',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
