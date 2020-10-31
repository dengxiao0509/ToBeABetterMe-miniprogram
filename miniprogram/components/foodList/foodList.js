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
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snacks: 'Snacks'
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
                                            _openid: _this.properties.openid
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
                            const newList = update(this.data.list, {
                                [this.data.galleryImgsType]: {
                                    $set: this.data.list[this.data.galleryImgsType].filter(item => item.img !== e.detail.url)
                                }
                            })
                            console.log('newList', newList)
                            this.setData({
                                galleryCurrent: 0,
                                list: newList,
                            })
                        }, fail: (e) => {
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
    },
    ready: async function () {
        const _this = this
        this.setData({
            loading: true
        })
        const openId = this.properties.openid
        console.log('this.properties', this.properties)
        if (openId) {
            try {
                // 拉取数据
                const res = await db.collection('food').where({
                    _openid: openId,
                }).get()
                const newList = _this.data.list
                res.data.forEach(item => {
                    newList[item.type].unshift(item)
                })
                _this.setData(update(_this.data, {
                    list: {
                        $set: newList
                    }
                }))
            } catch (e) {
                console.error(e)
            }
            this.setData({
                loading: false
            })

        }
    }
})
