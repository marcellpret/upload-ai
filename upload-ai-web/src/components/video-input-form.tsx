import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { FileVideo, Upload } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

type Status = "waiting" | "converting" | "uploading" | "generating" | "done";

const statusMessages = {
    converting: "Convertendo...",
    uploading: "Enviando...",
    generating: "Gerando a transcrição...",
    done: "Video carregado",
};

interface VideoInputFormProps {
    onVideoUpload: (id: string) => void;
}

export default function videoInputForm({ onVideoUpload }: VideoInputFormProps) {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [status, setStatus] = useState<Status>("waiting");

    const promptInputRef = useRef<HTMLTextAreaElement>(null);

    async function convertVideoToAudio(video: File) {
        console.log("Start converting video to audio");
        // converter o video para audio
        const ffmpeg = await getFFmpeg();

        await ffmpeg.writeFile("input.mp4", await fetchFile(video));

        // ffmpeg.on("log", (message) => console.log(message));

        ffmpeg.on("progress", (progress) => {
            console.log(
                `Convert progress: ${Math.round(progress.progress * 100)}`
            );
        });

        await ffmpeg.exec([
            "-i",
            "input.mp4",
            "-map",
            "0:a",
            "-b:a",
            "20k",
            "-acodec",
            "libmp3lame",
            "output.mp3",
        ]);

        const data = await ffmpeg.readFile("output.mp3");

        const audioFileBlob = new Blob([data], { type: "audio/mp3" });

        const audioFile = new File([audioFileBlob], "audio.mp3", {
            type: "audio/mp3",
        });

        console.log("Converted audio file");

        return audioFile;
    }

    async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        console.log("Hey there");

        const prompt = promptInputRef.current?.value;

        if (!videoFile) return;

        setStatus("converting");

        // converter o video para audio
        const audioFile = await convertVideoToAudio(videoFile);

        console.log(audioFile);

        const formData = new FormData();

        formData.append("file", audioFile);
        formData.append("video_name", videoFile.name);

        setStatus("uploading");

        const saveVideo = await fetch("http://localhost:3333/videos", {
            method: "POST",
            body: formData,
        });

        const videoSaved = await saveVideo.json();

        const videoId = videoSaved.video.id;

        setStatus("generating");

        const saveTranscription = await fetch(
            `http://localhost:3333/videos/${videoId}/transcription`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                }),
            }
        );

        setStatus("done");
        onVideoUpload(videoId);
    }

    function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
        const { files } = event.currentTarget;

        if (!files) return;

        const file = files[0];

        setVideoFile(file);
    }

    const previewURL = useMemo(() => {
        if (!videoFile) return null;
        return URL.createObjectURL(videoFile);
    }, [videoFile]);

    return (
        <form className="space-y-6" onSubmit={handleUploadVideo}>
            <label
                htmlFor="video"
                className="relative border flex rounded-md aspect-video cursor-pointer border-dash text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/10"
            >
                {previewURL ? (
                    <video
                        src={previewURL}
                        controls={false}
                        className="pointer-events-none absolute inset-0"
                    />
                ) : (
                    <>
                        <FileVideo className="w-8 h-8" />
                        Selecione um video
                    </>
                )}
            </label>
            <input
                type="file"
                name="video"
                id="video"
                accept="videp/mp4"
                className="sr-only"
                onChange={handleFileSelected}
            />

            <Separator />

            <div className="space-y-2">
                <Label htmlFor="transcription_prompt">
                    Prompt de transcrição
                </Label>
                <Textarea
                    id="transcription_prompt"
                    className="h-20 leading-relaxed"
                    placeholder="Inclua palavras-chave mencionadas no video separadas por vírgula (,)"
                    ref={promptInputRef}
                    disabled={status !== "waiting"}
                />
            </div>
            <Button
                disabled={status !== "waiting"}
                type="submit"
                data-success={status === "done"}
                className="w-full data-[success=true]:bg-emerald-400"
            >
                {status === "waiting" ? (
                    <>
                        Carregar o video
                        <Upload className="w-4 h-4 ml-2" />
                    </>
                ) : (
                    statusMessages[status]
                )}
            </Button>
        </form>
    );
}
