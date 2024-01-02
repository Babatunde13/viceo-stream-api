import express, { Response } from 'express'
import fs from 'fs'

const app = express()

const videoStore: { [key: number]: string} = {} // in memory video store - shoud be a database/redis

const getStartAndEnd = (range: string, totalSize: number) => {
    range = range.replace(/bytes=/, '')

    const parts = range.split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1

    return { start, end }
}

const getFileSize = (videoPath: string) => {
    const stat = fs.statSync(videoPath)
    const fileSize = stat.size
    return { fileSize }
}

app.get('/', (_, res) => {
  res.send('Hello World!')
})

const generateHeaderAndChunkSize = (fileSize: number, range?: string) => {
    if (!range) {
        return {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        }
    }
    const { start, end } = getStartAndEnd(range, fileSize)
    const contentLength = end - start + 1

    const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4',
    }

    return {
        headers,
        start,
        end,
    }
}

const createVideoStream = (videoPath: string, res: Response, range?: string) => {
    const { fileSize } = getFileSize(videoPath)
    const { headers, start, end } = generateHeaderAndChunkSize(fileSize, range)

    if (!range) {
        res.writeHead(200, headers)
        fs.createReadStream(videoPath).pipe(res)
    } else {
        res.writeHead(206, headers)
        fs.createReadStream(videoPath, { start, end }).pipe(res)
    }
}




app.get('/videos/:id', (req, res) => {
    const videoId = parseInt(req.params.id)
    const range = req.headers.range
    const videoPath = videoStore[videoId]

    if (!videoPath) {
        res.status(404).send('Video not found')
        return
    }

    createVideoStream(videoPath, res, range)
})

app.post('/videos/upload', (req, res) => {
    // upload video and save to disk, return info about the video
    // id and filesize

    // update videoStore
    const videoId = 1
    const videoPath = 'absolute path to video'
    videoStore[videoId] = videoPath

    return res.json({
        id: videoId,
        fileSize: 123456789,
    })
})


app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
