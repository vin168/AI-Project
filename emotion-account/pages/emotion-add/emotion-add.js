const app = getApp();

Page({
  data: {
    emotionType: 'expense',
    name: '',
    desc: '',
    color: '#F7A6B2',
    colorOptions: ['#F7A6B2', '#FFD700', '#ADD8E6', '#98FB98', '#FF9AA2', '#C7CEEA', '#B5EAD7', '#FFDAC1'],
    iconOptions: [],
    selectedIcon: '😊'
  },

  onLoad: function(options) {
    this.setData({
      emotionType: options.type === 'income' ? 'income' : 'expense',
      iconOptions: [
        { id: 'happy', icon: '😄' },
        { id: 'heart', icon: '🥰' },
        { id: 'calm', icon: '😊' },
        { id: 'wink', icon: '😉' },
        { id: 'neutral', icon: '😐' },
        { id: 'pain', icon: '😣' },
        { id: 'regret', icon: '😖' },
        { id: 'sweat', icon: '😅' },
        { id: 'angry', icon: '😡' },
        { id: 'sleepy', icon: '😴' },
        { id: 'surprised', icon: '😱' },
        { id: 'star', icon: '🤩' }
      ],
      selectedIcon: '😄'
    });
  },

  onNameInput: function(e) {
    this.setData({ name: e.detail.value });
  },

  onDescInput: function(e) {
    this.setData({ desc: e.detail.value });
  },

  onColorInput: function(e) {
    this.setData({ color: e.detail.value });
  },

  onSelectColor: function(e) {
    const index = Number(e.currentTarget.dataset.index);
    const color = this.data.colorOptions[index];
    if (!color) {
      return;
    }
    this.setData({ color: color });
  },

  onSelectIcon: function(e) {
    const index = Number(e.currentTarget.dataset.index);
    const option = this.data.iconOptions[index];
    if (!option) {
      return;
    }
    this.setData({ selectedIcon: option.icon });
  },

  onCancel: function() {
    wx.navigateBack();
  },

  onSave: function() {
    const name = this.data.name.trim();
    if (!name) {
      app.showToast('请填写情绪名称', 'none');
      return;
    }

    const result = app.addCustomEmotion(this.data.emotionType, {
      name: name,
      icon: this.data.selectedIcon,
      color: this.data.color,
      desc: this.data.desc
    });

    if (result.success) {
      app.showToast('情绪已添加', 'success');
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        if (typeof prevPage.setData === 'function') {
          prevPage.setData({ selectedEmotionId: result.emotion.id });
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
