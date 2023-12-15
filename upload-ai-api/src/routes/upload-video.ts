import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { fastifyMultipart } from "@fastify/multipart";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { pipeline as pump } from "node:stream/promises";

export async function uploadVideoRoute(app: FastifyInstance) {
    app.register(fastifyMultipart, {
        limits: {
            fileSize: 1048576 * 25, // 25MB
        },
    });

    app.post("/videos", async (req, res) => {
        console.log("HELLO");
        const data = await req.file();
        // console.log("DATA", data);

        if (!data) {
            return res.status(400).send({
                error: "No file uploaded",
            });
        }

        const extension = path.extname(data.filename);

        if (extension !== ".mp3") {
            return res.status(400).send({
                error: "Invalid file type",
            });
        }

        const fileBaseName = path.basename(data.filename, extension);
        const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`;

        const uploadDir = path.resolve(__dirname, "../../tmp", fileUploadName);
        console.log(uploadDir);
        await pump(data.file, fs.createWriteStream(uploadDir));

        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: uploadDir,
            },
        });

        return { video };
    });
}
