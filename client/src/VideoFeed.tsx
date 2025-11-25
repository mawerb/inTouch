import { useState, useEffect, useRef } from "react"
import { useAudioRecorder } from './assets/hooks/useAudioRecorder';
import { useWebcam } from "./assets/hooks/useWebcam";

export default function VideoFeed() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const {
        mediaStream,
        error,
        isLoading,
        videoRef,
        startWebcam,
        stopWebcam
    } = useWebcam({
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: true
    });

    const {
        startRecording,
        stopRecording,
        isRecording,
        transcript } = useAudioRecorder(mediaStream);

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