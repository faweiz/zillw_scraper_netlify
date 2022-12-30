const express = require('express');
const serverless = require('serverless-http');

const puppeteer = require('puppeteer-core');
const chromium = require("@sparticuz/chromium");
const dotenv = require("dotenv").config();

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







//router.get('/puppeteer', (req, res) => {
    router.get('/properties/v2/list-for-sale/', async (req, res, next) => {

    let address_parm = [], properties = [];
    var sdata = "", west = "", east = "", south = "", north = "";
    if(req.query.city && req.query.state_code){
        const address_city = req.query.city;
        const address_state = req.query.state_code;
        address_parm = `${address_city}-${address_state}`;
    }else if(req.query.zipcode){
        const address_zipcode = req.query.zipcode;
        address_parm = address_zipcode;
    }
    
    const key = process.env.GOOGLE_API_KEY;
    console.log(key);
    try {
        console.log(`Getting Zillow data`);
        (async() =>{
            




            const browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
                headless: true,
            });
            
            const page = await browser.newPage();
            
            await page.goto('https://spacejelly.dev/');
            
            const title = await page.title();
            const description = await page.$eval('meta[name="description"]', element => element.content);
            
            await browser.close();

            console.log(`Done`);

            res.json({
                'status':'Ok',
                 page: {
                        title,
                        description
                    }
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
