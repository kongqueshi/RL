/* eslint-disable linebreak-style */
import fs from 'fs'
import path from 'path'

const USER_HOME = process.env.HOME || process.env.USERPROFILE

let homePath

export default function getHomePath() {
    if (
        process.env.NODE_ENV === 'development' ||
        process.env.DEBUG_PROD === 'true'
    ) {
        return './'
    }

    if (homePath) {
        return homePath
    }

    homePath = `${path.join(USER_HOME, '.RL')}${path.sep}`

    if(fs.existsSync(homePath)) {
        return homePath
    } else {
        fs.mkdirSync(homePath)
        return homePath
    }
}