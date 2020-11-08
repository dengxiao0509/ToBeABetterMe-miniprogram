// 云函数入口文件
const cloud = require('wx-server-sdk')
const http = require('http')
cloud.init()

const checkImgFileByCDNUrl = (event) => {
    return new Promise((resolve, reject) => {
        const {
            filePath,
            cloudPath,
            date,
            type,
            openId,
            fileFormat
        } = event

        const db = cloud.database()
        http.get(filePath, response => {
            const data = []
            response.on('data', (chunk) => {
                data.push(chunk)
            }).on('end', async () => {
                const buf = Buffer.concat(data)
                try {
                    const res = await cloud.openapi.security.imgSecCheck({
                        media: {
                            contentType: `image/${fileFormat}`,
                            value: buf
                        }
                    })
                    console.log('check img result', res)
                    if (res.errCode === 0) {
                        try {
                            const uploadRes = await cloud.uploadFile({
                                cloudPath,
                                fileContent: buf,
                            })
                            const dbRes = await db.collection('food').add({
                                data: {
                                    type,
                                    date: new Date(date).getTime(),
                                    img: uploadRes.fileID,
                                    _openid: openId
                                },
                            })
                            resolve({
                                code: 0,
                                msg: '',
                                data: {
                                    fileId: dbRes._id
                                }
                            })
                        } catch (e) {
                            console.error(e)
                            // upload failed
                            reject({
                                code: -1,
                                msg: e.message
                            })
                        }
                    }
                } catch (e) {
                    if (e.errCode === 87014) {
                        // check failed
                        reject({
                            code: e.errCode,
                            msg: '内容含有违法违规内容，请检查后重试'
                        })
                    } else {
                        reject({
                            code: e.errCode,
                            msg: e.errMsg || '上传失败'
                        })
                    }
                }
            })
        }).on('error', (e) => {
            reject({
                code: -3,
                msg: e.message
            })
        })
    })
}

// 云函数入口函数
exports.main = async (event, context) => {
    // const wxContext = cloud.getWXContext()
    try {
        const res = await checkImgFileByCDNUrl(event)
        return res
    } catch (e) {
        console.log('upload error', e)
        return e
    }
}