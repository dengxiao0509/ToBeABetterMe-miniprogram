// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()


// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    console.log(event, wxContext)
    const stepInfoList = event.weRunData.data.stepInfoList
    const date = event.date

    let step,
        queriedRecord

    if (!date) return {}

    // 查数据库
    const dbRecord = await db.collection('sports').where({
        date,
    }).get()

    if (stepInfoList && stepInfoList.length > 0) {
        const ts = new Date(new Date(date).setHours(0, 0, 0, 0)).getTime()
        queriedRecord = stepInfoList.find(item => item.timestamp === ts / 1000)
    }
    console.log('dbRecord', dbRecord, JSON.stringify(queriedRecord))

    // 新增记录
    if (!dbRecord || dbRecord.data.length === 0) {
        if (queriedRecord) {
            step = queriedRecord.step
            try {
                db.collection('sports').add({
                    data: {
                        weRunStep: step,
                        date
                    }
                })
            } catch (e) {
                console.log(e)
            }
        }
    } else {
        const oldStep = dbRecord.data[0].weRunStep
        // 更新步数
        if (queriedRecord) {
            step = queriedRecord.step
        } else {
            step = oldStep
        }
        if (step !== oldStep) {
            const oldRecord = Object.assign({}, dbRecord.data[0])
            delete oldRecord._id
            db.collection('sports').doc(dbRecord.data[0]._id).update({
                data: {
                    ...oldRecord,
                    weRunStep: step
                }
            })
        }
    }

    return {
        step,
    }
}