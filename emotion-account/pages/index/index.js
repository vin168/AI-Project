// 首页逻辑
const app = getApp();

Page({
  data: {
    // 今日统计数据
    todayStats: null,
    // 记录列表
    records: [],
    expenseRecords: [],
    incomeRecords: [],
    // 当前选中的记录（用于长按操作）
    selectedRecord: null,
    // 是否显示操作菜单
    showActionSheet: false,
    // 页面加载状态
    isLoading: true,
    // 下拉刷新状态
    isRefreshing: false,
    swipeStartX: null,
    swipeStartY: null,
    swipedRecordId: null
  },

  onLoad: function(options) {
    console.log('首页加载');
    this.loadPageData();
  },

  onShow: function() {
    // 每次页面显示时刷新数据
    this.loadPageData();
  },

  onPullDownRefresh: function() {
    // 下拉刷新
    this.setData({ isRefreshing: true });
    this.loadPageData(() => {
      this.setData({ isRefreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function() {
    // 上拉加载更多
    this.loadMoreRecords();
  },

  // 加载页面数据
  loadPageData: function(callback) {
    this.setData({ isLoading: true });
    this.resetSwipe();

    // 获取今日统计数据
    const todayStats = this.calculateTodayStats();

    // 获取最近的记录
    const records = this.getRecentRecords(20); // 最近20条记录
    const expenseRecords = records.filter(r => r.type === 'expense');
    const incomeRecords = records.filter(r => r.type === 'income');

    this.setData({
      todayStats: todayStats,
      records: records,
      expenseRecords: expenseRecords,
      incomeRecords: incomeRecords,
      isLoading: false
    }, () => {
      if (callback && typeof callback === 'function') {
        callback();
      }
    });
  },

  // 计算今日统计数据
  calculateTodayStats: function() {
    const records = app.getAccountRecords();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecords = records.filter(r => {
      const recordDate = new Date(r.createdAt);
      return recordDate >= today && recordDate < tomorrow;
    });

    let totalExpense = 0;
    let totalIncome = 0;
    const emotionMap = {};

    todayRecords.forEach(record => {
      const amount = Math.abs(record.amount);

      if (record.type === 'expense') {
        totalExpense += amount;

        // 统计情绪
        if (!emotionMap[record.emotionId]) {
          emotionMap[record.emotionId] = {
            amount: 0,
            count: 0
          };
        }
        emotionMap[record.emotionId].amount += amount;
        emotionMap[record.emotionId].count += 1;
      } else {
        totalIncome += amount;
      }
    });

    // 找出占比最高的情绪
    let topEmotion = null;
    if (totalExpense > 0) {
      let maxPercentage = 0;
      for (const emotionId in emotionMap) {
        const percentage = (emotionMap[emotionId].amount / totalExpense) * 100;
        if (percentage > maxPercentage) {
          maxPercentage = percentage;
          const emotion = app.globalData.emotions.find(e => e.id == emotionId);
          if (emotion) {
            topEmotion = {
              emotionId: emotion.id,
              name: emotion.name,
              icon: emotion.icon,
              percentage: percentage.toFixed(1)
            };
          }
        }
      }
    }

    const formatAmount = (value) => Number(value || 0).toFixed(2);

    return {
      totalExpense: totalExpense,
      totalIncome: totalIncome,
      recordCount: todayRecords.length,
      topEmotion: topEmotion,
      totalExpenseDisplay: formatAmount(totalExpense),
      totalIncomeDisplay: formatAmount(totalIncome)
    };
  },

  // 获取最近的记录
  getRecentRecords: function(limit) {
    const records = app.getAccountRecords();
    const recentRecords = records.slice(0, limit);

    // 格式化记录数据
    return recentRecords.map(record => {
      const emotion = app.globalData.emotions.find(e => e.id == record.emotionId);
      const category = app.globalData.categories.find(c => c.id == record.categoryId);

      // 格式化日期
      const recordDate = new Date(record.createdAt);
      const now = new Date();
      const diffMs = now - recordDate;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      let displayTime = '';
      if (diffMins < 60) {
        displayTime = `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        displayTime = `${diffHours}小时前`;
      } else {
        displayTime = recordDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      }

      return {
        ...record,
        amountDisplay: Math.abs(record.amount).toFixed(2),
        createdAtDisplay: displayTime,
        emotionName: emotion ? emotion.name : '未知',
        emotionIcon: emotion ? emotion.icon : '',
        categoryName: category ? category.name : '未知',
        categoryIcon: category ? category.icon : ''
      };
    });
  },

  // 加载更多记录
  loadMoreRecords: function() {
    const currentCount = this.data.records.length;
    const newRecords = this.getRecentRecords(currentCount + 20);

    if (newRecords.length > currentCount) {
      const expenseRecords = newRecords.filter(r => r.type === 'expense');
      const incomeRecords = newRecords.filter(r => r.type === 'income');
      this.setData({
        records: newRecords,
        expenseRecords: expenseRecords,
        incomeRecords: incomeRecords
      });
    }
  },

  // 点击记账按钮
  onAddRecordTap: function() {
    wx.navigateTo({
      url: '/pages/add/add'
    });
  },

  // 点击记录
  onRecordTap: function(e) {
    const recordId = e.currentTarget.dataset.recordId;
    const record = app.getAccountRecords().find(r => String(r.id) === String(recordId));
    console.log('点击记录:', record);
    if (!record) {
      app.showToast('未找到要编辑的记录', 'none');
      return;
    }
    if (this.data.swipedRecordId) {
      this.resetSwipe();
    }

    // 跳转到编辑页
    wx.navigateTo({
      url: `/pages/add/add?editId=${record.id}`
    });
  },

  onRecordTouchStart: function(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) {
      return;
    }

    const recordId = e.currentTarget.dataset.recordId;
    if (this.data.swipedRecordId && this.data.swipedRecordId !== recordId) {
      this.resetSwipe();
    }

    this.setData({
      swipeStartX: touch.clientX,
      swipeStartY: touch.clientY
    });
  },

  onRecordTouchMove: function(e) {
    const touch = e.touches && e.touches[0];
    if (!touch || this.data.swipeStartX === null) {
      return;
    }

    const deltaX = touch.clientX - this.data.swipeStartX;
    const deltaY = touch.clientY - this.data.swipeStartY;
    if (Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    const recordId = e.currentTarget.dataset.recordId;
    if (deltaX < -40) {
      this.setData({ swipedRecordId: recordId });
    } else if (deltaX > 40 && this.data.swipedRecordId === recordId) {
      this.setData({ swipedRecordId: null });
    }
  },

  onRecordTouchEnd: function() {
    this.setData({
      swipeStartX: null,
      swipeStartY: null
    });
  },

  resetSwipe: function() {
    if (this.data.swipedRecordId) {
      this.setData({ swipedRecordId: null });
    }
  },

  // 长按记录
  onRecordLongPress: function(e) {
    const recordId = e.currentTarget.dataset.recordId;
    const record = app.getAccountRecords().find(r => String(r.id) === String(recordId));
    console.log('长按记录:', record);

    if (!record) {
      return;
    }

    this.setData({
      selectedRecord: record,
      showActionSheet: true
    });
    this.resetSwipe();
  },

  onDeleteRecordSwipe: function(e) {
    const recordId = e.currentTarget.dataset.recordId;
    const categoryName = e.currentTarget.dataset.categoryName || '记录';
    this.resetSwipe();

    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条 ${categoryName} 吗？`,
      success: (res) => {
        if (res.confirm) {
          app.deleteAccountRecord(recordId, (success) => {
            if (success) {
              app.showToast('删除成功', 'success');
              this.loadPageData();
            } else {
              app.showToast('删除失败', 'error');
            }
          });
        }
      }
    });
  },

  // 编辑记录
  onEditRecord: function() {
    const record = this.data.selectedRecord;
    this.hideActionSheet();

    if (record) {
      // 跳转到编辑页面
      wx.navigateTo({
        url: `/pages/add/add?editId=${record.id}`
      });
    }
  },

  // 删除记录
  onDeleteRecord: function() {
    const record = this.data.selectedRecord;
    this.hideActionSheet();

    if (record) {
      wx.showModal({
        title: '确认删除',
        content: `确定要删除这条 ${record.categoryName} 记录吗？`,
        success: (res) => {
          if (res.confirm) {
            app.deleteAccountRecord(record.id, (success) => {
              if (success) {
                app.showToast('删除成功', 'success');
                this.loadPageData(); // 重新加载数据
              } else {
                app.showToast('删除失败', 'error');
              }
            });
          }
        }
      });
    }
  },

  // 隐藏操作菜单
  hideActionSheet: function() {
    this.setData({
      showActionSheet: false,
      selectedRecord: null
    });
  },

  // 阻止事件冒泡
  stopPropagation: function(e) {
    // 空函数，仅用于阻止事件冒泡
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '情绪账本 - 记录有温度的消费',
      path: '/pages/index/index'
    };
  }
});