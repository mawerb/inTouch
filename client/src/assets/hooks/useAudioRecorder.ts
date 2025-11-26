import { useState, useEffect, useRef, useCallback } from 'react';

export const useAudioRecorder = (audioOnlyStream: MediaStream | null) => {
    const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<string>('');
    const [selectedMimeType, setSelectedMimeType] = useState<string>('');
    const isRecordingRef = useRef<boolean>(false);

    useEffect(() => {
        const supportedTypes = [
            'audio/flac',
            'audio/mp3',
            'audio/mp4',
            'audio/mpeg',
            'audio/mpga',
            'audio/m4a',
            'audio/ogg',
            'audio/wav',
            'audio/webm',
        ]

        let foundType = null;

        for (const supportedMime of supportedTypes) {
            if (MediaRecorder.isTypeSupported(supportedMime)) {
                foundType = supportedMime;
                break;
            }
        }

        if (!foundType) {
            console.error("No supported MimeTypes found!")
            return;
        }

        console.log('Using MIME type:', foundType);
        setSelectedMimeType(foundType)

    }, [])

    const startRecording = useCallback(() => {

        if (!audioOnlyStream) {
            console.error('No media stream available');
            return;
        }

        if (!selectedMimeType) {
            console.error('No MIME type selected yet');
            return;
        }

        const extension = selectedMimeType.split('/')[1].split(';')[0];
        
        isRecordingRef.current = true;
        setIsRecording(true);

        // Function to create and start a new recorder
        const startNewRecorder = () => {
            if (!isRecordingRef.current) return;  // Stop if recording was stopped

            const recorder = new MediaRecorder(audioOnlyStream, {
                mimeType: selectedMimeType
            });

            recorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    try {
                        const formData = new FormData();
                        formData.append('audio', event.data, `chunk.${extension}`);

                        const response = await fetch('http://127.0.0.1:8000/api/transcribe/', {
                            method: 'POST',
                            body: formData,
                        });

                        const result = await response.json();
                        console.log(result);
                        setTranscript(prev => prev + ' ' + result.text);
                    } catch (err) {
                        console.error("Error Transcribing", err);
                    }
                }
            };

            recorder.onstop = () => {
                // Start a new recorder after this one stops
                startNewRecorder();
            };

            // Record for 3 seconds then stop (which triggers onstop)
            recorder.start();
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
            }, 3000);

            setAudioRecorder(recorder);
        };

        // Start the first recorder
        startNewRecorder();
    }, [audioOnlyStream, selectedMimeType]);

    const stopRecording = useCallback(() => {
        if (audioRecorder) {
            audioRecorder.stop();
            setAudioRecorder(null);
            isRecordingRef.current = false;
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
