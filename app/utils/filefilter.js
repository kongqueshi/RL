import filetypies from '../constants/filetypies'
import fs from 'fs'

/**
 * 从给定的目录下过滤出给定类型的所有文件
 */
export default function filteFile(dir, type, callback) {
    let suffixs = filetypies[type]

    if (!suffixs) {
        callback(`不支持过滤类型为${type}的文件`)
    } else {
        fs.readdir(dir, null, (err, files) => {
            let finalFiles
            if (!err) {
                finalFiles = files.filter(file => {
                    if (file.indexOf('.') <= 0) {
                      return false
                    } else {
                      let suffix = file.substring(file.lastIndexOf('.') + 1, file.length).toLowerCase()
                      if ( suffixs.indexOf(suffix) >= 0) {
                        return true
                      }
            
                      return false
                    }
                  })
            }
           
            callback && callback(err, finalFiles)
        })
    }
}