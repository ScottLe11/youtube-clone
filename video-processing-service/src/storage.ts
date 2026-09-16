import  {Storage} from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { resolve } from 'dns';

const storage = new Storage();

//establish DIRs of raw and processed vids
const rawBucketName = "clash-youtube-raw-videos";
const processedBucketName = "clash-youtube-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";




export function setupDirectories(){
    ensureDirectoryExist(`${localRawVideoPath}`);
    ensureDirectoryExist(`${localProcessedVideoPath}`);
}


export function convertVideos(rawVideoName: string, processedVideoName:string){
    return new Promise<void> ((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`) 
            .outputOptions("-vf", "scale=-1:360") // 360p
            .on("end", () => {
                // when reaches here, we know the conversion fully done
                console.log(`video conversion successful`);
                resolve()
            })
            .on("error", (err) =>{
                console.log(`error occurred in ffmpeg stage: ${err.message}`);
                console.log(`file convert crashed on server end ${err.message}`);
                reject(err)
            })
            .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
    
};

export async function downloadRawVideo(fileName:string){
    await storage.bucket(rawBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoPath}/${fileName}`});

    console.log(`gs://${rawBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`);
};

export async function uploadProcessedVideo(fileName:string){
    const bucket = storage.bucket(processedBucketName);

    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {destination: fileName});

    await bucket.file(fileName).makePublic();
};

export function deleteRawVideo(fileName:string){
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName:string){
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

function deleteFile(filePath:string): Promise<void>{
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)){
             fs.unlink(filePath, (err) => {
                if (err){
                    console.log(`Failed to delete file at ${filePath}`, err)
                    reject(err)
                }
                else{
                    console.log(`flie deleted successfully at ${filePath}`)
                    resolve()
                }
             })
            
            resolve();
        }
        else{
            reject();
        }
    });
}

function ensureDirectoryExist(dirPath:string){
    if (!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, {recursive: true});
        console.log(`Created new directory at ${dirPath}`);
    }

}