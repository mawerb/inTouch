import { useState, useCallback } from 'react';

export const useAudioRecorder = (mediaStream: MediaStream | null) => {
    const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<string>('');

    const startRecording = useCallback(() => {

        if (!mediaStream) {
            console.error('No media stream available');
            return;
        }

        const recorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
        recorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                try {
                    const formData = new FormData();
                    formData.append('audio', event.data, 'chunk.webm')

                    const response = await fetch('api/transcribe', {
                        method: 'POST',
                        body: formData,
                    })

                    const result = await response.json();
                    console.log(result.transcript);
                    setTranscript(prev => prev + ' ' + result.transcript)
                } catch (err) {
                    console.error("Error Transcribing", err);
                }
            }
        }
        recorder.start(3000);
        setAudioRecorder(recorder);
        setIsRecording(true);
    }, [mediaStream]);

const stopRecording = useCallback(() => {
    if (audioRecorder) {
        audioRecorder.stop();
        setAudioRecorder(null);
        setIsRecording(false);
    }
}, [audioRecorder]);

return {
    startRecording,
    stopRecording,
    isRecording,
    transcript,
}
}
