// miniprogram/pages/friendsInvitation/friendsInvitation.js
const app = getApp()
const db = wx.cloud.database()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        logged: false,
        userInfo: {},
        friendInfo: {}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const userId = options.userId
        const userNickName = options.userNickName
        const userAvatar = options.userAvatar
        this.setData({
            friendInfo: {
                avatarUrl: userAvatar,
                nickName: userNickName,
                openid: userId
            }
        })
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
    onShareAppMessage: function () {

    },
    onGetUserInfo: async function (e) {
        let userInfo = this.data.userInfo
        console.log(e.detail.userInfo)
        if (!this.data.logged && e.detail.userInfo) {
            this.setData({
                logged: true,
                userInfo: e.detail.userInfo
            })
            userInfo = e.detail.userInfo
        }

        // 更新好友关系表
        const friendInfo = this.data.friendInfo
        try {
            wx.showLoading({
                title: '添加中',
            })
            // 先更新好友的
            await this.updateFriendsDataInDB(friendInfo.openid, {
                openid: app.globalData.openid,
                nickName: userInfo.nickName,
                avatar: userInfo.avatarUrl
            })
            await this.updateFriendsDataInDB(app.globalData.openid, {
                openid: friendInfo.openid,
                nickName: friendInfo.nickName,
                avatar: friendInfo.avatarUrl
            })
            wx.showToast({
                icon: 'success',
                title: '添加好友成功',
            })
        } catch (e) {
            wx.showToast({
                icon: 'none',
                title: e.message || `添加好友失败`,
            })
        }
        wx.navigateTo({
            url: '../friends/friends',
        })
    },
    updateFriendsDataInDB: async function (source, target) {
        if (source && target) {
            const dbRecord = await db.collection('friends').where({
                source,
            }).get()
            const _ = db.command
            if (!dbRecord || !dbRecord.data || dbRecord.data.length === 0) {
                db.collection('friends').add({
                    data: {
                        source,
                        friends: [target]
                    }
                })
            } else {
                const id = dbRecord.data[0]._id
                const friendExist = dbRecord.data[0].friends.find(item => item.openid === target.openid)
                if (!friendExist || friendExist.length === 0) {
                    db.collection('friends').doc(id).update({
                        data: {
                            friends: _.push(target)
                        }
                    })
                } else {
                    throw Error('已添加过好友')
                }
            }
        }

    },
    goToHome: function () {
        wx.navigateTo({
            url: '../index/index',
        })
    }
})