// miniprogram/pages/food/food.js
import update from 'immutability-helper'
const db = wx.cloud.database()
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        list: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
        },
        listKeys: ['breakfast', 'lunch', 'dinner', 'snacks'],
        keyNameMap: {
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snacks: 'Snacks'
        },
        loading: false,
        showGallery: false,
        galleryImgUrls: [],
        galleryImgsType: '',
        galleryCurrent: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const _this = this
        this.setData({
            loading: true
        })

        // 拉取数据
        db.collection('food').where({
            _openid: app.globalData.openid,
        })
            .get({
                success: (res) => {
                    // res.data 是包含以上定义的两条记录的数组
                    const newList = _this.data.list
                    res.data.forEach(item => {
                        newList[item.type].unshift(item)
                    })
                    _this.setData(update(_this.data, {
                        list: {
                            $set: newList
                        }
                    }))
                },
                fail: console.error,
                complete: () => {
                    this.setData({
                        loading: false
                    })
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

    addFoodImg: function (e) {
        const type = e.currentTarget.dataset.type
        const _this = this

        wx.chooseImage({
            count: 9,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                wx.showLoading({
                    title: '上传中',
                })
                // tempFilePath可以作为img标签的src属性显示图片
                const tempFilePaths = res.tempFilePaths
                let newData
                tempFilePaths.forEach(path => {
                    const cloudPath = `food-image-${Date.now()}${path.match(/\.[^.]+?$/)[0]}`
                    newData = update(_this.data, {
                        list: {
                            [type]: {
                                $push: tempFilePaths.map(url => {
                                    return {
                                        img: url,
                                        _openid: app.globalData.openid
                                    }
                                })
                            }
                        }
                    })
                    wx.cloud.uploadFile({
                        cloudPath, // 上传至云端的路径
                        filePath: path, // 小程序临时文件路径
                        success: res => {
                            // 返回文件 ID
                            // 将ID存到数据库
                            db.collection('food').add({
                                data: {
                                    type,
                                    date: Date.now(),
                                    img: res.fileID,
                                },
                                fail: console.error
                            })
                            wx.showToast({
                                icon: 'success',
                                title: '上传成功',
                            })
                        },
                        fail: () => {
                            console.error('[上传文件] 失败：', e)
                            wx.showToast({
                                icon: 'none',
                                title: '上传失败',
                            })
                        },
                        complete: () => {
                            wx.hideLoading()
                        }
                    })
                })
                _this.setData(newData)
            }
        })
    },
    showGallery: function (e) {
        const type = e.currentTarget.dataset.type
        this.setData({
            galleryImgUrls: this.data.list[type].map(item => item.img),
            showGallery: true,
            galleryImgsType: type
        })
    },
    hideGallery: function (e) {
        this.setData({
            showGallery: false
        })
    },
    changeGalleryImg: function (e) {
        this.setData({
            galleryCurrent: e.detail.current
        })
    },
    deleteGalleryImg: function (e) {
        console.log('deleteGalleryImg', e.detail)
        // 删除图片
        const target = this.data.list[this.data.galleryImgsType].find(item => item.img === e.detail.url)
        if (target) {
            if (target._id) {
                db.collection('food').doc(target._id).remove({
                    success: (res) => {
                        wx.showToast({
                            icon: 'success',
                            title: '删除成功',
                        })
                    }, fail: (e) => {
                        wx.showToast({
                            icon: 'none',
                            title: '删除失败',
                        })
                    }
                })
            }
            const newList = update(this.data.list, {
                [this.data.galleryImgsType]: {
                    $set: this.data.list[this.data.galleryImgsType].filter(item => item.img !== e.detail.url)
                }
            })
            this.setData({
                list: newList
            })
        }
    }
})