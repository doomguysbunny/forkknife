import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function generateCV(position, company, manager = null) {
    const date = new Date().toLocaleDateString('en-GB');
    const source = "Indeed";
    manager = manager ? `Dear ${manager}` : `Dear ${company}`;

    const header = `780-862-1744 | amcintyr@ualberta.ca\n\n${date}\n\n`;
    const opener = `${manager},\n\nI'm applying to the ${position} position advertised on ${source}. From the posting it’s understood you require someone who is competent and capable. I am the ideal candidate based on my tenacious problem solving, aptitude for learning new things, programming experience, extensive software and hardware testing and education. I graduated from the University of Alberta with a Mathematics Major and Physics Minor in 2020 during the start of Covid-19. In preparation for a career in software development I then taught myself python/bash scripting and the linux operating system.\n\n`;

    const exp = `I've had two software development positions. At Window Mart I was responsible for maintaining the legacy codebase, as well as updating the internal staff website and consumer facing site. I learned considerable web development and improved my python fundamentals. The entire tech team worked in the same office and communication was primarily in person. We had no QA so the superior practice of test driven development happened by the juniors running tests on each other's code. Next I joined the SAAS company Zippedscript where my role focused on automating and refining processes to improve efficiency and reduce duplication of effort. Our product was based on the flask framework and I helped considerably with front end design tasks. I deployed gui and headless debian servers to run selenium grid. This position was fully remote, so I learned to communicate effectively using slack/trello/google meets. At this role self testing code before pushing to github was essential. Since then I have been working in tech support for Teleperformance, helping customers troubleshoot their hardware and software issues with their Apple products.\n\n`;

    const footer = `Thank you for taking the time to consider my application. I'm excited to chat soon about becoming a valued member of your team, contributing to improved accuracy and positive outcomes. Feel free to reach out at any time, I look forward to speaking with you soon.`;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    page.drawText("Alexander McIntyre", {
        x: 50,
        y: 750,
        size: 20,
        color: rgb(0, 0, 0)
    });

    page.drawText(header + opener + exp + footer, {
        x: 50,
        y: 700,
        size: 15,
        color: rgb(0, 0, 0)
    });

    const filename = path.join(process.cwd(), `${company}-${position}-${date.replace(/\//g, '-')}.pdf`);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filename, pdfBytes);

    fs.writeFileSync(`${filename.replace('.pdf', '.txt')}`, header + opener + exp + footer);
}

async function scrapeJobs() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('https://myjobs.indeed.com/saved');

    // Input email
    await page.fill('[name="__email"]', 'amcintyr@ualberta.ca');
    await page.press('[name="__email"]', 'Enter');

    // Uncomment the following lines to input password
    // await page.fill('[name="__password"]', 'your_password_here');
    // await page.press('[name="__password"]', 'Enter');

    // Two-factor authentication (if needed)
    // Uncomment and modify as needed
    // const twofa = await prompt('Enter 2FA: ');
    // await page.fill('[name="passcode"]', twofa);
    // await page.press('[name="passcode"]', 'Enter');

    const allJobs = await page.$$eval('#tabpannel div > ul > li', items => items.length);
    
    for (let i = 1; i <= allJobs; i++) {
        const job = await page.$eval(`#tabpannel > div:nth-child(1) > ul > li:nth-child(${i}) div > div > div:nth-child(2) > div:nth-child(1) > div > header > div:nth-child(1) > a`, el => el.innerText);
        const company = await page.$eval(`#tabpannel > div:nth-child(1) > ul > li:nth-child(${i}) div > div > div:nth-child(2) > div:nth-child(1) > div > header > div:nth-child(2) > span:nth-child(1)`, el => el.innerText);
        
        const cleanedJob = job.split('job description')[0].trim();
        const cleanedCompany = company.split('\n')[0].trim();
        
        await generateCV(cleanedJob, cleanedCompany);
    }

    await browser.close();
}

export async function GET(req) {
    try {
        await scrapeJobs();
        return NextResponse.json({ success: true, message: 'CVs generated successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'An error occurred while generating CVs.' }, { status: 500 });
    }
}
