// 统计页逻辑
const app = getApp();

Page({
  data: {
    // 统计口径
    statsMode: 'all', // 'all' | 'expense' | 'income'

    // 日期范围
    dateRange: 'month', // 'today', 'week', 'month', 'custom'
    startDate: null,
    endDate: null,
    startDateDisplay: '',
    endDateDisplay: '',

    // Tab状态
    activeTab: 'category', // 'emotion', 'category', 'date'

    // 统计数据
    emotionStats: {
      items: [],
      summary: ''
    },
    categoryExpenseStats: {
      items: []
    },
    categoryIncomeStats: {
      items: []
    },
    categoryStats: {
      items: []
    },

    // 日历相关
    calendarTitle: '',
    calendarDays: [],
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(), // 0-11
    selectedDate: null,
    selectedDateDisplay: '',
    selectedDateRecords: [],
    selectedDateExpenseRecords: [],
    selectedDateIncomeRecords: [],

    // 加载状态
    isLoading: true
  },

  onLoad: function(options) {
    console.log('统计页加载');

    // 初始化日期范围
    this.initDateRange();

    // 初始化日历
    this.initCalendar();

    // 加载统计数据
    this.loadStatistics();

    // 绘制图表
    this.drawCharts();
  },

  onShow: function() {
    // 页面显示时刷新数据
    this.loadStatistics();
  },

  // 初始化日期范围
  initDateRange: function() {
    const now = new Date();
    let startDate, endDate;

    switch (this.data.dateRange) {
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
        startDate = this.data.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = this.data.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    this.setData({
      startDate: startDate,
      endDate: endDate,
      startDateDisplay: this.formatDate(startDate),
      endDateDisplay: this.formatDate(endDate)
    });
  },

  // 初始化日历
  initCalendar: function() {
    const { currentYear, currentMonth } = this.data;
    this.generateCalendar(currentYear, currentMonth);
  },

  // 生成日历
  generateCalendar: function(year, month) {
    // 当月第一天
    const firstDay = new Date(year, month, 1);
    // 当月最后一天
    const lastDay = new Date(year, month + 1, 0);
    // 第一天是星期几 (0-6, 0=周日)
    const firstDayOfWeek = firstDay.getDay();
    // 当月天数
    const daysInMonth = lastDay.getDate();

    // 日历标题
    const calendarTitle = `${year}年${month + 1}月`;

    // 生成日期数组
    const days = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 上个月的最后几天
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: date.toISOString(),
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
        amount: 0,
        hasRecords: false
      });
    }

    // 当月日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = date.getTime() === today.getTime();
      const amounts = this.getDayAmounts(date);

      days.push({
        date: date.toISOString(),
        day: i,
        isCurrentMonth: true,
        isToday: isToday,
        amount: amounts.total,
        expenseAmount: amounts.expense,
        incomeAmount: amounts.income,
        hasRecords: amounts.total > 0
      });
    }

    // 下个月的前几天
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date: date.toISOString(),
        day: i,
        isCurrentMonth: false,
        isToday: false,
        amount: 0,
        hasRecords: false
      });
    }

    this.setData({
      calendarTitle: calendarTitle,
      calendarDays: days
    });
  },

  // 获取某天的总金额
  getDayAmounts: function(date) {
    const records = app.getAccountRecords();
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    let expense = 0;
    let income = 0;
    records.forEach(record => {
      const recordDate = new Date(record.createdAt);
      if (recordDate >= targetDate && recordDate < nextDate) {
        const amount = Math.abs(record.amount);
        if (record.type === 'expense') {
          expense += amount;
        } else {
          income += amount;
        }
      }
    });

    const total = this.data.statsMode === 'income'
      ? income
      : this.data.statsMode === 'expense'
        ? expense
        : expense + income;

    return {
      total: total,
      expense: expense,
      income: income
    };
  },

  // 日期范围变化
  onDateRangeChange: function(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({
      dateRange: range
    }, () => {
      this.initDateRange();
      this.loadStatistics();
      if (this.data.selectedDate) {
        this.setSelectedDateRecords(this.getDayRecords(this.data.selectedDate));
      }
    });
  },

  onStatsModeChange: function(e) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.statsMode) {
      return;
    }

    const nextData = {
      statsMode: mode
    };

    if (mode === 'all' && this.data.activeTab === 'emotion') {
      nextData.activeTab = 'category';
    }

    this.setData(nextData, () => {
      this.generateCalendar(this.data.currentYear, this.data.currentMonth);
      if (this.data.selectedDate) {
        this.setSelectedDateRecords(this.getDayRecords(this.data.selectedDate));
      }
      this.loadStatistics();
    });
  },

  // Tab切换
  onTabChange: function(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === 'emotion' && this.data.statsMode === 'all') {
      return;
    }
    this.setData({
      activeTab: tab
    }, () => {
      // 切换到对应Tab后绘制图表
      setTimeout(() => {
        this.drawCharts();
      }, 100);
    });
  },

  // 加载统计数据
  loadStatistics: function() {
    this.setData({ isLoading: true });

    // 获取统计数据
    const stats = app.getStatistics(this.getStatisticsRange());

    // 处理情绪统计
    const emotionStats = this.processEmotionStats(stats);

    // 处理分类统计
    const categoryExpenseStats = this.processCategoryStats(stats, 'expense');
    const categoryIncomeStats = this.processCategoryStats(stats, 'income');
    const categoryStats = this.data.statsMode === 'income'
      ? categoryIncomeStats
      : categoryExpenseStats;

    this.setData({
      emotionStats: emotionStats,
      categoryExpenseStats: categoryExpenseStats,
      categoryIncomeStats: categoryIncomeStats,
      categoryStats: categoryStats,
      isLoading: false
    }, () => {
      this.clearCharts();
      // 数据加载完成后绘制图表
      this.drawCharts();
    });
  },

  getStatisticsRange: function() {
    if (this.data.dateRange === 'custom') {
      return {
        start: this.data.startDate,
        end: this.getInclusiveEndDate(this.data.endDate)
      };
    }

    return this.data.dateRange;
  },

  getInclusiveEndDate: function(date) {
    if (!date) {
      return null;
    }

    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    return endDate;
  },

  // 处理情绪统计
  processEmotionStats: function(stats) {
    if (this.data.statsMode === 'all') {
      return {
        items: [],
        summary: ''
      };
    }

    const items = [];
    const targetType = this.data.statsMode;
    const totalAmount = targetType === 'income' ? stats.totalIncome : stats.totalExpense;

    // 情绪占比数据
    for (const emotionId in stats.byEmotion) {
      const emotionData = stats.byEmotion[emotionId];
      const emotion = app.globalData.emotions.find(e => e.id == emotionId);

      if (!emotion || totalAmount <= 0 || emotionData.type !== targetType) {
        continue;
      }

      const percentage = (emotionData.amount / totalAmount) * 100;
      items.push({
        emotionId: emotion.id,
        name: emotion.name,
        icon: emotion.icon,
        amount: emotionData.amount,
        amountDisplay: Number(emotionData.amount || 0).toFixed(2),
        percentage: percentage.toFixed(1),
        count: emotionData.count
      });
    }

    // 按占比排序
    items.sort((a, b) => b.percentage - a.percentage);

    // 生成总结文本
    let summary = '';
    if (items.length > 0) {
      const topEmotion = items[0];
      if (targetType === 'expense') {
        if (topEmotion.emotionId === 3 && topEmotion.percentage > 40) {
          summary = `本期${topEmotion.percentage}%的支出是${topEmotion.name}，请注意理性消费哦～`;
        } else {
          summary = `本期${topEmotion.percentage}%的支出是${topEmotion.name}`;
        }
      } else {
        const incomeMessages = {
          101: `本期最主要的收入感受是${topEmotion.name}，收入让你更有安全感。`,
          102: `本期${topEmotion.percentage}%的收入来自${topEmotion.name}，有点像生活送来的小彩蛋。`,
          103: `本期${topEmotion.percentage}%的收入让你感觉${topEmotion.name}，努力正在兑现。`,
          104: `本期最突出的收入情绪是${topEmotion.name}，长期积累开始见效。`,
          105: `本期有不少收入带来了${topEmotion.name}，这份支持很温暖。`,
          106: `本期${topEmotion.percentage}%的收入让你感到${topEmotion.name}，财务压力缓了一些。`
        };
        summary = incomeMessages[topEmotion.emotionId] || `本期${topEmotion.percentage}%的收入情绪是${topEmotion.name}`;
      }
    }

    return {
      items: items,
      summary: summary
    };
  },

  // 处理分类统计
  processCategoryStats: function(stats, type) {
    const items = [];
    const targetTotal = type === 'income' ? stats.totalIncome : stats.totalExpense;

    // 分类占比数据
    for (const categoryId in stats.byCategory) {
      const categoryData = stats.byCategory[categoryId];
      const category = app.globalData.categories.find(c => c.id == categoryId);

      if (category && targetTotal > 0) {
        if (categoryData.type !== type) {
          continue;
        }

        const percentage = (categoryData.amount / targetTotal) * 100;
        items.push({
          categoryId: category.id,
          name: category.name,
          icon: category.icon,
          amount: categoryData.amount,
          amountDisplay: Number(categoryData.amount || 0).toFixed(2),
          percentage: percentage.toFixed(1),
          count: categoryData.count
        });
      }
    }

    // 按占比排序
    items.sort((a, b) => b.percentage - a.percentage);

    return {
      items: items
    };
  },

  // 绘制图表
  drawCharts: function() {
    if (this.data.activeTab === 'emotion' && this.data.statsMode !== 'all') {
      this.drawEmotionChart();
    } else if (this.data.activeTab === 'category') {
      if (this.data.statsMode === 'all') {
        this.drawCategoryChart('categoryExpenseChart', this.data.categoryExpenseStats.items, '总支出');
        this.drawCategoryChart('categoryIncomeChart', this.data.categoryIncomeStats.items, '总收入');
      } else if (this.data.statsMode === 'income') {
        this.drawCategoryChart('categoryChart', this.data.categoryIncomeStats.items, '总收入');
      } else {
        this.drawCategoryChart('categoryChart', this.data.categoryExpenseStats.items, '总支出');
      }
    }
  },

  clearCharts: function() {
    this.clearCanvas('emotionChart');
    this.clearCanvas('categoryChart');
    this.clearCanvas('categoryExpenseChart');
    this.clearCanvas('categoryIncomeChart');
  },

  clearCanvas: function(canvasId) {
    const ctx = wx.createCanvasContext(canvasId);
    ctx.clearRect(0, 0, 250, 250);
    ctx.draw();
  },

  // 绘制情绪饼图
  drawEmotionChart: function() {
    const items = this.data.emotionStats.items;
    if (items.length === 0) return;

    const ctx = wx.createCanvasContext('emotionChart');

    // 饼图参数
    const centerX = 125;
    const centerY = 125;
    const radius = 80;
    let startAngle = 0;

    // 计算总和
    const total = items.reduce((sum, item) => sum + parseFloat(item.percentage), 0);

    // 绘制每个扇形
    items.forEach((item, index) => {
      const emotion = app.globalData.emotions.find(e => e.id == item.emotionId);
      if (!emotion) return;

      const percentage = parseFloat(item.percentage);
      const angle = (percentage / total) * 2 * Math.PI;

      // 绘制扇形
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.setFillStyle(emotion.color);
      ctx.fill();

      // 更新起始角度
      startAngle += angle;
    });

    // 绘制中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.setFillStyle('white');
    ctx.fill();

    // 绘制总金额
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    ctx.setFontSize(16);
    ctx.setFillStyle('#333');
    ctx.setTextAlign('center');
    ctx.fillText(
      this.data.statsMode === 'income'
        ? '总收入'
        : this.data.statsMode === 'expense'
          ? '总支出'
          : '总收支',
      centerX,
      centerY - 10
    );
    ctx.setFontSize(20);
    ctx.fillText(`¥${totalAmount.toFixed(0)}`, centerX, centerY + 15);

    ctx.draw();
  },

  // 绘制分类饼图
  drawCategoryChart: function(canvasId, items, centerLabel) {
    if (items.length === 0) return;

    const ctx = wx.createCanvasContext(canvasId);

    // 饼图参数
    const centerX = 125;
    const centerY = 125;
    const radius = 80;
    let startAngle = 0;

    // 颜色数组
    const colors = [
      '#FFB6C1', '#87CEEB', '#FFD700', '#DDA0DD',
      '#98FB98', '#FF6B6B', '#A9A9A9', '#ADD8E6'
    ];

    // 计算总和
    const total = items.reduce((sum, item) => sum + parseFloat(item.percentage), 0);

    // 绘制每个扇形
    items.forEach((item, index) => {
      const percentage = parseFloat(item.percentage);
      const angle = (percentage / total) * 2 * Math.PI;

      // 绘制扇形
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.setFillStyle(colors[index % colors.length]);
      ctx.fill();

      // 更新起始角度
      startAngle += angle;
    });

    // 绘制中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.setFillStyle('white');
    ctx.fill();

    // 绘制总金额
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    ctx.setFontSize(16);
    ctx.setFillStyle('#333');
    ctx.setTextAlign('center');
    ctx.fillText(centerLabel, centerX, centerY - 10);
    ctx.setFontSize(20);
    ctx.fillText(`¥${totalAmount.toFixed(0)}`, centerX, centerY + 15);

    ctx.draw();
  },

  // 上个月
  onPrevMonth: function() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }

    this.setData({
      currentYear: currentYear,
      currentMonth: currentMonth
    }, () => {
      this.generateCalendar(currentYear, currentMonth);
    });
  },

  // 下个月
  onNextMonth: function() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }

    this.setData({
      currentYear: currentYear,
      currentMonth: currentMonth
    }, () => {
      this.generateCalendar(currentYear, currentMonth);
    });
  },

  // 点击日期
  onDayTap: function(e) {
    const dateStr = e.currentTarget.dataset.date;
    if (!dateStr) return;

    const date = new Date(dateStr);
    const records = this.getDayRecords(date);

    this.setData({
      selectedDate: date,
      selectedDateDisplay: this.formatDate(date)
    }, () => {
      this.setSelectedDateRecords(records);
    });
  },

  setSelectedDateRecords: function(records) {
    this.setData({
      selectedDateRecords: records,
      selectedDateExpenseRecords: records.filter(record => record.type === 'expense'),
      selectedDateIncomeRecords: records.filter(record => record.type === 'income')
    });
  },

  // 获取某天的记录
  getDayRecords: function(date) {
    const records = app.getAccountRecords();
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayRecords = records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= targetDate && recordDate < nextDate;
    });

    // 格式化记录
    return dayRecords.map(record => {
      const emotion = app.globalData.emotions.find(e => e.id == record.emotionId);
      const category = app.globalData.categories.find(c => c.id == record.categoryId);

      return {
        ...record,
        amountDisplay: Math.abs(record.amount).toFixed(2),
        emotionName: emotion ? emotion.name : '未知',
        emotionIcon: emotion ? emotion.icon : '',
        categoryName: category ? category.name : '未知',
        categoryIcon: category ? category.icon : ''
      };
    }).filter(record => {
      if (this.data.statsMode === 'expense') {
        return record.type === 'expense';
      }
      if (this.data.statsMode === 'income') {
        return record.type === 'income';
      }
      return true;
    });
  },

  onStartDateChange: function(e) {
    this.updateCustomDate('start', e.detail.value);
  },

  onEndDateChange: function(e) {
    this.updateCustomDate('end', e.detail.value);
  },

  updateCustomDate: function(type, value) {
    if (!value) {
      return;
    }

    const date = new Date(value);
    let nextStartDate = type === 'start' ? date : this.data.startDate;
    let nextEndDate = type === 'end' ? date : this.data.endDate;

    if (type === 'start' && nextEndDate && nextEndDate < nextStartDate) {
      nextEndDate = nextStartDate;
    }

    if (type === 'end' && nextStartDate && nextEndDate < nextStartDate) {
      app.showToast('结束日期不能早于开始日期', 'none');
      return;
    }

    const data = {};
    data.startDate = nextStartDate;
    data.endDate = nextEndDate;
    data.startDateDisplay = this.formatDate(nextStartDate);
    data.endDateDisplay = this.formatDate(nextEndDate);

    this.setData(data, () => {
      if (this.data.dateRange === 'custom') {
        this.loadStatistics();
        if (this.data.selectedDate) {
          this.setSelectedDateRecords(this.getDayRecords(this.data.selectedDate));
        }
      }
    });
  },

  // 格式化日期
  formatDate: function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.getFullYear() + '-' + this.padNumber(d.getMonth() + 1) + '-' + this.padNumber(d.getDate());
  },

  padNumber: function(value) {
    return value < 10 ? '0' + value : String(value);
  }
});