// hooks/useWebcam.ts
import { useState, useRef, useEffect } from 'react';

interface UseWebcamOptions {
    video?: MediaTrackConstraints | boolean;
    audio?: boolean;
}

export const useWebcam = (options: UseWebcamOptions = { video: true, audio: true }) => {
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const checkPermissions = async (): Promise<string | null> => {
        if (!navigator.permissions) return null;
        
        try {
            const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
            if (result.state === 'denied') {
                return 'Camera permission denied. Please enable it in your browser settings.';
            }
        } catch (err) {
            console.log('Permission API not supported');
        }
        return null;
    };

    const getBrowserInstructions = () => {
        return `
Camera permission denied. To fix this:
1. Look for a camera icon in your browser's address bar
2. Click it and select "Allow" for camera access
3. Or go to your browser settings and allow camera for this site
4. Refresh the page and try again

Current URL: ${window.location.href}
        `.trim();
    };

    const handleMediaError = async (err: unknown, retryWithDefaults = true) => {
        console.error("Error accessing webcam:", err);
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setMediaStream(null);

        if (!(err instanceof Error)) {
            setError("An unknown error occurred while accessing the camera.");
            return;
        }

        switch (err.name) {
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                setError(getBrowserInstructions());
                break;
            
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                setError("No camera found. Please connect a camera and try again.");
                break;
            
            case 'NotReadableError':
            case 'TrackStartError':
                setError("Camera is already in use by another application.");
                break;
            
            case 'OverconstrainedError':
            case 'ConstraintNotSatisfiedError':
                if (retryWithDefaults) {
                    setError("Retrying with default settings...");
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: true, 
                            audio: options.audio 
                        });
                        setMediaStream(stream);
                        setError(null);
                    } catch (retryErr) {
                        handleMediaError(retryErr, false);
                    }
                } else {
                    setError("Camera doesn't support the requested settings.");
                }
                break;
            
            default:
                setError(`Camera error: ${err.message}`);
        }
    };

    const startWebcam = async () => {
        setError(null);
        setIsLoading(true);

        // Check browser support
        if (!navigator.mediaDevices?.getUserMedia) {
            const errorMsg = "Your browser doesn't support webcam access, or you're not on a secure connection (HTTPS or localhost).";
            setError(errorMsg);
            setIsLoading(false);
            console.error(errorMsg);
            return;
        }

        // Check permissions
        const permissionError = await checkPermissions();
        if (permissionError) {
            setError(permissionError);
            setIsLoading(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(options);
            setMediaStream(stream);
            setError(null);
        } catch (err) {
            await handleMediaError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const stopWebcam = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        setMediaStream(null);
        setError(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Auto-assign stream to video element
    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [mediaStream]);

    return {
        mediaStream,
        error,
        isLoading,
        videoRef,
        startWebcam,
        stopWebcam
    };
};