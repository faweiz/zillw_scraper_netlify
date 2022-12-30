const express = require('express');
const serverless = require('serverless-http');

const puppeteer = require('puppeteer-core');
const chromium = require("@sparticuz/chromium");
const dotenv = require("dotenv").config();
// import dotenv from "dotenv"
// dotenv.config();

// Create an instance of the Express app
const app = express();
// Create a router to handle routes

const router = express.Router();

router.get('/', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<h1>Hello from Express.js!</h1>');
    res.end();
});


router.get('/json', (req, res) => {
    res.json({
        'path':'json',
        'name': "Tony Lee"
    });
});

router.get('/puppeteer', (req, res) => {

    res.json({
        'path':'puppeteer',
        'Message': "Done"
    });
    
    try {
        (async() =>{
            const browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
                headless: false,
            });
            
            const page = await browser.newPage();
            
            await page.goto('https://zillow.com/');
            
            const title = await page.title();
            const description = await page.$eval('meta[name="description"]', element => element.content);
            
            await browser.close();

            console.log(`Done`);

            res.json({
                'path':'puppeteer',
                'Message': "Done"
            });

        })();
    } catch (error) {
        res.json(error);
        console.log(`Error`);
    }




});

// Use the router to handle requests to the `/.netlify/functions/api` path
app.use(`/.netlify/functions/api`, router);

// Export the app and the serverless function
module.exports = app;
module.exports.handler = serverless(app);
