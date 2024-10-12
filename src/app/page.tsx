"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation, AnimationControls } from "framer-motion"; // Properly import types
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Wifi, ArrowDown, ArrowUp, AlertCircle } from "lucide-react";
import React from "react";

// 1. Define the SpeedometerProps type
type SpeedometerProps = {
  speed: number;
  controls: AnimationControls; // Use proper typing from framer-motion
  icon: React.ReactNode;
  label: string;
};

const Speedometer: React.FC<SpeedometerProps> = ({
  speed,
  controls,
  icon,
  label,
}) => (
  <div className="flex flex-col items-center">
    <div className="text-lg sm:text-xl font-semibold mb-2">{label}</div>
    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <circle cx="100" cy="100" r="90" fill="none" stroke="#374151" strokeWidth="15" />
        <motion.path
          d="M100 10 A90 90 0 0 1 190 100"
          fill="none"
          stroke="#4ADE80"
          strokeWidth="15"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.min(speed / 100, 1) }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.line
          x1="100"
          y1="100"
          x2="100"
          y2="20"
          stroke="#E5E7EB"
          strokeWidth="4"
          initial={{ rotate: -135 }}
          animate={controls}
          transition={{ type: "spring", stiffness: 60, damping: 10 }}
          style={{ originX: "100px", originY: "100px" }}
        />
        <circle cx="100" cy="100" r="10" fill="#E5E7EB" />
        <motion.text
          x="100"
          y="140"
          textAnchor="middle"
          fontSize="24"
          fill="#FFFFFF"
          fontWeight="bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {speed.toFixed(1)}
        </motion.text>
        <text x="100" y="160" textAnchor="middle" fontSize="14" fill="#9CA3AF">
          Mbps
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
    </div>
  </div>
);

export default function Component() {
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  // Properly typed AnimationControls from framer-motion
  const downloadControls: AnimationControls = useAnimation();
  const uploadControls: AnimationControls = useAnimation();

  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (error) {
        console.error("Failed to fetch IP address:", error);
        setIpAddress("Unable to fetch IP");
      }
    };
    fetchIpAddress();
  }, []);

  const measurePingAndJitter = async () => {
    const pingTimes: number[] = [];
    try {
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await fetch("https://speed.cloudflare.com/__down?bytes=1", {
          cache: "no-store",
        });
        const end = performance.now();
        pingTimes.push(end - start);
      }

      const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;

      let jitterSum = 0;
      for (let i = 1; i < pingTimes.length; i++) {
        jitterSum += Math.abs(pingTimes[i] - pingTimes[i - 1]);
      }
      const avgJitter = jitterSum / (pingTimes.length - 1);

      setPing(parseFloat(avgPing.toFixed(2)));
      setJitter(parseFloat(avgJitter.toFixed(2)));
    } catch (error) {
      console.error("Ping/Jitter test failed:", error);
      setPing(0);
      setJitter(0);
    }
  };

  const measureNetworkSpeed = async () => {
    setConnectionError(false);
    setIsTesting(true);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(null);
    setJitter(null);

    downloadControls.start({ rotate: -135 });
    uploadControls.start({ rotate: -135 });

    const fileSize = 5 * 1024 * 1024;
    const testFile = "https://speed.cloudflare.com/__down?bytes=5000000";

    if (!navigator.onLine) {
      setConnectionError(true);
      setIsTesting(false);
      return;
    }

    try {
      const downloadStartTime = performance.now();
      const downloadResponse = await fetch(testFile);
      await downloadResponse.arrayBuffer();
      const downloadEndTime = performance.now();
      const downloadSpeedMbps =
        (fileSize / ((downloadEndTime - downloadStartTime) / 1000) / 1024 / 1024) *
        8;

      setDownloadSpeed(downloadSpeedMbps);
      downloadControls.start({
        rotate: Math.min(downloadSpeedMbps * 2.7 - 135, 135),
      });

      await measurePingAndJitter();

      const uploadStartTime = performance.now();
      const uploadChunk = new Blob([new ArrayBuffer(fileSize)]);
      await fetch("https://httpbin.org/post", {
        method: "POST",
        body: uploadChunk,
      });
      const uploadEndTime = performance.now();
      const uploadSpeedMbps =
        (fileSize / ((uploadEndTime - uploadStartTime) / 1000) / 1024 / 1024) * 8;

      setUploadSpeed(uploadSpeedMbps);
      uploadControls.start({
        rotate: Math.min(uploadSpeedMbps * 2.7 - 135, 135),
      });
    } catch (error) {
      console.error("Network test failed:", error);
      setConnectionError(true);
    }

    setIsTesting(false);
  };

  return (
    <Card className="bg-gray-800 text-white shadow-lg p-6 rounded-lg max-w-4xl mx-auto h-auto">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-bold text-center">
          <Activity className="mr-2" />
          Network Speed Test
        </CardTitle>
        <div className="text-center text-sm text-gray-400 mt-2">
          <Wifi className="mr-1" size={16} />
          {ipAddress ? `Your IP: ${ipAddress}` : "Fetching IP..."}
        </div>
      </CardHeader>
      {connectionError && (
        <div className="flex items-center justify-center mt-4 text-red-500">
          <AlertCircle className="mr-2" />
          Connection lost. Please check your internet.
        </div>
      )}
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
        <Speedometer
          speed={downloadSpeed}
          controls={downloadControls}
          icon={<ArrowDown size={24} className="text-blue-400 -mt-10" />}
          label="Download"
        />
        <Speedometer
          speed={uploadSpeed}
          controls={uploadControls}
          icon={<ArrowUp size={24} className="text-green-400 -mt-10" />}
          label="Upload"
        />
      </CardContent>
      {ping !== null && jitter !== null && (
        <div className="mt-6 text-center flex justify-center space-x-6">
          <div>Ping: {ping} ms</div>
          <div>Jitter: {jitter} ms</div>
        </div>
      )}
      <CardFooter className="mt-10 flex flex-col items-center">
        <Button
          onClick={measureNetworkSpeed}
          disabled={isTesting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
        >
          {isTesting ? "Testing..." : "Start Test"}
        </Button>
      </CardFooter>
      <div className="flex justify-center text-center mt-10 sm:mt-24">
        © Copyright 2024 Saqib, Inc.
      </div>
    </Card>
  );
}
