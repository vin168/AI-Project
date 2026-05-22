const app = getApp();

Page({
  data: {
    type: 'expense',
    name: '',
    iconOptions: [],
    selectedIcon: '',
    customIcon: ''
  },

  onLoad: function(options) {
    const type = options.type === 'income' ? 'income' : 'expense';
    const iconOptions = type === 'income'
      ? [
          { id: 'salary', icon: '💼' },
          { id: 'gift', icon: '🎁' },
          { id: 'chart', icon: '📈' },
          { id: 'tools', icon: '🔧' },
          { id: 'money', icon: '💰' },
          { id: 'card', icon: '💳' },
          { id: 'star', icon: '⭐' },
          { id: 'smile', icon: '😊' }
        ]
      : [
          { id: 'drink', icon: '☕' },
          { id: 'bus', icon: '🚌' },
          { id: 'food', icon: '🍜' },
          { id: 'shopping', icon: '🛍️' },
          { id: 'car', icon: '🚗' },
          { id: 'game', icon: '🎮' },
          { id: 'home', icon: '🏠' },
          { id: 'study', icon: '📚' },
          { id: 'people', icon: '👥' },
          { id: 'medical', icon: '🏥' },
          { id: 'heart', icon: '❤️' },
          { id: 'sparkles', icon: '✨' }
        ];

    this.setData({
      type: type,
      iconOptions: iconOptions
    });
  },

  onNameInput: function(e) {
    this.setData({ name: e.detail.value });
  },

  onSelectIcon: function(e) {
    const index = Number(e.currentTarget.dataset.index);
    const option = this.data.iconOptions[index];
    if (!option) {
      return;
    }
    this.setData({
      selectedIcon: option.icon,
      customIcon: ''
    });
  },

  onCustomIconInput: function(e) {
    const value = e.detail.value;
    this.setData({
      customIcon: value,
      selectedIcon: value ? '' : this.data.selectedIcon
    });
  },

  onCancel: function() {
    wx.navigateBack();
  },

  onSave: function() {
    const name = this.data.name.trim();
    if (!name) {
      app.showToast('请填写分类名称', 'none');
      return;
    }

    const icon = this.data.selectedIcon || this.data.customIcon.trim();
    const payload = icon ? { name: name, icon: icon } : { name: name };
    const result = app.addCustomCategory(this.data.type, payload);

    if (result.success) {
      app.showToast('分类已添加', 'success');
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        if (typeof prevPage.setData === 'function') {
          prevPage.setData({ selectedCategoryId: result.category.id });
        }
        if (typeof prevPage.loadOptions === 'function') {
          prevPage.loadOptions();
        }
        if (typeof prevPage.updateFormValidation === 'function') {
          prevPage.updateFormValidation();
        }
      }
      wx.navigateBack();
    } else {
      app.showToast(result.error || '添加失败', 'error');
    }
  }
});
