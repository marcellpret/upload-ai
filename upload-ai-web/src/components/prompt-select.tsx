import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

interface Prompt {
    id: string;
    title: string;
    template: string;
}

interface PromptSelectProps {
    onPromptSelect: (template: string) => void;
}

export default function PromptSelect({ onPromptSelect }: PromptSelectProps) {
    const [prompts, setPrompts] = useState<Prompt[] | null>(null);

    useEffect(() => {
        fetch("http://localhost:3333/prompts")
            .then((res) => res.json())
            .then((data) => {
                console.log("DATA: ", data);
                setPrompts(data);
            });
    }, []);

    function handlePromptSelect(promptId: string) {
        const prompt = prompts?.find((prompt) => prompt.id === promptId);

        if (!prompt) return;

        onPromptSelect(prompt.template);
    }

    return (
        <Select onValueChange={handlePromptSelect}>
            <SelectTrigger>
                <SelectValue placeholder="Selecione um prompt..." />
            </SelectTrigger>
            <SelectContent>
                {prompts?.map((prompt) => (
                    <SelectItem value={prompt.id} key={prompt.id}>
                        {prompt.title}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
