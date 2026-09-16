"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storage_1 = require("./storage");
const firestore_1 = require("./firestore");
(0, storage_1.setupDirectories)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post("/process-video", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // gets the path of the vid from the body request
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error("invalid message payload");
        }
    }
    catch (err) {
        console.log(err);
        return res.status(400).send(`Bad request: missing fileName`);
    }
    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split('.')[0];
    if (!(0, firestore_1.isVideoNew)(videoId)) {
        return res.status(400).send("Bad request: vid already processed");
    }
    else {
        yield (0, firestore_1.setVideo)(videoId, {
            id: videoId,
            uid: videoId.split('-')[0],
            status: 'processing'
        });
    }
    yield (0, storage_1.downloadRawVideo)(inputFileName);
    //convert video to 360p
    try {
        yield (0, storage_1.convertVideos)(inputFileName, outputFileName);
    }
    catch (err) {
        Promise.all([
            (0, storage_1.deleteRawVideo)(inputFileName),
            (0, storage_1.deleteProcessedVideo)(outputFileName)
        ]);
        return res.status(500).send(`Internal Server Error: video processing failed: ${err}`);
    }
    yield (0, storage_1.uploadProcessedVideo)(outputFileName);
    yield (0, firestore_1.setVideo)(videoId, {
        status: "processed",
        filename: outputFileName
    });
    Promise.all([
        (0, storage_1.deleteRawVideo)(inputFileName),
        (0, storage_1.deleteProcessedVideo)(outputFileName)
    ]);
    return res.status(200).send('Processing finish successfully');
    //async, so either the ffmpeg process ends with returning 200 or 500 code
    //     ffmpeg(inputFilePath)
    //         .outputOptions("-vf", "scale=-1:360") // 360p
    //         .on("end", () => {
    //             // when reaches here, we know the conversion fully done
    //             res.status(200).send(`video conversion successful`);
    //         })
    //         .on("error", (err) =>{
    //             console.log(`error occurred in ffmpeg stage: ${err.message}`);
    //             res.status(500).send(`file convert crashed on server end ${err.message}`);
    //         })
    //         .save(outputFilePath);
    // });
    // ffmpeg(inputFilePath)
    // .outputOptions('-vf', 'scale=-1:360') // 360p
    // .on('end', function() {
    //     console.log('Processing finished successfully');
    //     res.status(200).send('Processing finished successfully');
    // })
    // .on("error", (err, stdout, stderr) => {
    //     console.error(`FFmpeg error: ${err.message}`);
    //     console.error(`FFmpeg stderr output: ${stderr}`); // <--- This reveals the exact problem
    //     res.status(500).send(`file convert crashed: ${err.message}`);
    //     })
    //     .save(outputFilePath);
}));
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`video processing service listening on http://localhost:${port}`);
});
