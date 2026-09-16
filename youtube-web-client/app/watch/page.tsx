'use client';
import { useSearchParams } from "next/navigation";


export default function Watch(){
    const vidPrefix = 'https://storage.googleapis.com/clash-youtube-processed-videos/';
    const vidSrc = useSearchParams().get('v');
    return (
        <div>
            <h1>Watch page</h1>
            <video controls src={`${vidPrefix}${vidSrc}`}></video>
        </div>
    );

}