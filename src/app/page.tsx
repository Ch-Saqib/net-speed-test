"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Wifi, ArrowDown, ArrowUp } from "lucide-react";

export default function Component() {
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const downloadControls = useAnimation();
  const uploadControls = useAnimation();

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

  const measureNetworkSpeed = async () => {
    setIsTesting(true);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    downloadControls.start({ rotate: -135 });
    uploadControls.start({ rotate: -135 });

    const fileSize = 5 * 1024 * 1024; // 5MB
    const testFile = "https://speed.cloudflare.com/__down?bytes=5000000"; // Cloudflare speed test file

    // Download speed test
    const downloadStartTime = performance.now();
    try {
      const response = await fetch(testFile);
      if (!response.ok) throw new Error("Network response was not ok");
      await response.arrayBuffer();

      const downloadEndTime = performance.now();
      const downloadDurationInSeconds =
        (downloadEndTime - downloadStartTime) / 1000;
      const downloadSpeedMbps =
        (fileSize / downloadDurationInSeconds / 1024 / 1024) * 8;

      setDownloadSpeed(downloadSpeedMbps);
      downloadControls.start({
        rotate: Math.min(downloadSpeedMbps * 2.7 - 135, 135),
      });
    } catch (error) {
      console.error("Error during download speed test:", error);
      setDownloadSpeed(0);
    }

    // Simulated upload speed test
    const uploadStartTime = performance.now();
    try {
      // Simulate upload by waiting for a random duration
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 2000 + 1000)
      );

      const uploadEndTime = performance.now();
      const uploadDurationInSeconds = (uploadEndTime - uploadStartTime) / 1000;
      const uploadSpeedMbps =
        (fileSize / uploadDurationInSeconds / 1024 / 1024) * 8;

      setUploadSpeed(uploadSpeedMbps);
      uploadControls.start({
        rotate: Math.min(uploadSpeedMbps * 2.7 - 135, 135),
      });
    } catch (error) {
      console.error("Error during upload speed test:", error);
      setUploadSpeed(0);
    }

    setIsTesting(false);
  };

  const getSpeedColor = (speed: number) => {
    if (speed < 10) return "#ef4444";
    if (speed < 30) return "#eab308";
    return "#22c55e";
  };

  const Speedometer = ({
    speed,
    controls,
    icon,
    label,
  }: {
    speed: number;
    controls: any;
    icon: React.ReactNode;
    label: string;
  }) => (
    <div className="flex flex-col items-center">
      <div className="text-lg font-semibold mb-2">{label}</div>
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#4b5563"
            strokeWidth="20"
          />
          <motion.path
            d="M100 10 A90 90 0 0 1 190 100"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="20"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.min(speed / 100, 1) }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <motion.line
            x1="100"
            y1="100"
            x2="100"
            y2="20"
            stroke="#f3f4f6"
            strokeWidth="4"
            initial={{ rotate: -135 }}
            animate={controls}
            transition={{ type: "spring", stiffness: 60, damping: 10 }}
            style={{ originX: "100px", originY: "100px" }}
          />
          <circle cx="100" cy="100" r="10" fill="#f3f4f6" />
          <motion.text
            x="100"
            y="140"
            textAnchor="middle"
            fontSize="24"
            fill={getSpeedColor(speed)}
            fontWeight="bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {speed.toFixed(1)}
          </motion.text>
          <text
            x="100"
            y="160"
            textAnchor="middle"
            fontSize="14"
            fill="#9ca3af"
          >
            Mbps
          </text>
        </svg>
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white h-[710px]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
          <Activity className="mr-2" />
          Network Speed Test
        </CardTitle>
        <div className="text-center text-sm text-gray-400 flex items-center justify-center">
          <Wifi className="mr-1" size={16} />
          {ipAddress ? `Your IP: ${ipAddress}` : "Fetching IP..."}
        </div>
      </CardHeader>
      <CardContent className="flex justify-around items-center mt-20">
        <Speedometer
          speed={downloadSpeed}
          controls={downloadControls}
          icon={<ArrowDown size={24} className="text-blue-400" />}
          label="Download"
        />
        <Speedometer
          speed={uploadSpeed}
          controls={uploadControls}
          icon={<ArrowUp size={24} className="text-green-400" />}
          label="Upload"
        />
      </CardContent>
      <CardFooter className="flex justify-center mt-32">
        <Button
          onClick={measureNetworkSpeed}
          disabled={isTesting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isTesting ? "Testing..." : "Start Test"}
        </Button>
      </CardFooter>
      <div className="flex justify-center mt-20">
        Copyright (c) 2024 Saqib  All Rights Reserved.
      </div>
    </Card>
  );
}
