import request from 'request'
import fs from 'fs'

const MAX_COUNT = 100

let tasks = []
let counter = 0

export function download(url, fileToSave) {
    return new Promise((resolve, reject) => {
        if (counter >= MAX_COUNT) {
            tasks.push({
                resolve, reject, url, fileToSave
            })
        } else {
            counter++
            doDownload(resolve, reject, url, fileToSave)
        }
      })
}

function doDownload(resolve, reject, url, fileToSave) {
    let writeStream = fs.createWriteStream(fileToSave, {autoClose: true})
    let readStream = request(url)
    readStream.pipe(writeStream)

    readStream.on('error', function(err) {
        console.log(err)
        onDownloadFinished()
        reject(err)
    })
    
    writeStream.on("close", function() {
        onDownloadFinished()
        resolve()
    })

    writeStream.on('error', function(err){
        console.log(err)
        onDownloadFinished()
        reject(err)
     })
}

function onDownloadFinished() {
    counter--
    if(counter < MAX_COUNT && tasks.length) {
        let parms = tasks.shift()
        doDownload(parms.resolve, parms.reject, parms.url, parms.fileToSave)
    }
}