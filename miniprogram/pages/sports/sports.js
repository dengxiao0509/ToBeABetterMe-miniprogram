// miniprogram/pages/sports/sports.js
import update from 'immutability-helper'
const app = getApp()
const date = new Date()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        step: 0,
        loading: false,
        openid: '',
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        customKeyNameMap: {
            default: '运动打卡'
        },
        customListKeys: ['default'],

        // functions for components
        addFoodImg: null,
        deleteGalleryImg: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function () {
        this.setData({
            openid: app.globalData.openid,
            addFoodImg: this.addFoodImg,
            deleteGalleryImg: this.deleteGalleryImg
        })
        try {
            (async () => {
                await this.updateWeRunData()
            })()
        } catch (e) {
            console.log(e)
        }
    },
    updateWeRunData: async function () {
        const data = await wx.getWeRunData()
        // 获取微信运动敏感数据，同时存到数据库
        if (data?.cloudID) {
            const res = await wx.cloud.callFunction({
                name: 'updateWeRunData',
                data: {
                    weRunData: wx.cloud.CloudID(data.cloudID), // 这个 CloudID 值到云函数端会被替换
                    date: this.data.date,
                }
            })
            console.log('updateWeRunData', res)

            if (res.result.step) {
                this.setData({
                    step: res.result.step,
                })
            } else {
                this.setData({
                    step: 0,
                })
            }
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
    onShareAppMessage: function () {

    },

    addSportImg: async function () {
        const _this = this
        const date = this.data.date

        const res = await wx.chooseImage({
            count: 9,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
        })

        wx.showLoading({
            title: '上传中',
        })

        // tempFilePath可以作为img标签的src属性显示图片
        const tempFilePaths = res.tempFilePaths
        console.log('choose img', res)
        let newList = _this.data.list

        tempFilePaths.forEach(async (path) => {
            const cloudPath = `sport-image-${new Date(date).getTime()}-${Date.now()}${path.match(/\.[^.]+?$/)[0]}`
            // 检查图片是否合法
            try {
                const imgInfo = await wx.getImageInfo({
                    src: path
                })
                const res = await wx.cloud.callFunction({
                    name: 'imgSecurity',
                    data: {
                        cloudPath,
                        filePath: wx.cloud.CDN({
                            type: 'filePath',
                            filePath: path,
                        }),
                        date,
                        openId: _this.properties.openid,
                        fileFormat: imgInfo.type,
                        collection: 'sports'
                    }
                })
                console.log('checkres', res)
                if (res.result && res.result.code === 0) {
                    wx.showToast({
                        icon: 'success',
                        title: '上传成功',
                    })
                    newList = update(newList, {
                        $push: [{
                            img: path,
                            _openid: _this.properties.openid,
                            _id: res.result?.data?.fileId
                        }]
                    })

                } else {
                    wx.showToast({
                        icon: 'none',
                        title: res?.result?.msg || '上传失败',
                    })
                }
            } catch (e) {
                console.log('[上传文件] 失败：', e)
                wx.showToast({
                    icon: 'none',
                    title: '上传失败',
                })
            }

            _this.setData({
                list: newList
            })
        })
    },
    bindDateChange: function (e) {
        const val = e.detail.value
        this.setData({
            date: val
        })
        try {
            // 更新运动步数
            (async () => {
                await this.updateWeRunData()
            })()
        } catch (e) { }

    }
})