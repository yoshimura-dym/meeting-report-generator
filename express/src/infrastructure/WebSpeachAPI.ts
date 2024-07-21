declare global {
    interface Window {
        startRecognition: () => Promise<string>;
    }
}

import * as puppeteer from 'puppeteer';

export interface IWebSpeechAPI {
    buildBrowser(): Promise<void>;
    translateMP3toText(filepath: string): Promise<string>;
}

export class WebSpeechAPI implements IWebSpeechAPI {
    private browser: puppeteer.Browser | null = null;
    private page: puppeteer.Page | null = null;

    private static readonly RECOGNITION_SCRIPT = `
        async function startRecognition() {
            return new Promise((resolve, reject) => {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognition) {
                    reject(new Error('Web Speech API is not supported in this browser.'));
                    return;
                }

                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    resolve(transcript);
                };

                recognition.onerror = (event) => {
                    reject(event.error);
                };

                recognition.start();
            });
        }

        window.startRecognition = startRecognition;
    `;

    private static getHTMLContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Speech Recognition</title>
            </head>
            <body>
                <script>
                ${WebSpeechAPI.RECOGNITION_SCRIPT}
                </script>
            </body>
            </html>
        `;
    }

    async buildBrowser(): Promise<void> {
        try {
            this.browser = await puppeteer.launch({ headless: false });
            this.page = await this.browser.newPage();
            await this.page.setContent(WebSpeechAPI.getHTMLContent());
        } catch (error) {
            throw new Error(`Failed to build browser: ${error}`);
        }
    }

    async translateMP3toText(filepath: string): Promise<string> {
        this.ensureBrowserInitialized();

        try {
            return await this.page!.evaluate(this.evaluateAudioRecognition, filepath);
        } catch (error) {
            throw new Error(`Failed to translate MP3 to text: ${error}`);
        }
    }

    private ensureBrowserInitialized(): void {
        if (!this.page) {
            throw new Error("Browser not initialized. Call buildBrowser() first.");
        }
    }

    private evaluateAudioRecognition = async (filepath: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            const audio = new Audio(filepath);
            audio.onended = async () => {
                try {
                    const result = await window.startRecognition();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            audio.onerror = (error) => {
                reject(error);
            };
            audio.play();
        });
    };
}