import { useState, useRef } from 'react';

export const useWebCamRecorder = (videoRef: React.RefObject<HTMLVideoElement | null>, canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const [isDetectingFace, setIsDetectingFace] = useState<boolean>(false);
    const [name, setName] = useState<string | null>(null);
    const [isPersonDetected, setIsPersonDetected] = useState<boolean>(false);
    const isDetectingFaceRef = useRef<boolean>(false);

    const detectFrame = () => {
        if (!videoRef.current || !canvasRef.current) {
            console.log("No Video Stream Detected!")
            return;
        }

        isDetectingFaceRef.current = true;
        setIsDetectingFace(true);
        const detectNewFrame = () => {
            if (!isDetectingFaceRef.current) return;

            const videoElement = videoRef.current;
            const canvas = canvasRef.current;

            if (!videoElement || !canvas) return;

            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            const ctx = canvas.getContext('2d');

            ctx?.drawImage(videoElement, 0, 0)

            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error("Frame couldn't be converted to Blob")
                    return;
                }
                console.log(blob)
                console.log('size:', blob.size, 'type:', blob.type);
            }, 'image/jpeg', 0.8)

            setTimeout(detectFrame, 3000);
        }

        detectNewFrame();
    }

    const stopDetecting = () => {
        isDetectingFaceRef.current = false;
        setIsDetectingFace(false);
    };

    return {
        detectFrame,
        stopDetecting,
        isPersonDetected,
        isDetectingFace,
        name,
    }
}