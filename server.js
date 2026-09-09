const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const app = express();

const upload = multer({
   dest: "/tmp/uploads/"
});

app.get("/", (req, res) => {
   res.json({
      success: true,
      message: "FFmpeg server is running"
   });
});

app.post("/convert/video", upload.single("file"), (req, res) => {
   if (!req.file) {
      return res.status(400).json({
         success: false,
         message: "Video file is required"
      });
   }

   const id = crypto.randomUUID();

   const input = req.file.path;
   const output = `/tmp/${id}.mp4`;

   const inputFilename = req.file.originalname;
   const outputFilename = path.basename(inputFilename, path.extname(inputFilename)) + ".mp4";

   execFile(
      "ffmpeg",
      [
         "-y",
         "-i", input,

         "-c:v", "libx264",
         "-preset", "medium",
         "-crf", "23",

         "-c:a", "aac",
         "-b:a", "128k",

         "-pix_fmt", "yuv420p",
         "-movflags", "+faststart",

         output
      ],
      (error, stdout, stderr) => {
         fs.unlink(input, () => { });

         if (error) {
            return res.status(500).json({
               success: false,
               message: "FFmpeg conversion failed",
               error: stderr
            });
         }

         res.download(
            output,
            outputFilename,
            {
               headers: {
                  "Content-Type": "video/mp4"
               }
            },
            () => {
               fs.unlink(output, () => { });
            }
         );
      }
   );
});

app.post("/convert/audio", upload.single("file"), (req, res) => {
   if (!req.file) {
      return res.status(400).json({
         success: false,
         message: "Audio file is required"
      });
   }

   const id = crypto.randomUUID();

   const input = req.file.path;
   const output = `/tmp/${id}.ogg`;

   const inputFilename = req.file.originalname;
   const outputFilename = path.basename(inputFilename, path.extname(inputFilename)) + ".ogg";

   execFile("ffmpeg",
      [
         "-y",
         "-i", input,

         "-vn",
         "-c:a", "libopus",
         "-b:a", "32k",
         "-ar", "48000",
         "-ac", "1",
         "-f", "ogg",

         output
      ], (error, stdout, stderr) => {
         fs.unlink(input, () => { });

         if (error) {
            return res.status(500).json({
               success: false,
               message: "Audio conversion failed",
               error: stderr
            });
         }

         res.download(
            output,
            outputFilename,
            {
               headers: {
                  "Content-Type": "audio/ogg"
               }
            },
            () => {
               fs.unlink(output, () => { });
            }
         );
      });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
   console.log(`FFmpeg server running on port ${PORT}`);
});