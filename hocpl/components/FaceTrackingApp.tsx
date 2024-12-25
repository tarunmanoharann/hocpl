"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, StopCircle, Download } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { cn } from '@/lib/utils';

export default function FaceTrackingApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<{
    blob: Blob;
    url: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    loadModels();
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      // Load face-api models from public directory
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      await initializeCamera();
      setIsModelLoading(false);
    } catch (error) {
      console.error('Error loading face detection models:', error);
    }
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const startFaceDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

      // Draw face detections
      faceapi.draw.drawDetections(canvas, resizedDetections);
      // Draw face landmarks
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      // Draw expressions
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }, 100);
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;

    const stream = videoRef.current.srcObject as MediaStream;
    const canvas = canvasRef.current;
    
    // Combine video stream with canvas stream for recording
    const ctx = canvas?.getContext('2d');
    const compositeStream = new MediaStream();
    
    if (canvas) {
      const canvasStream = canvas.captureStream();
      stream.getVideoTracks().forEach(track => compositeStream.addTrack(track));
      canvasStream.getVideoTracks().forEach(track => compositeStream.addTrack(track));
    }

    const mediaRecorder = new MediaRecorder(compositeStream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const timestamp = Date.now();
      
      setRecordedVideo({ blob, url, timestamp });
      
      // Save to localStorage
      const videoData = {
        url,
        timestamp,
        name: `face-tracking-${timestamp}.webm`
      };
      
      const savedVideos = JSON.parse(localStorage.getItem('recordedVideos') || '[]');
      localStorage.setItem('recordedVideos', JSON.stringify([...savedVideos, videoData]));
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadVideo = () => {
    if (recordedVideo) {
      const a = document.createElement('a');
      a.href = recordedVideo.url;
      a.download = `face-tracking-${recordedVideo.timestamp}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Start face detection when video loads
  const handleVideoPlay = () => {
    startFaceDetection();
  };

  return (
    <Card className="p-6 bg-gray-800 border-gray-700 max-w-4xl mx-auto">
      <div className="relative w-full aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onPlay={handleVideoPlay}
          className={cn(
            "w-full h-full rounded-lg shadow-xl object-cover",
            isModelLoading && "opacity-50"
          )}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        {isModelLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mt-6">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={isModelLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            <Camera className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="destructive">
            <StopCircle className="mr-2 h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {recordedVideo && (
          <Button onClick={downloadVideo} variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            Download Recording
          </Button>
        )}
      </div>

      {recordedVideo && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Preview:</h3>
          <video
            src={recordedVideo.url}
            controls
            className="w-full rounded-lg"
          />
        </div>
      )}
    </Card>
  );
}