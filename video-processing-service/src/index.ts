import express from "express";
import ffmpeg from "fluent-ffmpeg";
import {convertVideos, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo} from "./storage";
import { isVideoNew, setVideo } from "./firestore";

setupDirectories(); 
const app = express();
app.use(express.json());

app.post("/process-video", async (req, res) => {
    // gets the path of the vid from the body request
    let data;

    try{
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name){
            throw new Error("invalid message payload");
        }
    }
    catch (err){
        console.log(err);
        return res.status(400).send(`Bad request: missing fileName`);
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split('.')[0];
    if (!isVideoNew(videoId)){
        return res.status(400).send("Bad request: vid already processed");
    }
    else{
        await setVideo(videoId, {
            id: videoId,
            uid: videoId.split('-')[0],
            status:'processing'
        })
    }

    await downloadRawVideo(inputFileName);

    //convert video to 360p
    try{
        await convertVideos(inputFileName, outputFileName);
    }
    catch (err) {
        Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);
        return res.status(500).send(`Internal Server Error: video processing failed: ${err}`)
    }

    await uploadProcessedVideo(outputFileName);
    
    await setVideo(videoId, {
        status:"processed",
        filename:outputFileName
    })

    Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);

    return res.status(200).send('Processing finish successfully');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`video processing service listening on http://localhost:${port}`);

});
