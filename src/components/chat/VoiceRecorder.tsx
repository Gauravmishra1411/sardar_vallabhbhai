import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Trash2, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (audioUrl: string, duration: string) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording, or you are testing on an unsecured local IP (HTTP instead of HTTPS).');
        onCancel();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddthlutz4';
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'univercity';

      let audioUrl = '';

      // Attempt Cloudinary upload
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, `voice-${Date.now()}.webm`);
        formData.append('upload_preset', preset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.secure_url) {
            audioUrl = resJson.secure_url;
          }
        }
      } catch (err) {
        console.warn('Cloudinary upload warning:', err);
      }

      // Fallback to base64 Data URL if Cloudinary fails or is unreachable
      if (!audioUrl) {
        audioUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });
      }
      
      const mins = Math.floor(recordingTime / 60).toString().padStart(2, '0');
      const secs = (recordingTime % 60).toString().padStart(2, '0');
      
      await onSend(audioUrl, `${mins}:${secs}`);
    } catch (err) {
      console.error('Voice send failed:', err);
      alert('Failed to send voice message.');
    } finally {
      setIsUploading(false);
    }
  };

  // Start recording immediately when mounted
  useEffect(() => {
    startRecording();
    return () => {
      if (isRecording) stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-3 bg-indigo-900/40 p-2 rounded-full border border-indigo-500/30 w-full max-w-lg">
      {isRecording ? (
        <>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 animate-pulse shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <span className="text-red-400 font-mono text-sm min-w-[50px]">{formatTime(recordingTime)}</span>
          <button onClick={stopRecording} className="ml-auto p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shrink-0">
            <Square className="w-4 h-4" fill="currentColor" />
          </button>
        </>
      ) : (
        <>
          <button onClick={onCancel} disabled={isUploading} className="p-2 text-gray-400 hover:text-white transition-colors shrink-0">
            <Trash2 className="w-5 h-5" />
          </button>
          
          <audio src={audioBlob ? URL.createObjectURL(audioBlob) : ''} controls className="h-8 flex-1 outline-none max-w-[220px]" />
          
          <button onClick={handleSend} disabled={isUploading} className="ml-auto p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 min-w-[38px] shadow-lg shadow-indigo-600/30">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </>
      )}
    </div>
  );
};
