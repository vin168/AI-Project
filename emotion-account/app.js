// app.js - 情绪账本全局逻辑

(function() {
  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
      value: function(predicate, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }

        var list = Object(this);
        var length = list.length >>> 0;
        for (var index = 0; index < length; index++) {
          if (index in list) {
            var value = list[index];
            if (predicate.call(thisArg, value, index, list)) {
              return value;
            }
          }
        }
        return undefined;
      }
    });
  }

  if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
      value: function(predicate, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.findIndex called on null or undefined');
        }
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }

        var list = Object(this);
        var length = list.length >>> 0;
        for (var index = 0; index < length; index++) {
          if (index in list && predicate.call(thisArg, list[index], index, list)) {
            return index;
          }
        }
        return -1;
      }
    });
  }

  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
      value: function(searchElement, fromIndex) {
        if (this == null) {
          throw new TypeError('Array.prototype.includes called on null or undefined');
        }

        var list = Object(this);
        var length = list.length >>> 0;
        if (length === 0) {
          return false;
        }

        var start = fromIndex || 0;
        if (start < 0) {
          start = Math.max(length + start, 0);
        }

        for (var index = start; index < length; index++) {
          if (list[index] === searchElement || (typeof list[index] === 'number' && typeof searchElement === 'number' && isNaN(list[index]) && isNaN(searchElement))) {
            return true;
          }
        }
        return false;
      }
    });
  }

  if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
      value: function(searchString, position) {
        var subject = String(this);
        var start = position || 0;
        return subject.slice(start, start + String(searchString).length) === String(searchString);
      }
    });
  }

  if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
      value: function(searchString, position) {
        var subject = String(this);
        var len = position === undefined ? subject.length : Math.min(position, subject.length);
        return subject.slice(len - String(searchString).length, len) === String(searchString);
      }
    });
  }

  if (!String.prototype.padStart) {
    Object.defineProperty(String.prototype, 'padStart', {
      value: function(targetLength, padString) {
        var subject = String(this);
        var length = targetLength >> 0;
        var pad = padString !== undefined ? String(padString) : ' ';
        if (subject.length >= length) {
          return subject;
        }
        var fill = '';
        while (fill.length < length - subject.length) {
          fill += pad;
        }
        return fill.slice(0, length - subject.length) + subject;
      }
    });
  }

  if (!Object.assign) {
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source != null) {
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              to[key] = source[key];
            }
          }
        }
      }
      return to;
    };
  }

  if (!Object.keys) {
    Object.keys = function(obj) {
      var result = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result.push(key);
        }
      }
      return result;
    };
  }

  if (!Object.values) {
    Object.values = function(obj) {
      var keys = Object.keys(obj);
      var result = [];
      for (var index = 0; index < keys.length; index++) {
        result.push(obj[keys[index]]);
      }
      return result;
    };
  }

  if (!Object.entries) {
    Object.entries = function(obj) {
      var keys = Object.keys(obj);
      var result = [];
      for (var index = 0; index < keys.length; index++) {
        var key = keys[index];
        result.push([key, obj[key]]);
      }
      return result;
    };
  }

  if (!Array.from) {
    Array.from = function(arrayLike, mapFn, thisArg) {
      var items = Object(arrayLike);
      var result = [];
      var length = items.length >>> 0;
      for (var index = 0; index < length; index++) {
        var value = items[index];
        result.push(mapFn ? mapFn.call(thisArg, value, index) : value);
      }
      return result;
    };
  }
})();

App({
  // 全局数据
  globalData: {
    // 支出情绪标签基线
    baseExpenseEmotions: [
      { id: 1, name: '开心犒劳', icon: '😄', color: '#FFD700', desc: '奖励自己、为快乐买单' },
      { id: 2, name: '心疼肉痛', icon: '😣', color: '#DDA0DD', desc: '价格高但必需支出' },
      { id: 3, name: '冲动后悔', icon: '😖', color: '#FF6B6B', desc: '一时脑热、买完后悔' },
      { id: 4, name: '无奈必需', icon: '😐', color: '#A9A9A9', desc: '房租、水电、通勤等刚性支出' },
      { id: 5, name: '治愈安慰', icon: '🥰', color: '#ADD8E6', desc: '不开心时的舒缓性消费' },
      { id: 6, name: '值得投资', icon: '🤩', color: '#98FB98', desc: '学习、健康、自我提升类消费' }
    ],
    // 收入情绪标签基线
    baseIncomeEmotions: [
      { id: 101, name: '踏实安心', icon: '🙂', color: '#B7E4C7', desc: '工资到账、心里更有底气' },
      { id: 102, name: '惊喜收获', icon: '🎉', color: '#FFE08A', desc: '奖金、红包、意外之喜' },
      { id: 103, name: '努力值得', icon: '💪', color: '#9AD1F5', desc: '兼职、副业、项目回报' },
      { id: 104, name: '成长回报', icon: '🌱', color: '#A8E6A1', desc: '投资、学习或长期积累开始见效' },
      { id: 105, name: '被爱包围', icon: '💝', color: '#F8B4C6', desc: '礼金、家人支持、人情往来带来的温暖' },
      { id: 106, name: '如释重负', icon: '😌', color: '#C9C9E8', desc: '报销到账、欠款收回、压力减轻' }
    ],
    // 消费/收入分类基线
    baseExpenseCategories: [
      { id: 1, name: '餐饮', icon: '🍜' },
      { id: 2, name: '购物', icon: '🛍️' },
      { id: 3, name: '交通', icon: '🚗' },
      { id: 4, name: '娱乐', icon: '🎮' },
      { id: 5, name: '日用', icon: '🏠' },
      { id: 6, name: '学习', icon: '📚' },
      { id: 7, name: '人情', icon: '👥' },
      { id: 8, name: '医疗', icon: '🏥' }
    ],
    baseIncomeCategories: [
      { id: 101, name: '工资', icon: '💼' },
      { id: 102, name: '兼职', icon: '🛠️' },
      { id: 103, name: '投资收益', icon: '📈' },
      { id: 104, name: '礼金', icon: '🎁' }
    ],
    emotions: [],
    expenseEmotions: [],
    incomeEmotions: [],
    expenseCategories: [],
    incomeCategories: [],
    categories: [],
    // 默认月度预算
    monthlyBudget: 0,
    // 当前选择的日期范围
    currentDateRange: 'month'
  },

  // 小程序初始化
  onLaunch: function() {
    console.log('情绪账本小程序初始化');

    // 从本地存储加载数据
    this.loadLocalData();

    // 获取系统信息
    this.getSystemInfo();
  },


  // 从本地存储加载数据
  loadLocalData: function() {
    try {
      // 加载月度预算
      const budget = wx.getStorageSync('monthlyBudget');
      if (budget) {
        this.globalData.monthlyBudget = budget;
      }

      // 加载记账记录
      const records = wx.getStorageSync('accountRecords');
      if (!records) {
        // 如果没有记录，初始化空数组
        wx.setStorageSync('accountRecords', []);
      }

      // 同步分类/情绪的定制数据
      this.syncCustomizationData();
    } catch (e) {
      console.error('加载本地数据失败:', e);
    }
  },

  // 同步自定义分类/情绪
  syncCustomizationData: function() {
    try {
      const customExpenseRaw = wx.getStorageSync('customExpenseCategories');
      const customIncomeRaw = wx.getStorageSync('customIncomeCategories');
      const customEmotionsRaw = wx.getStorageSync('customEmotions');

      const customExpense = Array.isArray(customExpenseRaw)
        ? customExpenseRaw.map(item => ({ ...item, custom: true, type: 'expense' }))
        : [];
      const customIncome = Array.isArray(customIncomeRaw)
        ? customIncomeRaw.map(item => ({ ...item, custom: true, type: 'income' }))
        : [];
      const customEmotions = Array.isArray(customEmotionsRaw)
        ? customEmotionsRaw.map(item => ({ ...item, custom: true, type: item.type || 'expense' }))
        : [];

      const expenseCategories = [...this.globalData.baseExpenseCategories, ...customExpense];
      const incomeCategories = [...this.globalData.baseIncomeCategories, ...customIncome];

      this.globalData.expenseCategories = expenseCategories;
      this.globalData.incomeCategories = incomeCategories;
      this.globalData.categories = [...expenseCategories, ...incomeCategories];

      const customExpenseEmotions = customEmotions.filter(item => item.type !== 'income');
      const customIncomeEmotions = customEmotions.filter(item => item.type === 'income');
      const expenseEmotions = [...this.globalData.baseExpenseEmotions, ...customExpenseEmotions];
      const incomeEmotions = [...this.globalData.baseIncomeEmotions, ...customIncomeEmotions];

      this.globalData.expenseEmotions = expenseEmotions;
      this.globalData.incomeEmotions = incomeEmotions;
      this.globalData.emotions = [...expenseEmotions, ...incomeEmotions];
    } catch (err) {
      console.error('同步自定义项失败:', err);
    }
  },

  generateCustomId: function() {
    return Date.now() + Math.floor(Math.random() * 1000);
  },

  normalizeHexColor: function(value) {
    if (!value) {
      return '';
    }
    let color = value.trim();
    if (!color) {
      return '';
    }
    if (!color.startsWith('#')) {
      color = `#${color}`;
    }
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) ? color : '';
  },

  addCustomCategory: function(type, payload) {
    const name = (payload.name || '').trim();
    if (!name) {
      return { success: false, error: '分类名称不能为空' };
    }

    const icon = (payload.icon || '').trim() || (type === 'income' ? '💸' : '🔖');
    const newCategory = {
      id: this.generateCustomId(),
      name: name,
      icon: icon,
      type: type
    };

    const storageKey = type === 'income' ? 'customIncomeCategories' : 'customExpenseCategories';
    const current = wx.getStorageSync(storageKey);
    const list = Array.isArray(current) ? current : [];
    list.push(newCategory);
    wx.setStorageSync(storageKey, list);

    this.syncCustomizationData();
    return { success: true, category: newCategory };
  },

  addCustomEmotion: function(type, payload) {
    const name = (payload.name || '').trim();
    if (!name) {
      return { success: false, error: '情绪名称不能为空' };
    }

    const emotion = {
      id: this.generateCustomId(),
      name: name,
      type: type === 'income' ? 'income' : 'expense',
      icon: (payload.icon || '').trim() || '🎯',
      color: this.normalizeHexColor(payload.color) || '#F7A6B2',
      desc: (payload.desc || '').trim() || '自定义情绪'
    };

    const current = wx.getStorageSync('customEmotions');
    const list = Array.isArray(current) ? current : [];
    list.push(emotion);
    wx.setStorageSync('customEmotions', list);

    this.syncCustomizationData();
    return { success: true, emotion: emotion };
  },

  removeCustomCategory: function(type, categoryId) {
    const storageKey = type === 'income' ? 'customIncomeCategories' : 'customExpenseCategories';
    const currentRaw = wx.getStorageSync(storageKey);
    const current = Array.isArray(currentRaw) ? currentRaw : [];
    const normalizedId = Number(categoryId);
    const filtered = current.filter(item => Number(item.id) !== normalizedId);

    if (filtered.length === current.length) {
      return false;
    }

    wx.setStorageSync(storageKey, filtered);
    this.syncCustomizationData();
    return true;
  },

  removeCustomEmotion: function(emotionId) {
    const currentRaw = wx.getStorageSync('customEmotions');
    const current = Array.isArray(currentRaw) ? currentRaw : [];
    const normalizedId = Number(emotionId);
    const filtered = current.filter(item => Number(item.id) !== normalizedId);

    if (filtered.length === current.length) {
      return false;
    }

    wx.setStorageSync('customEmotions', filtered);
    this.syncCustomizationData();
    return true;
  },

  // 获取系统信息
  getSystemInfo: function() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
        console.log('系统信息:', res);
      }
    });
  },

  // 添加记账记录
  addAccountRecord: function(record, callback) {
    try {
      // 获取现有记录
      const records = wx.getStorageSync('accountRecords') || [];
      const createdAt = record.createdAt || new Date().toISOString();

      // 生成记录ID和时间戳
      const newRecord = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        ...record,
        createdAt: createdAt,
        updatedAt: new Date().toISOString()
      };

      // 添加到记录数组
      records.unshift(newRecord);

      // 保存到本地存储
      wx.setStorageSync('accountRecords', records);

      console.log('记账记录已保存:', newRecord);

      // 调用回调函数
      if (callback && typeof callback === 'function') {
        callback(true, newRecord);
      }

      return true;
    } catch (e) {
      console.error('保存记账记录失败:', e);
      if (callback && typeof callback === 'function') {
        callback(false, null);
      }
      return false;
    }
  },

  // 更新记账记录
  updateAccountRecord: function(recordId, updates, callback) {
    try {
      const records = wx.getStorageSync('accountRecords') || [];
      const index = records.findIndex(r => r.id === recordId);

      if (index !== -1) {
        // 更新记录
        records[index] = {
          ...records[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };

        wx.setStorageSync('accountRecords', records);

        if (callback && typeof callback === 'function') {
          callback(true, records[index]);
        }
        return true;
      } else {
        console.error('未找到记录:', recordId);
        if (callback && typeof callback === 'function') {
          callback(false, null);
        }
        return false;
      }
    } catch (e) {
      console.error('更新记账记录失败:', e);
      if (callback && typeof callback === 'function') {
        callback(false, null);
      }
      return false;
    }
  },

  // 删除记账记录
  deleteAccountRecord: function(recordId, callback) {
    try {
      let records = wx.getStorageSync('accountRecords') || [];
      const initialLength = records.length;

      // 过滤掉要删除的记录
      records = records.filter(r => r.id !== recordId);

      if (records.length < initialLength) {
        wx.setStorageSync('accountRecords', records);
        console.log('记账记录已删除:', recordId);

        if (callback && typeof callback === 'function') {
          callback(true);
        }
        return true;
      } else {
        console.error('未找到记录:', recordId);
        if (callback && typeof callback === 'function') {
          callback(false);
        }
        return false;
      }
    } catch (e) {
      console.error('删除记账记录失败:', e);
      if (callback && typeof callback === 'function') {
        callback(false);
      }
      return false;
    }
  },

  // 获取记账记录
  getAccountRecords: function(filter = {}) {
    try {
      let records = wx.getStorageSync('accountRecords') || [];

      // 应用过滤器
      if (filter.startDate) {
        records = records.filter(r => new Date(r.createdAt) >= new Date(filter.startDate));
      }
      if (filter.endDate) {
        records = records.filter(r => new Date(r.createdAt) <= new Date(filter.endDate));
      }
      if (filter.emotionId) {
        records = records.filter(r => r.emotionId === filter.emotionId);
      }
      if (filter.categoryId) {
        records = records.filter(r => r.categoryId === filter.categoryId);
      }
      if (filter.type) {
        records = records.filter(r => r.type === filter.type);
      }

      return records;
    } catch (e) {
      console.error('获取记账记录失败:', e);
      return [];
    }
  },

  // 设置月度预算
  setMonthlyBudget: function(budget, callback) {
    try {
      this.globalData.monthlyBudget = budget;
      wx.setStorageSync('monthlyBudget', budget);

      if (callback && typeof callback === 'function') {
        callback(true);
      }
      return true;
    } catch (e) {
      console.error('设置月度预算失败:', e);
      if (callback && typeof callback === 'function') {
        callback(false);
      }
      return false;
    }
  },

  // 获取统计数据
  getStatistics: function(dateRange = 'month') {
    const records = this.getAccountRecords();
    const now = new Date();
    let startDate, endDate;

    // 根据日期范围过滤记录
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 周一开始
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        endDate = new Date(now.getFullYear(), now.getMonth(), diff + 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        // 自定义日期范围
        startDate = new Date(dateRange.start);
        endDate = new Date(dateRange.end);
    }

    const filteredRecords = records.filter(r => {
      const recordDate = new Date(r.createdAt);
      return recordDate >= startDate && recordDate < endDate;
    });

    // 计算统计数据
    const stats = {
      totalExpense: 0,
      totalIncome: 0,
      netExpense: 0,
      byEmotion: {},
      byCategory: {},
      recordCount: filteredRecords.length
    };

    filteredRecords.forEach(record => {
      const amount = Math.abs(record.amount);

      if (record.type === 'expense') {
        stats.totalExpense += amount;
      } else {
        stats.totalIncome += amount;
      }

      if (record.emotionId) {
        if (!stats.byEmotion[record.emotionId]) {
          stats.byEmotion[record.emotionId] = {
            amount: 0,
            count: 0,
            type: record.type
          };
        }
        stats.byEmotion[record.emotionId].amount += amount;
        stats.byEmotion[record.emotionId].count += 1;
      }

      // 按分类统计
      if (!stats.byCategory[record.categoryId]) {
        stats.byCategory[record.categoryId] = {
          amount: 0,
          count: 0,
          type: record.type
        };
      }
      stats.byCategory[record.categoryId].amount += amount;
      stats.byCategory[record.categoryId].count += 1;
    });

    stats.netExpense = stats.totalExpense - stats.totalIncome;

    return stats;
  },

  // 生成月度报告
  generateMonthlyReport: function(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const records = this.getAccountRecords({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (records.length === 0) {
      return null;
    }

    // 计算统计数据
    const stats = this.getStatistics({ start: startDate, end: endDate });

    // 查找最冲动的一天
    const impulseRecords = records.filter(r => r.emotionId === 3); // 冲动后悔
    let mostImpulsiveDay = null;
    if (impulseRecords.length > 0) {
      // 按日期分组
      const dayMap = {};
      impulseRecords.forEach(r => {
        const date = new Date(r.createdAt).toDateString();
        if (!dayMap[date]) {
          dayMap[date] = { amount: 0, records: [] };
        }
        dayMap[date].amount += Math.abs(r.amount);
        dayMap[date].records.push(r);
      });

      // 找到金额最大的一天
      let maxAmount = 0;
      for (const date in dayMap) {
        if (dayMap[date].amount > maxAmount) {
          maxAmount = dayMap[date].amount;
          mostImpulsiveDay = {
            date: date,
            amount: dayMap[date].amount,
            records: dayMap[date].records
          };
        }
      }
    }

    // 查找最值得的一笔消费
    const worthRecords = records.filter(r => r.emotionId === 6); // 值得投资
    let mostWorthRecord = null;
    if (worthRecords.length > 0) {
      // 按金额降序排序
      worthRecords.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      mostWorthRecord = worthRecords[0];
    }

    // 查找最治愈的花费
    const healRecords = records.filter(r => r.emotionId === 5); // 治愈安慰
    let healStats = null;
    if (healRecords.length > 0) {
      const totalHealAmount = healRecords.reduce((sum, r) => sum + Math.abs(r.amount), 0);
      healStats = {
        count: healRecords.length,
        totalAmount: totalHealAmount,
        averageAmount: totalHealAmount / healRecords.length
      };
    }

    // 情绪占比排行
    const emotionRanking = [];
    const emotionIds = Object.keys(stats.byEmotion);
    for (let i = 0; i < emotionIds.length; i++) {
      const emotionId = emotionIds[i];
      const data = stats.byEmotion[emotionId];
      let emotion = null;

      for (let j = 0; j < this.globalData.emotions.length; j++) {
        if (this.globalData.emotions[j].id === parseInt(emotionId, 10)) {
          emotion = this.globalData.emotions[j];
          break;
        }
      }

      const percentage = stats.totalExpense > 0 ? (data.amount / stats.totalExpense) * 100 : 0;
      emotionRanking.push({
        emotionId: parseInt(emotionId, 10),
        name: emotion ? emotion.name : '未知情绪',
        icon: emotion ? emotion.icon : '',
        amount: data.amount || 0,
        count: data.count || 0,
        percentage: parseFloat(percentage.toFixed(1))
      });
    }

    emotionRanking.sort(function(a, b) {
      return b.percentage - a.percentage;
    });
    emotionRanking.splice(3);

    // 生成报告
    const report = {
      year: year,
      month: month,
      totalExpense: stats.totalExpense,
      totalIncome: stats.totalIncome,
      netExpense: stats.netExpense,
      emotionRanking: emotionRanking,
      mostImpulsiveDay: mostImpulsiveDay,
      mostWorthRecord: mostWorthRecord,
      healStats: healStats,
      recordCount: records.length,
      generatedAt: new Date().toISOString()
    };

    return report;
  },

  // 生成年度报告
  generateAnnualReport: function(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const records = this.getAccountRecords({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (records.length === 0) {
      return null;
    }

    const stats = this.getStatistics({ start: startDate, end: endDate });
    const monthlySummary = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      monthlySummary.push({
        month: monthIndex + 1,
        amount: 0,
        expense: 0,
        income: 0,
        count: 0,
        records: []
      });
    }

    records.forEach(record => {
      const monthIndex = new Date(record.createdAt).getMonth();
      const amount = Math.abs(record.amount);
      const monthSummary = monthlySummary[monthIndex];

      monthSummary.amount += amount;
      monthSummary.count += 1;
      monthSummary.records.push(record);

      if (record.type === 'expense') {
        monthSummary.expense += amount;
      } else {
        monthSummary.income += amount;
      }
    });

    monthlySummary.forEach(summary => {
      summary.netExpense = summary.expense - summary.income;
    });

    const topExpenseMonth = monthlySummary
      .filter(summary => summary.expense > 0)
      .sort((a, b) => b.expense - a.expense)[0] || null;

    const impulseRecords = records.filter(r => r.emotionId === 3);
    let mostImpulsiveMonth = null;
    if (impulseRecords.length > 0) {
      const monthMap = {};
      impulseRecords.forEach(r => {
        const monthIndex = new Date(r.createdAt).getMonth();
        if (!monthMap[monthIndex]) {
          monthMap[monthIndex] = { amount: 0, records: [] };
        }
        monthMap[monthIndex].amount += Math.abs(r.amount);
        monthMap[monthIndex].records.push(r);
      });

      let maxAmount = 0;
      for (const monthIndex in monthMap) {
        if (monthMap[monthIndex].amount > maxAmount) {
          maxAmount = monthMap[monthIndex].amount;
          mostImpulsiveMonth = {
            month: Number(monthIndex) + 1,
            amount: monthMap[monthIndex].amount,
            records: monthMap[monthIndex].records
          };
        }
      }
    }

    const worthRecords = records.filter(r => r.emotionId === 6);
    let mostWorthRecord = null;
    if (worthRecords.length > 0) {
      worthRecords.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      mostWorthRecord = worthRecords[0];
    }

    const healRecords = records.filter(r => r.emotionId === 5);
    let healStats = null;
    if (healRecords.length > 0) {
      const totalHealAmount = healRecords.reduce((sum, r) => sum + Math.abs(r.amount), 0);
      healStats = {
        count: healRecords.length,
        totalAmount: totalHealAmount,
        averageAmount: totalHealAmount / healRecords.length
      };
    }

    const emotionRanking = [];
    const yearlyEmotionIds = Object.keys(stats.byEmotion);
    for (let k = 0; k < yearlyEmotionIds.length; k++) {
      const emotionId = yearlyEmotionIds[k];
      const data = stats.byEmotion[emotionId];
      let emotion = null;

      for (let m = 0; m < this.globalData.emotions.length; m++) {
        if (this.globalData.emotions[m].id === parseInt(emotionId, 10)) {
          emotion = this.globalData.emotions[m];
          break;
        }
      }

      const totalAmount = stats.totalExpense + stats.totalIncome;
      const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;
      emotionRanking.push({
        emotionId: parseInt(emotionId, 10),
        name: emotion ? emotion.name : '未知情绪',
        icon: emotion ? emotion.icon : '',
        amount: data.amount || 0,
        count: data.count || 0,
        percentage: parseFloat(percentage.toFixed(1))
      });
    }

    emotionRanking.sort(function(a, b) {
      return b.percentage - a.percentage;
    });
    emotionRanking.splice(3);

    return {
      periodType: 'year',
      year: year,
      totalExpense: stats.totalExpense,
      totalIncome: stats.totalIncome,
      netExpense: stats.netExpense,
      emotionRanking: emotionRanking,
      topExpenseMonth: topExpenseMonth,
      mostImpulsiveMonth: mostImpulsiveMonth,
      mostWorthRecord: mostWorthRecord,
      healStats: healStats,
      monthlySummary: monthlySummary,
      recordCount: records.length,
      generatedAt: new Date().toISOString()
    };
  },

  getCategoryById: function(categoryId) {
    if (!categoryId) {
      return null;
    }
    const categories = this.globalData.categories || [];
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].id === categoryId) {
        return categories[i];
      }
    }
    return null;
  },

  // 显示提示信息
  showToast: function(title, icon = 'none', duration = 1500) {
    wx.showToast({
      title: title,
      icon: icon,
      duration: duration
    });
  },

  // 显示加载中
  showLoading: function(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    });
  },

  // 隐藏加载中
  hideLoading: function() {
    wx.hideLoading();
  }
});