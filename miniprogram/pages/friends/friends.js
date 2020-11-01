// miniprogram/pages/friends/friends.js
const app = getApp()
const db = wx.cloud.database()

Page({
    /**
     * 页面的初始数据
     */
    data: {
        loading: false,
        list: [],
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        this.updateFriendsList()
    },

    updateFriendsList: async function () {
        try {
            const dbRecord = await db.collection('friends').where({
                source: app.globalData.openid,
            }).get()
            if (dbRecord && dbRecord.data && dbRecord.data.length > 0) {
                const record = dbRecord.data[0]
                this.setData({
                    list: record.friends
                })
            }
        } catch (e) {
            wx.showToast({
                icon: 'none',
                title: '获取好友列表失败',
            })
        }
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (res) {
        const {
            nickName: userNickName,
            avatarUrl: userAvatar
        } = app.globalData.userInfo
        return {
            title: `${app.globalData.userInfo.nickName}邀请你成为一起自律的好友`,
            path: `/pages/friendsInvitation/friendsInvitation?userId=${app.globalData.openid}&userNickName=${userNickName}&userAvatar=${userAvatar}`,
            success: (res) => {
                wx.showToast({
                    icon: 'success',
                    title: '邀请成功',
                })
            }, fail: (e) => {
                wx.showToast({
                    icon: 'error',
                    title: '邀请失败',
                })
            }
        }
    },
})