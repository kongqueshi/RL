import request from 'request'
import cheerio from 'cheerio'
import { download } from '../../utils/download'


let allCount = 0
let getImageUrlCount = 0
let failCount = 0
let successCount = 0
let finishCount = 0

let initUrl

let onPercentChanged
let onFinish

export function downloadImage(url, filepath, percentChanged, finish) {
    allCount = 0
    getImageUrlCount = 0
    failCount = 0
    successCount = 0
    finishCount = 0

    initUrl = url

    onPercentChanged = percentChanged
    onFinish = finish
    doImageDownload(url, filepath)
}

function percentChang() {
    onPercentChanged && onPercentChanged(parseInt((finishCount / allCount) * 100))
    finishCount >= allCount && onFinish && onFinish(successCount, failCount)
}

function doImageDownload(url, filePath) {
    if(filePath.substring(0, filePath.length - 1) !== '/')
        filePath = filePath + '/'
    request(url, function(error, response, body) {
        if(error) {
            console.log("Error: " + error)
        }

        if(response.statusCode === 200) {
            let $ = cheerio.load(body)
            let script = $('html > body > script')[0].children[0].data
            let boardText = script.split('app.page["board"] =')[1].split('app._csr')[0].trim()
            boardText = boardText.substring(0, boardText.length - 1)
            let json_board = JSON.parse(boardText)
            if(json_board['pins'] !== undefined && json_board['pins'].length > 0) {
                if(allCount <= 0) allCount = json_board['pin_count']

                json_board['pins'].forEach(pin => {
                    getImageUrlCount++

                    var key = pin['file']['key']
                    var imageUrl = 'http://img.hb.aicdn.com/' + key + '_fw658'
                    var type = pin['file']['type'].split('/')[1]

                    download(imageUrl, filePath + key + "." + type).then(
                        () => {
                            finishCount++
                            successCount++

                            percentChang()
                        },
                        (reason) => {
                            failCount++
                            finishCount++

                            percentChang()
                        }
                    )
                })

                if (json_board['pins'][json_board['pins'].length - 1] !== undefined) {
                    let nextUrl = initUrl + '?j2bypgqo&max=' + json_board['pins'][json_board['pins'].length - 1]['pin_id'] + '&limit=20&wfl=1';
                    doImageDownload(nextUrl, filePath)
                } else {
                    allCount = getImageUrlCount
                    percentChang()
                }
            } else {
                allCount = getImageUrlCount
                percentChang()
            }
        } else {
            console.log("Error:请求出错！返回Code：" + response.statusCode)
        }
    })
}