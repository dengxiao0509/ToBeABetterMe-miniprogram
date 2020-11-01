// components/buttonTabBar/buttonTabBar.js
const TAB_BAR_LIST = [{
    'text': '首页',
    'path': '../../pages/index/index',
    "iconPath": "/images/home.png",
    "selectedIconPath": "/images/home_active.png",
}, {
    'text': '好友列表',
    'path': '../../pages/friends/friends',
    "iconPath": "/images/friends.png",
    "selectedIconPath": "/images/friends_active.png",
}]
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        current: Number,
    },

    /**
     * 组件的初始数据
     */
    data: {
        tabBarList: TAB_BAR_LIST
    },

    /**
     * 组件的方法列表
     */
    methods: {
        tabChange: function (e) {
            const path = e.detail.item.path
            wx.navigateTo({
                url: path,
            })
        },
    }
})
