// miniprogram/pages/friendDetail/friendDetail.js
const app = getApp()
const date = new Date()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        openid: '',
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}`,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const friendId = options.id
        this.setData({
            openid: friendId,
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
    bindDateChange: function (e) {
        const val = e.detail.value
        this.setData({
            date: val
        })
    }
})