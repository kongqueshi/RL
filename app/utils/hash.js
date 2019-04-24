import fs from 'fs'
import crypto from 'crypto'

const MAX_COUNT = 100

let tasks = []
let counter = 0

/**
 * 对给定的文件生成hash值
 * @param {string} filePath 
 */
export function hash(filePath) {
    return new Promise((resolve, reject) => {
        if (counter >= MAX_COUNT) {
            tasks.push({
                resolve, reject, filePath
            })
        } else {
            counter++
            doHash(resolve, reject, filePath)
        }
    })
}

/**
 * 对给定的文件生成hash值
 * 
 * @param {function} resolve 成功回调
 * @param {function} reject 失败回调
 * @param {string} filePath 文件路径
 */
function doHash(resolve, reject, filePath) {
    let fd = fs.createReadStream(filePath)
    let hash = crypto.createHash('sha1')
    hash.setEncoding('hex')
    fd.pipe(hash)
    fd.on('end', function() {
        hash.end()
        let hashValue = hash.read()
        onHashFinished()
        resolve(hashValue)
    })

    fd.on('error', function(err) {
        console.log(err)
        onHashFinished()
        reject(err)
    })
}

function onHashFinished() {
    counter--
    if(counter < MAX_COUNT && tasks.length) {
        let parms = tasks.shift()
        doHash(parms.resolve, parms.reject, parms.filePath)
    }
}
