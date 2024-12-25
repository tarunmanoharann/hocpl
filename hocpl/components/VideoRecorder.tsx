"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Video, StopCircle, Download } from 'lucide-react';

interface VideoRecorderProps {
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob) => void;
}

export function VideoRecorder({ onRecordingStart, onRecordingStop }: VideoRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        if (onRecordingStop) {
          onRecordingStop(blob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      if (onRecordingStart) {
        onRecordingStart();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex gap-2">
      {!isRecording ? (
        <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
          <Camera className="mr-2 h-4 w-4" />
          Start Recording
        </Button>
      ) : (
        <Button onClick={stopRecording} variant="destructive">
          <StopCircle className="mr-2 h-4 w-4" />
          Stop Recording
        </Button>
      )}
    </div>
  );
}