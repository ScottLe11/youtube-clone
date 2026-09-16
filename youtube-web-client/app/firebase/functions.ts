import {httpsCallable} from "firebase/functions";
import { functions } from "./firebase";
// import { detectContentType } from "next/dist/server/image-optimizer";


const generateUploadUrl =  httpsCallable(functions, 'generateUploadURL');
const getVideosFunction =  httpsCallable(functions, 'getVideos');

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: 'processing' | 'processed',
  title?: string,
  description?: string  
}

export async function uploadVideo(file: File){
    const response: any = await generateUploadUrl({
        fileExtension: file.name.split('.').pop()
    });

    //upload the file via signed url
    const uploadResult = await fetch(response?.data?.url,{
        method: 'PUT',
        body:file,
        headers: {
            'Content-Type': file.type,
        },
        }
    );
    return uploadResult;
}

export async function getVideos(){
    const response = await getVideosFunction(); 
    return response.data as Video[];
}