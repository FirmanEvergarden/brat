import express from 'express';
import { chromium } from 'playwright';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import sharp from 'sharp';

dotenv.config();

const config = {
    maxTextLength: 100,
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const utils = {
    async createBrowserInstance() {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: config.viewport,
            userAgent: config.userAgent
        });

        await context.route('**/*', (route) => {
            const url = route.request().url();
            if (url.endsWith('.png') || url.endsWith('.jpg') || url.includes('google-analytics')) {
                return route.abort();
            }
            route.continue();
        });

        const page = await context.newPage();
        await page.goto('https://www.bratgenerator.com/', { waitUntil: 'domcontentloaded', timeout: 10000 });

        try {
            await page.click('#onetrust-accept-btn-handler', { timeout: 2000 });
        } catch { }

        await page.evaluate(() => setupTheme('white'));
        
        return { browser, page };
    },

    async generateBrat(text) {
        const { browser, page } = await this.createBrowserInstance();
        
        try {
            await page.fill('#textInput', text);
            const overlay = page.locator('#textOverlay');
            
            // Take screenshot
            const pngBuffer = await overlay.screenshot({ 
                timeout: 3000,
                type: 'png'
            });
            
            // Convert to WebP
            return await sharp(pngBuffer)
                .webp({ quality: 80 })
                .toBuffer();
        } finally {
            await browser.close();
        }
    }
};

const app = express();
app.use(express.json());
app.use(cors());

app.get('*', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json({
                name: 'HD Bart Generator API',
                message: 'Parameter q diperlukan',
                version: '2.1.0',
                runtime: {
                    os: os.type(),
                    platform: os.platform(),
                    architecture: os.arch(),
                    cpuCount: os.cpus().length,
                    uptime: `${os.uptime()} seconds`,
                    memoryUsage: `${Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)} MB used of ${Math.round(os.totalmem() / 1024 / 1024)} MB`
                }
            });
        }
        const imageBuffer = await utils.generateBrat(q);
        res.set('Content-Type', 'image/webp');
        res.send(imageBuffer);
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error generating image',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

const PORT = process.env.PORT || 7860;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});