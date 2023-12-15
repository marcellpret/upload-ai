import "dotenv/config";
import { OpenAI } from "openai";

export const openai = new OpenAI({
    organization: process.env.OPENAI_ORG,
    apiKey: process.env.OPENAI_KEY,
});
