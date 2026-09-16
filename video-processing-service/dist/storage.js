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
exports.setupDirectories = setupDirectories;
exports.convertVideos = convertVideos;
exports.downloadRawVideo = downloadRawVideo;
exports.uploadProcessedVideo = uploadProcessedVideo;
exports.deleteRawVideo = deleteRawVideo;
exports.deleteProcessedVideo = deleteProcessedVideo;
const storage_1 = require("@google-cloud/storage");
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const storage = new storage_1.Storage();
//establish DIRs of raw and processed vids
const rawBucketName = "clash-youtube-raw-videos";
const processedBucketName = "clash-youtube-processed-videos";
const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";
function setupDirectories() {
    ensureDirectoryExist(`${localRawVideoPath}`);
    ensureDirectoryExist(`${localProcessedVideoPath}`);
}
function convertVideos(rawVideoName, processedVideoName) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions("-vf", "scale=-1:360") // 360p
            .on("end", () => {
            // when reaches here, we know the conversion fully done
            console.log(`video conversion successful`);
            resolve();
        })
            .on("error", (err) => {
            console.log(`error occurred in ffmpeg stage: ${err.message}`);
            console.log(`file convert crashed on server end ${err.message}`);
            reject(err);
        })
            .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
}
;
function downloadRawVideo(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield storage.bucket(rawBucketName)
            .file(fileName)
            .download({ destination: `${localRawVideoPath}/${fileName}` });
        console.log(`gs://${localRawVideoPath}/${fileName} downloaded to ${localProcessedVideoPath}/${fileName}`);
    });
}
;
function uploadProcessedVideo(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const bucket = storage.bucket(processedBucketName);
        yield bucket.upload(`${localProcessedVideoPath}/${fileName}`, { destination: fileName });
        yield bucket.file(fileName).makePublic();
    });
}
;
function deleteRawVideo(fileName) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}
function deleteProcessedVideo(fileName) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}
function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file at ${filePath}`, err);
                    reject(err);
                }
                else {
                    console.log(`flie deleted successfully at ${filePath}`);
                    resolve();
                }
            });
            resolve();
        }
        else {
            reject();
        }
    });
}
function ensureDirectoryExist(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        console.log(`Created new directory at ${dirPath}`);
    }
}
