// 记账页逻辑
const app = getApp();

Page({
  data: {
    // 表单数据
    amount: '',
    type: 'expense', // 'expense' 或 'income'
    recordDate: '',
    recordDateDisplay: '',
    selectedCategoryId: null,
    selectedEmotionId: null,
    note: '',

    // 选项数据
    categories: [],
    emotions: [],

    // 表单验证状态
    isFormValid: false,

    // 编辑模式
    isEditMode: false,
    editRecordId: null,

    // 自动记忆的上次类型
    lastType: 'expense',

    // 分类/情绪管理状态
    categoryManageMode: 'idle',
    emotionManageMode: 'idle'
  },

  onLoad: function(options) {
    console.log('记账页加载', options);

    const today = new Date();
    this.setData({
      recordDate: this.formatPickerDate(today),
      recordDateDisplay: this.formatPickerDate(today)
    });

    // 先加载上次的类型，再刷新选项
    this.loadLastType(() => {
      this.loadOptions(() => {
        if (options.editId) {
          this.loadRecordForEdit(options.editId);
        }
      });
    });
  },

  onShow: function() {
    this.loadOptions();
  },

  // 加载选项数据
  loadOptions: function(callback) {
    const categories = this.getCategoriesByType(this.data.type).map((item) => (
      {
        ...item,
        iconType: this.getIconType(item.icon)
      }
    ));
    const emotions = this.getEmotionsByType(this.data.type).map((item) => (
      {
        ...item,
        iconType: this.getIconType(item.icon)
      }
    ));

    console.log('加载分类数据:', categories.length, '个分类');
    console.log('加载情绪数据:', emotions.length, '个情绪');

    this.setData({
      categories: categories,
      emotions: emotions
    }, () => {
      this.updateFormValidation();
      if (callback && typeof callback === 'function') {
        callback();
      }
    });
  },

  // 加载上次使用的类型
  loadLastType: function(callback) {
    try {
      const lastType = wx.getStorageSync('lastRecordType') || 'expense';
      this.setData({
        type: lastType,
        lastType: lastType
      }, () => {
        if (callback && typeof callback === 'function') {
          callback();
        }
      });
    } catch (e) {
      console.error('加载上次类型失败:', e);
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  },

  // 加载要编辑的记录
  loadRecordForEdit: function(recordId) {
    const records = app.getAccountRecords();
    const normalizedId = String(recordId);
    const record = records.find(r => String(r.id) === normalizedId);

    if (!record) {
      app.showToast('未找到要编辑的记录', 'none');
      return;
    }

    this.setData({
      isEditMode: true,
      editRecordId: record.id,
      amount: Math.abs(record.amount).toString(),
      type: record.type,
      recordDate: this.formatPickerDate(new Date(record.createdAt)),
      recordDateDisplay: this.formatPickerDate(new Date(record.createdAt)),
      selectedCategoryId: record.categoryId,
      selectedEmotionId: record.emotionId || null,
      note: record.note || ''
    }, () => {
      this.loadOptions();
      this.updateFormValidation();
    });
  },

  // 金额输入处理
  onAmountInput: function(e) {
    const value = e.detail.value;

    // 验证金额格式
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      this.setData({
        amount: value
      }, () => {
        this.updateFormValidation();
      });
    }
  },

  // 类型切换
  onTypeChange: function(e) {
    const type = e.currentTarget.dataset.type;
    if (this.data.type === type) {
      return;
    }

    this.setData({
      type: type,
      selectedCategoryId: null,
      selectedEmotionId: null,
      categoryManageMode: 'idle',
      emotionManageMode: 'idle'
    }, () => {
      this.loadOptions(() => {
        // 保存本次选择的类型
        this.saveLastType(type);
      });
    });
  },

  // 保存上次使用的类型
  saveLastType: function(type) {
    try {
      wx.setStorageSync('lastRecordType', type);
      this.setData({ lastType: type });
    } catch (e) {
      console.error('保存上次类型失败:', e);
    }
  },

  // 分类选择
  onCategorySelect: function(e) {
    const categoryId = Number(e.currentTarget.dataset.categoryId);
    if (this.data.categoryManageMode === 'delete') {
      return;
    }

    const categoryExists = this.data.categories.find(c => c.id === categoryId);

    if (!categoryExists) {
      app.showToast('分类加载异常，请重试', 'none');
      return;
    }

    this.setData({
      selectedCategoryId: categoryId
    }, () => {
      this.updateFormValidation();
    });
  },

  // 情绪选择
  onEmotionSelect: function(e) {
    const emotionId = Number(e.currentTarget.dataset.emotionId);
    if (this.data.emotionManageMode === 'delete') {
      return;
    }

    const emotionExists = this.data.emotions.find(e => e.id === emotionId);

    if (!emotionExists) {
      app.showToast('情绪标签加载异常，请稍后再试', 'none');
      return;
    }

    this.setData({
      selectedEmotionId: emotionId
    }, () => {
      this.updateFormValidation();
    });
  },

  getCategoriesByType: function(type) {
    return type === 'income' ? app.globalData.incomeCategories : app.globalData.expenseCategories;
  },

  getEmotionsByType: function(type) {
    return type === 'income' ? app.globalData.incomeEmotions : app.globalData.expenseEmotions;
  },

  getIconType: function(icon) {
    if (typeof icon === 'string' && icon.indexOf('/images/') === 0) {
      return 'image';
    }
    return 'text';
  },

  onCategoryAddTrigger: function() {
    wx.navigateTo({
      url: `/pages/category-add/category-add?type=${this.data.type}`
    });
  },

  onCategoryDeleteTrigger: function() {
    const nextMode = this.data.categoryManageMode === 'delete' ? 'idle' : 'delete';
    this.setData({
      categoryManageMode: nextMode,
      emotionManageMode: 'idle'
    });
  },

  onEmotionAddTrigger: function() {
    wx.navigateTo({
      url: `/pages/emotion-add/emotion-add?type=${this.data.type}`
    });
  },

  onEmotionDeleteTrigger: function() {
    const nextMode = this.data.emotionManageMode === 'delete' ? 'idle' : 'delete';
    this.setData({
      emotionManageMode: nextMode,
      categoryManageMode: 'idle'
    });
  },

  onCustomCategoryDelete: function(e) {
    const categoryId = Number(e.currentTarget.dataset.categoryId);
    const categoryName = e.currentTarget.dataset.categoryName || '分类';
    const categoryType = e.currentTarget.dataset.categoryType || this.data.type;
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }

    const category = this.data.categories.find(c => c.id === categoryId);
    if (!category || !category.custom) {
      app.showToast('默认分类无法删除', 'none');
      return;
    }

    wx.showModal({
      title: '删除分类',
      content: `确认删除自定义分类「${categoryName}」吗？`,
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          const success = app.removeCustomCategory(categoryType, categoryId);
          if (success) {
            app.showToast('分类已删除', 'success');
            this.setData({ selectedCategoryId: null });
            this.loadOptions();
          } else {
            app.showToast('删除失败', 'error');
          }
        }
      }
    });
  },

  onCustomEmotionDelete: function(e) {
    const emotionId = Number(e.currentTarget.dataset.emotionId);
    const emotionName = e.currentTarget.dataset.emotionName || '情绪';
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }

    const emotion = this.data.emotions.find(e => e.id === emotionId);
    if (!emotion || !emotion.custom) {
      app.showToast('默认情绪不能删除', 'none');
      return;
    }

    wx.showModal({
      title: '删除情绪',
      content: `确认删除自定义情绪「${emotionName}」吗？`,
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          const success = app.removeCustomEmotion(emotionId);
          if (success) {
            app.showToast('情绪已删除', 'success');
            if (this.data.selectedEmotionId === emotionId) {
              this.setData({ selectedEmotionId: null });
            }
            this.loadOptions();
          } else {
            app.showToast('删除失败', 'error');
          }
        }
      }
    });
  },

  // 备注输入
  onNoteInput: function(e) {
    const value = e.detail.value;
    this.setData({
      note: value
    });
  },

  onRecordDateChange: function(e) {
    const value = e.detail.value;
    if (!value) {
      return;
    }

    this.setData({
      recordDate: value,
      recordDateDisplay: value
    });
  },

  // 更新表单验证状态
  updateFormValidation: function() {
    const { amount, type, selectedCategoryId, selectedEmotionId, isEditMode } = this.data;
    let isValid = false;

    // 基本验证
    if (amount && parseFloat(amount) > 0 && selectedCategoryId) {
      // 新记录要求选择对应情绪，兼容编辑历史旧记录时缺少情绪的情况
      isValid = !!selectedEmotionId || isEditMode;
    }

    this.setData({
      isFormValid: isValid
    });
  },

  // 保存记录
  onSave: function() {
    if (!this.data.isFormValid) {
      app.showToast('请填写完整信息', 'none');
      return;
    }

    const { amount, type, recordDate, selectedCategoryId, selectedEmotionId, note, isEditMode, editRecordId } = this.data;

    if (!recordDate) {
      app.showToast('请选择记账日期', 'none');
      return;
    }

    // 准备记录数据
    const recordData = {
      amount: parseFloat(amount),
      type: type,
      createdAt: this.buildRecordTimestamp(recordDate),
      categoryId: selectedCategoryId,
      emotionId: selectedEmotionId || null,
      note: note.trim() || null
    };

    if (isEditMode) {
      // 更新现有记录
      app.updateAccountRecord(editRecordId, recordData, (success, updatedRecord) => {
        if (success) {
          this.showSuccessFeedback('更新成功');
          this.navigateBackWithDelay();
        } else {
          app.showToast('更新失败', 'error');
        }
      });
    } else {
      // 添加新记录
      app.addAccountRecord(recordData, (success, newRecord) => {
        if (success) {
          this.showSuccessFeedback('记账成功');
          this.navigateBackWithDelay();
        } else {
          app.showToast('保存失败', 'error');
        }
      });
    }
  },

  // 显示成功反馈
  showSuccessFeedback: function(message) {
    // 根据情绪类型显示不同的成功消息
    const { selectedEmotionId, type } = this.data;
    let feedbackMessage = message;

    if (selectedEmotionId) {
      const emotion = app.globalData.emotions.find(e => e.id === selectedEmotionId);
      if (emotion) {
        const emotionMessages = type === 'income'
          ? {
              101: '记账成功～这笔收入让人很安心',
              102: '记账成功～今天收获了一份小惊喜',
              103: '记账成功～你的努力正在兑现回报',
              104: '记账成功～积累开始开花结果了',
              105: '记账成功～这份心意很温暖',
              106: '记账成功～压力减轻了一点点'
            }
          : {
              1: '记账成功～今天也是开心消费呀',
              2: '记账成功～心疼钱包，但这是必要的',
              3: '记账成功～下次购物前再想想哦',
              4: '记账成功～生活必需品，没办法呢',
              5: '记账成功～治愈自己，这钱花得值',
              6: '记账成功～投资自己是最棒的！'
            };
        feedbackMessage = emotionMessages[selectedEmotionId] || '记账成功';
      }
    } else if (type === 'income') {
      feedbackMessage = '收入记录成功～';
    }

    // 显示成功提示
    app.showToast(feedbackMessage, 'success');

    // 播放轻微动画效果
    this.setData({ isSaving: true });
    setTimeout(() => {
      this.setData({ isSaving: false });
    }, 1000);
  },

  // 延迟返回上一页
  navigateBackWithDelay: function() {
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  formatPickerDate: function(date) {
    const year = date.getFullYear();
    const month = this.padNumber(date.getMonth() + 1);
    const day = this.padNumber(date.getDate());
    return `${year}-${month}-${day}`;
  },

  padNumber: function(value) {
    return value < 10 ? '0' + value : String(value);
  },

  buildRecordTimestamp: function(recordDate) {
    const selectedDate = new Date(`${recordDate}T12:00:00`);
    const now = new Date();
    return new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    ).toISOString();
  },

  // 页面卸载时保存类型
  onUnload: function() {
    // 保存本次使用的类型
    this.saveLastType(this.data.type);
  },

  stopPropagation: function() {}
});