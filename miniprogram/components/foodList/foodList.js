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
        collection: {
            type: String,
            value: 'food'
        },
        customListKeys: Array,
        customKeyNameMap: Object
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
        // imgsStyle: {},
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
        addFoodImg: async function (e) {
            const type = e.currentTarget.dataset.type
            const _this = this
            const {
                date,
                collection
            } = this.properties

            wx.chooseImage({
                count: 9,
                sizeType: ['original', 'compressed'],
                sourceType: ['album', 'camera'],
                success: async (res) => {
                    wx.showLoading({
                        title: '上传中',
                    })
                    // tempFilePath可以作为img标签的src属性显示图片
                    const tempFilePaths = res.tempFilePaths
                    let newList = _this.data.list
                    tempFilePaths.forEach(async (path) => {
                        const cloudPath = `${collection}-image-${new Date(date).getTime()}-${Date.now()}${path.match(/\.[^.]+?$/)[0]}`
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
                                    type,
                                    openId: _this.properties.openid,
                                    fileFormat: imgInfo.type,
                                    collection,
                                }
                            })
                            console.log('checkres', res)
                            if (res.result && res.result.code === 0) {
                                wx.showToast({
                                    icon: 'success',
                                    title: '上传成功',
                                })
                                newList = update(newList, {
                                    [type]: {
                                        $push: [{
                                            img: path,
                                            _openid: _this.properties.openid,
                                            _id: res.result?.data?.fileId
                                        }]
                                    }
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
                }
            })
        },
        deleteGalleryImg: function (e) {
            // 删除图片
            const target = this.data.list[this.data.galleryImgsType].find(item => item.img === e.detail.url)
            if (target) {
                if (target._id) {
                    db.collection(this.properties.collection).doc(target._id).remove({
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
                galleryImgsType: type,
                galleryCurrent: e.currentTarget.dataset.current
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
                    const _ = db.command

                    // 拉取数据
                    const res = await db.collection(_this.properties.collection).where({
                        _openid: openId,
                        date,
                    }).get()
                    console.log('updatelist', res)

                    let newList = this.properties.collection === 'sports' ? {
                        default: []
                    } : {
                            breakfast: [],
                            lunch: [],
                            dinner: [],
                            snacks: []
                        }
                    res.data.forEach(item => {
                        newList = update(newList, {
                            [item.type || 'default']: {
                                $unshift: [item]
                            }
                        })
                    })
                    _this.setData({
                        list: newList
                    })
                } catch (e) {
                    wx.showToast({
                        title: '拉取列表失败',
                    })
                    console.error(e)
                }
            }
            this.setData({
                loading: false
            })
        },
        handleImgload: function (e) {
            // let imgStyle
            // if (e.detail.width <= 250) {
            //     imgStyle = {
            //         width: e.detail.width,
            //         height: e.detail.height,
            //     }
            // } else {
            //     imgStyle = {
            //         width: 250,
            //         height: Math.ceil(250 * e.detail.height / e.detail.width),
            //     }
            // }
            // console.log(imgStyle)
            // this.setData({
            //     imgsStyle: update(this.data.imgsStyle, {
            //         [e.target.id]: {
            //             $set: imgStyle
            //         }
            //     })
            // })
        },
    },
    ready: function () {
        this.updateList(this.properties.date)
    },
    observers: {
        'date': function (date) {
            this.updateList(date)
        },
        'customListKeys': function (val) {
            this.setData({
                listKeys: val
            })
        },
        'customKeyNameMap': function (val) {
            this.setData({
                keyNameMap: val
            })
        }
    },
})
