/**
 * Extracts video frames at specified timestamps.
 * Returns an array of objects containing the timestamp and the base64 image string.
 */
export const extractFrames = async (
  videoFile: File,
  timestamps: number[]
): Promise<{ timestamp: number; image: string }[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(videoFile);
    
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const frames: { timestamp: number; image: string }[] = [];
    let currentIndex = 0;

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const captureFrame = () => {
      if (currentIndex >= timestamps.length) {
        // Clean up
        URL.revokeObjectURL(url);
        video.remove();
        canvas.remove();
        resolve(frames);
        return;
      }

      const time = timestamps[currentIndex];
      
      // Seek to time
      video.currentTime = time;
    };

    video.onloadedmetadata = () => {
        canvas.width = video.videoWidth / 2; // Downscale slightly for performance/token usage
        canvas.height = video.videoHeight / 2;
        captureFrame();
    };

    video.onseeked = () => {
        // Draw frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/png');
        
        frames.push({
            timestamp: timestamps[currentIndex],
            image: dataURL
        });

        currentIndex++;
        captureFrame();
    };

    video.onerror = (e) => {
      reject(e);
    };
  });
};

/**
 * Generates a set of timestamps to sample from the video duration.
 * Starts from 0 to include the first frame.
 */
export const generateSampleTimestamps = (duration: number, count: number = 5): number[] => {
    if (duration <= 0 || count <= 0) return [];
    
    // Calculate step to distribute frames evenly, ensuring the first frame (0s) is included
    const step = duration / count;
    const timestamps = [];
    
    for (let i = 0; i < count; i++) {
        timestamps.push(i * step);
    }
    
    return timestamps;
};

export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
