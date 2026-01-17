import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    if (!env.GEMINI_API_KEY) {
        console.error(
            "\x1b[31m%s\x1b[0m",
            "Error: GEMINI_API_KEY not found. Please create a .env file with your Gemini API Key."
        );
        console.error(
            "\x1b[33m%s\x1b[0m",
            "Example: GEMINI_API_KEY=your_api_key_here"
        );
        process.exit(1);
    }

    return {
        define: {
            "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
        },
        build: {
            target: "esnext",
        },
        server: {
            port: 5174,
        },
    };
});
