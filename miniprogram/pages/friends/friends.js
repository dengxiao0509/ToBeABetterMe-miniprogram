// miniprogram/pages/friends/friends.js
const app = getApp()
const db = wx.cloud.database()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        loading: false,
        list: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const userId = options.userId
        const userNickName = options.nickName
        if (userId) {
            // 打开好友邀请链接
            wx.showModal({
                title: `${userNickName}邀请您成为好友，是否同意邀请？`,
                success: async (res) => {
                    if (res.confirm) {
                        // 更新好友关系表
                        try {
                            // 先更新好友的
                            await this.updateFriendsDataInDB(userId, {
                                openid: app.globalData.openid,
                                nickName: '我寄几'
                            })
                            await this.updateFriendsDataInDB(app.globalData.openid, {
                                openid: userId,
                                nickName: userNickName
                            })
                            wx.showToast({
                                icon: 'success',
                                title: '添加好友成功',
                            })

                            // 更新好友列表
                            const newList = this.data.list.push({
                                openid: userId,
                                nickName: userNickName
                            })
                            this.setData({
                                list: newList
                            })
                        } catch (e) {
                            wx.showToast({
                                icon: 'none',
                                title: e.message || `添加好友失败`,
                            })
                        }
                    }
                }
            })
        }
        this.updateFriendsList()
    },

    updateFriendsDataInDB: async function (source, target) {
        const dbRecord = await db.collection('friends').where({
            source,
        }).get()
        const _ = db.command
        console.log('dbRecord', dbRecord)
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
        return {
            title: '邀请你成为一起自律的好友',
            path: `/pages/friends/friends?userId=${app.globalData.openid}`,
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
    }
})