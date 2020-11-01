// components/foodList/foodList.js
import update from 'immutability-helper'
const db = wx.cloud.database()

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        openid: String,
        editable: Boolean,
        date: String,
    },

    /**
     * 组件的初始数据
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
            breakfast: '早餐',
            lunch: '午餐',
            dinner: '晚餐',
            snacks: '小食'
        },
        loading: false,
        showGallery: false,
        galleryImgUrls: [],
        galleryImgsType: '',
        galleryCurrent: 0,
    },

    /**
     * 组件的方法列表
     */
    methods: {
        addFoodImg: function (e) {
            const type = e.currentTarget.dataset.type
            const _this = this
            const date = this.properties.date
            console.log('addFoodImg', date)
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
                    let newList
                    console.log('tempFilePaths', tempFilePaths)
                    tempFilePaths.forEach(path => {
                        const cloudPath = `food-image-${new Date(date).getTime()}${path.match(/\.[^.]+?$/)[0]}`
                        newList = update(_this.data.list, {
                            [type]: {
                                $push: [{
                                    img: path,
                                    _openid: _this.properties.openid
                                }]
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
                                        date: new Date(date).getTime(),
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
                    _this.setData({
                        list: newList
                    })
                }
            })
        },
        deleteGalleryImg: function (e) {
            console.log('deleteGalleryImg', e.detail)
            // 删除图片
            const target = this.data.list[this.data.galleryImgsType].find(item => item.img === e.detail.url)
            if (target) {
                console.log(target)
                if (target._id) {
                    db.collection('food').doc(target._id).remove({
                        success: (res) => {
                            wx.showToast({
                                icon: 'success',
                                title: '删除成功',
                            })
                            const newList = update(this.data.list, {
                                [this.data.galleryImgsType]: {
                                    $set: this.data.list[this.data.galleryImgsType].filter(item => item.img !== e.detail.url)
                                }
                            })
                            this.setData({
                                galleryCurrent: 0,
                                list: newList,
                            })
                        }, fail: (e) => {
                            console.error(e)
                            wx.showToast({
                                icon: 'none',
                                title: '删除失败',
                            })
                        }
                    })
                }

            }
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
        showGallery: function (e) {
            const type = e.currentTarget.dataset.type
            this.setData({
                galleryImgUrls: this.data.list[type].map(item => item.img),
                showGallery: true,
                galleryImgsType: type
            })
        },
        updateList: async function (date) {
            const _this = this
            this.setData({
                loading: true
            })
            const openId = this.properties.openid
            if (openId) {
                try {
                    const startDate = new Date(new Date(date).setHours(0, 0, 0, 0)).getTime()
                    const endDate = new Date(new Date(date).setHours(23, 59, 59, 999)).getTime()
                    const _ = db.command
                    // 拉取数据
                    const res = await db.collection('food').where({
                        _openid: openId,
                        date: _.gte(startDate).and(_.lt(endDate))
                    }).get()
                    console.log(res)
                    let newList = {
                        breakfast: [],
                        lunch: [],
                        dinner: [],
                        snacks: []
                    }
                    res.data.forEach(item => {
                        newList = update(newList, {
                            [item.type]: {
                                $unshift: [item]
                            }
                        })
                    })
                    console.log(newList)
                    _this.setData({
                        list: newList
                    })
                } catch (e) {
                    console.error(e)
                }
            }
            this.setData({
                loading: false
            })
        },
    },
    ready: function () {
        console.log('ready')
        this.updateList(this.properties.date)
    },
    observers: {
        'date': function (date) {
            this.updateList(date)
        },
    }
})
