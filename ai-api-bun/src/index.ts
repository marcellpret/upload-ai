import { Hono } from "hono";
import { prisma } from "./lib/prisma";
import { randomUUID } from "crypto";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => {
    return c.json({ message: "Hello Bun!" });
});

app.get("/prompts", async (c) => {
    const prompts = await prisma.prompt.findMany();
    return c.json(prompts);
});

app.post("/videos", async (c) => {
    console.log("HELLO");
    const data = await c.req.formData();
    console.log(data);
    const audio = data.get("file");
    const videoName = data.get("video_name");

    const filename = `${videoName}-${randomUUID()}.mp3`;
    const path = `./tmp/${filename}`;
    const extension = await Bun.write(path, audio!);

    const video = await prisma.video.create({
        data: {
            name: videoName as string,
            path: path,
        },
    });

    return c.json({ video });
}).get("/videos", async (c) => {
    const videos = await prisma.video.findMany();
    return c.json(videos);
});

const port = parseInt(process.env.PORT!) || 3333;
console.log(`Running at http://localhost:${port}`);

export default {
    port,
    fetch: app.fetch,
};
