"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, StopCircle, Download } from "lucide-react";
import * as faceapi from "face-api.js";
import { cn } from "@/lib/utils";

interface VideoData {
  url: string;
  timestamp: number;
  name: string;
}

export default function FaceTrackingApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<{
    blob: Blob;
    url: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsModelLoading(true);
        setLoadingError(null);
        const MODEL_URL = "/weights";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.load(MODEL_URL),
          faceapi.nets.faceLandmark68Net.load(MODEL_URL),
          faceapi.nets.faceExpressionNet.load(MODEL_URL),
        ]);
        await initializeCamera();
        setIsModelLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setLoadingError(`Failed to load face detection models: ${errorMessage}`);
        setIsModelLoading(false);
        console.error("Model loading error:", err);
      }
    };

    loadModels();
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setLoadingError(`Failed to access camera: ${errorMessage}. Please make sure camera permissions are granted.`);
      console.error("Camera initialization error:", err);
    }
  };

  const startFaceDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0) {
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectFaces = async () => {
      if (!video || !canvas) return;

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          const dims = {
            width: video.videoWidth,
            height: video.videoHeight,
          };
          const resizedDetections = faceapi.resizeResults(detections, dims);

          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          resizedDetections.forEach((detection) => {
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
              lineWidth: 2,
              boxColor: "rgba(0, 255, 0, 0.8)",
            });
            drawBox.draw(canvas);
          });
        }

        requestAnimationFrame(detectFaces);
      } catch (err) {
        console.error("Face detection error:", err);
        requestAnimationFrame(detectFaces);
      }
    };

    detectFaces();
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject || !canvasRef.current) return;

    const canvasStream = canvasRef.current.captureStream();
    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType: "video/webm;codecs=vp9",
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const timestamp = Date.now();

      setRecordedVideo({ blob, url, timestamp });

      const videoData: VideoData = {
        url,
        timestamp,
        name: `face-tracking-${timestamp}.webm`,
      };

      const savedVideos = JSON.parse(localStorage.getItem("recordedVideos") || "[]");
      localStorage.setItem("recordedVideos", JSON.stringify([...savedVideos, videoData]));
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
      const a = document.createElement("a");
      a.href = recordedVideo.url;
      a.download = `face-tracking-${recordedVideo.timestamp}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card className="p-6 bg-gray-800 border-gray-700 max-w-4xl mx-auto">
      {loadingError ? (
        <div className="text-red-500 text-center p-4">{loadingError}</div>
      ) : (
        <>
          <div className="relative w-full aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlay={startFaceDetection}
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
        </>
      )}
    </Card>
  );
}
