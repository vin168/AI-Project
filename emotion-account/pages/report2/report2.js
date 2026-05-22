const app = getApp();

Page({
  data: {
    year: null,
    month: null,
    periodType: 'month',
    periodLabel: '',
    reportTitle: '',
    reportSubtitle: '',
    report: null,
    topEmotion: null,
    highlightedRecords: [],
    mostWorthRecord: null,
    healStats: null,
    message: '',
    reportSummary: null,
    generatedAtLabel: '',
    impulsiveLabel: '',
    impulsiveAmountDisplay: '',
    impulseSectionTitle: '',
    summarySectionTitle: '',
    showImpulseSection: false,
    reportTone: '',
    isLoading: true
  },

  onLoad: function(options) {
    var now = new Date();
    var year = parseInt(options.year, 10) || now.getFullYear();
    var mode = options.mode === 'year' ? 'year' : 'month';
    var month = mode === 'year' ? null : parseInt(options.month, 10) || now.getMonth() + 1;
    var periodLabel = mode === 'year' ? year + '年' : year + '年' + month + '月';

    this.setData({
      year: year,
      month: month,
      periodType: mode,
      periodLabel: periodLabel,
      reportTitle: mode === 'year' ? year + '年度小报' : year + '年' + month + '月的小报',
      reportSubtitle: mode === 'year' ? '把这一年的情绪和消费都轻轻整理好' : '把这个月的情绪和消费都轻轻整理好',
      summarySectionTitle: mode === 'year' ? '年度概览' : '本月概览',
      impulseSectionTitle: mode === 'year' ? '最跳出来的一月' : '最跳出来的一天'
    });

    this.loadReport();
  },

  loadReport: function() {
    var year = this.data.year;
    var month = this.data.month;
    var periodType = this.data.periodType;
    var report = periodType === 'year'
      ? app.generateAnnualReport(year)
      : app.generateMonthlyReport(year, month);

    if (!report) {
      this.setData({
        report: null,
        message: periodType === 'year'
          ? year + '年暂无记账记录，无法生成报告。'
          : year + '年' + month + '月暂无记账记录，无法生成报告。',
        isLoading: false
      });
      return;
    }

    var highlightedSource = [];
    if (periodType === 'year') {
      if (report.mostImpulsiveMonth && report.mostImpulsiveMonth.records) {
        highlightedSource = report.mostImpulsiveMonth.records;
      } else if (report.topExpenseMonth && report.topExpenseMonth.records) {
        highlightedSource = report.topExpenseMonth.records;
      }
    } else if (report.mostImpulsiveDay && report.mostImpulsiveDay.records) {
      highlightedSource = report.mostImpulsiveDay.records;
    }

    var highlightedRecords = [];
    for (var i = 0; i < highlightedSource.length && i < 3; i++) {
      highlightedRecords.push(this.formatRecord(highlightedSource[i]));
    }

    var mostWorthRecord = report.mostWorthRecord ? this.formatRecord(report.mostWorthRecord) : null;

    var healStats = null;
    if (report.healStats) {
      healStats = {
        count: report.healStats.count,
        totalAmount: this.formatCurrency(report.healStats.totalAmount),
        averageAmount: this.formatCurrency(report.healStats.averageAmount)
      };
    }

    var impulsiveLabel = '';
    var impulsiveAmount = 0;
    if (periodType === 'year') {
      if (report.mostImpulsiveMonth && report.mostImpulsiveMonth.month) {
        impulsiveLabel = report.mostImpulsiveMonth.month + '月';
        impulsiveAmount = report.mostImpulsiveMonth.amount || 0;
      } else if (report.topExpenseMonth && report.topExpenseMonth.month) {
        impulsiveLabel = report.topExpenseMonth.month + '月';
        impulsiveAmount = report.topExpenseMonth.expense || 0;
      }
    } else if (report.mostImpulsiveDay && report.mostImpulsiveDay.date) {
      impulsiveLabel = this.formatDate(report.mostImpulsiveDay.date);
      impulsiveAmount = report.mostImpulsiveDay.amount || 0;
    }

    var reportSummary = {
      totalExpense: this.formatCurrency(report.totalExpense),
      totalIncome: this.formatCurrency(report.totalIncome),
      netExpense: this.formatCurrency(report.netExpense)
    };

    var topEmotion = report.emotionRanking && report.emotionRanking.length ? report.emotionRanking[0] : null;
    if (topEmotion) {
      topEmotion.amountDisplay = this.formatCurrency(topEmotion.amount);
    }

    var reportTone = topEmotion
      ? (periodType === 'year'
          ? '这一年最常出现的是「' + topEmotion.name + '」，像一整年的心情底色。'
          : '这个月最常出现的是「' + topEmotion.name + '」，像一片悄悄冒出来的心情云朵。')
      : (periodType === 'year'
          ? '这一年暂时还没有太多记录，但也已经是很好的开始。'
          : '这个月暂时还没有太多记录，但也已经是很好的开始。');

    this.setData({
      report: report,
      message: '',
      isLoading: false,
      reportTitle: periodType === 'year' ? report.year + '年度小报' : report.year + '年' + report.month + '月的小报',
      reportSubtitle: periodType === 'year' ? '把这一年的情绪和消费都轻轻整理好' : '把这个月的情绪和消费都轻轻整理好',
      summarySectionTitle: periodType === 'year' ? '年度概览' : '本月概览',
      impulseSectionTitle: periodType === 'year' ? '最跳出来的一月' : '最跳出来的一天',
      topEmotion: topEmotion,
      highlightedRecords: highlightedRecords,
      mostWorthRecord: mostWorthRecord,
      healStats: healStats,
      reportSummary: reportSummary,
      generatedAtLabel: this.formatDateTime(report.generatedAt),
      impulsiveLabel: impulsiveLabel,
      impulsiveAmountDisplay: this.formatCurrency(impulsiveAmount),
      showImpulseSection: periodType === 'year'
        ? Boolean((report.mostImpulsiveMonth && report.mostImpulsiveMonth.month) || (report.topExpenseMonth && report.topExpenseMonth.month))
        : Boolean(report.mostImpulsiveDay && report.mostImpulsiveDay.date),
      reportTone: reportTone
    });
  },

  formatRecord: function(record) {
    var emotion = null;
    if (record.emotionId && app.globalData.emotions) {
      for (var i = 0; i < app.globalData.emotions.length; i++) {
        if (app.globalData.emotions[i].id === record.emotionId) {
          emotion = app.globalData.emotions[i];
          break;
        }
      }
    }

    var category = app.getCategoryById(record.categoryId);

    return {
      id: record.id,
      type: record.type,
      amount: record.amount,
      note: record.note,
      amountDisplay: Math.abs(record.amount).toFixed(2),
      emotionIcon: emotion ? emotion.icon : '',
      emotionName: emotion ? emotion.name : '',
      categoryName: category ? category.name : '',
      categoryIcon: category ? category.icon : '',
      createdAtDisplay: this.formatDate(record.createdAt)
    };
  },

  formatCurrency: function(value) {
    return Number(value || 0).toFixed(2);
  },

  formatDate: function(dateStr) {
    if (!dateStr) {
      return '';
    }
    var date = new Date(dateStr);
    return date.getFullYear() + '-' + this.padNumber(date.getMonth() + 1) + '-' + this.padNumber(date.getDate());
  },

  formatDateTime: function(dateStr) {
    if (!dateStr) {
      return '';
    }
    var date = new Date(dateStr);
    return date.getFullYear() + '-' + this.padNumber(date.getMonth() + 1) + '-' + this.padNumber(date.getDate()) + ' ' + this.padNumber(date.getHours()) + ':' + this.padNumber(date.getMinutes());
  },

  padNumber: function(value) {
    return value < 10 ? '0' + value : String(value);
  },

  onShareAppMessage: function() {
    return {
      title: this.data.periodLabel + ' 情绪报告',
      path: this.data.periodType === 'year'
        ? '/pages/report2/report2?year=' + this.data.year + '&mode=year'
        : '/pages/report2/report2?year=' + this.data.year + '&month=' + this.data.month
    };
  }
});