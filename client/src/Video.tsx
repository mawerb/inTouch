import { useState, useEffect, useRef } from "react"


export default function VideoFeed() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check permissions before attempting to access
    const checkPermissions = async () => {
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                
                console.log('Camera permission:', cameraPermission.state);
                console.log('Microphone permission:', microphonePermission.state);
                
                if (cameraPermission.state === 'denied') {
                    return "Camera permission is denied. Please reset permissions in your browser settings.";
                }
            } catch (err) {
                // Permissions API might not be fully supported, continue anyway
                console.log('Permissions API not fully supported, continuing...');
            }
        }
        return null;
    };

    const startWebcam = async () => {
        setError(null);
        setIsLoading(true);

        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const errorMsg = "Your browser doesn't support webcam access, or you're not on a secure connection (HTTPS or localhost).";
            setError(errorMsg);
            setIsLoading(false);
            console.error(errorMsg);
            console.log('Current URL:', window.location.href);
            console.log('Is secure context:', window.isSecureContext);
            return;
        }

        // Check permissions first
        const permissionError = await checkPermissions();
        if (permissionError) {
            setError(permissionError);
            setIsLoading(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }, 
                audio: true 
            });
            setMediaStream(stream);
            setError(null);
        } catch (err: unknown) {
            console.error("Error accessing webcam:", err);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            setMediaStream(null);
            
            // Provide user-friendly error messages
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    const browserInstructions = `
Camera permission denied. To fix this:

1. Look for a camera icon in your browser's address bar (lock icon area)
2. Click it and select "Allow" for camera access
3. Or go to your browser settings:
   - Chrome/Edge: Settings → Privacy and security → Site settings → Camera
   - Firefox: Settings → Privacy & Security → Permissions → Camera
   - Safari: Safari → Settings → Websites → Camera
4. Find "localhost" or "127.0.0.1" and set it to "Allow"
5. Refresh the page and try again

Current URL: ${window.location.href}
                    `.trim();
                    setError(browserInstructions);
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setError("No camera found. Please connect a camera and try again.");
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    setError("Camera is already in use by another application. Please close other apps using the camera.");
                } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                    setError("Camera doesn't support the requested settings. Trying with default settings...");
                    // Retry with default constraints
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                        console.log('Retry stream obtained:', stream);
                        setMediaStream(stream);
                        setError(null);
                    } catch (retryErr) {
                        setError("Unable to access camera. Please check your browser permissions.");
                    }
                } else {
                    setError(`Camera error: ${err.message}`);
                }
            } else {
                setError("An unknown error occurred while accessing the camera.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    const stopWebcam = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        setMediaStream(null);
        setError(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }

    // Sync mediaStream to video element
    useEffect(() => {
        if (videoRef.current && mediaStream) {
            console.log('Setting srcObject on video element');
            videoRef.current.srcObject = mediaStream;
            console.log('Video srcObject after setting:', videoRef.current.srcObject);
            
            // Ensure video plays
            videoRef.current.play().catch(err => {
                console.error('Error playing video:', err);
            });
        } else if (videoRef.current && !mediaStream) {
            videoRef.current.srcObject = null;
        }
    }, [mediaStream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [mediaStream]);

    return (
        <div className="flex flex-col w-full h-full gap-4 p-4">
            <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden">
                <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    playsInline 
                    muted
                />
                <canvas ref={canvasRef} className="hidden" />
                {!mediaStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                        <p className="text-lg">Camera feed will appear here</p>
                    </div>
                )}
            </div>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
                    <p className="font-semibold mb-2">Error:</p>
                    <p className="whitespace-pre-line">{error}</p>
                </div>
            )}
            
            <div className="flex gap-4">
                <button 
                    onClick={startWebcam} 
                    disabled={isLoading || !!mediaStream}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-colors"
                >
                    {isLoading ? "Starting..." : "Start Webcam"}
                </button>
                <button 
                    onClick={stopWebcam} 
                    disabled={!mediaStream}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-colors"
                >
                    Stop Webcam
                </button>
            </div>
        </div>
    )
}