const express = require('express');
const serverless = require('serverless-http');

const puppeteer = require('puppeteer-core');
const chromium = require("@sparticuz/chromium");
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const dotenv = require("dotenv").config();
const https = require("https");

// Create an instance of the Express app
const app = express();
// Create a router to handle routes

const router = express.Router();

const baseUrl = 'https://www.zillow.com/homes'

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
            // Get GPS coordinates from Google Map API
            function httprequest(address_value) {
                return new Promise((resolve, reject) => {
                    const options = {
                        "hostname": "maps.googleapis.com",
                        "port": null,
                        "path": `/maps/api/geocode/json?address=${address_value}&key=${process.env.GOOGLE_API_KEY}`,
                        method: 'GET'
                    };
                    const req = https.request(options, (res) => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                            return reject(new Error('statusCode=' + res.statusCode));
                        }
                        var body = [];
                        res.on('data', function(chunk) {
                            body.push(chunk);
                        });
                        res.on('end', function() {
                            try {
                                body = JSON.parse(Buffer.concat(body).toString());
                            } catch(e) {
                                reject(e);
                            }
                            resolve(body);
                        });
                    });
                    req.on('error', (e) => {
                    reject(e.message);
                    });
                    // send the request
                req.end();
                });
            }
            httprequest().then((data) => {
                const response = {
                    statusCode: 200,
                    body: JSON.stringify(data),
                };
                return response;
            });
            sdata = await httprequest(address_parm);
            west = sdata.results[0].geometry.viewport.southwest.lng;
            east = sdata.results[0].geometry.viewport.northeast.lng;
            south = sdata.results[0].geometry.viewport.southwest.lat;
            north = sdata.results[0].geometry.viewport.northeast.lat;
            console.log("address_parm, west, east, south, north", address_parm, west, east, south, north);


            const params = {
                "pagination":{},
                "usersSearchTerm":"21076",
                "mapBounds":{
                    "west": west,
                    "east": east,
                    "south": south,
                    "north": north
                },
                "regionSelection":[{"regionId":66764,"regionType":7}],
                "isMapVisible":true,
                "filterState":{
                    "sortSelection":{"value":req.query.sort},   // pricea: low -> high, priced: high -> low
                    "isAllHomes":{"value":true},
                    "price":{"min":req.query.price_min,"max":req.query.price_max},
                    "beds":{"min":req.query.beds_min, "max":req.query.beds_max},
                    "baths":{"min":req.query.baths_min, "max":req.query.baths_max},
                    "sqft":{"min":req.query.sqft_min,"max":req.query.sqft_max},
                    "lotSize":{"min":req.query.lotSize_min,"max":req.query.lotSize_max},
                    "built":{"min":req.query.yearbuilt_min, "max":req.query.yearbuilt_max}
                },
                "isListVisible":true,
                "mapZoom":15
            };
            //console.log('params', params);
            const wants = {
                "cat1": ["listResults", "mapResults"], "cat2": ["total"]
            };

            // Puppeteer
            puppeteerExtra.use(pluginStealth());
            const browser = await puppeteerExtra.launch({
                // args: chromium.args,
                args: ['--no-sandbox'],
                executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
                headless: false,
            });
            
            const page = await browser.newPage();
            await page.setViewport({
                width: 1200,
                height: 800
            });
            var url = `${baseUrl}/${address_parm}`;
            console.log(url);
            //await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.goto(url);
            console.log("here 1?");

            const json = await page.evaluate(async (params, wants) => {
                return await new Promise(async (resolve, reject) => {
                    const response = await fetch(`https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=${encodeURIComponent(JSON.stringify(params))}&wants=${encodeURIComponent(JSON.stringify(wants))}&requestId=6`
                    ,{
                            "headers": {
                            "accept": "*/*",
                            "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
                            "cache-control": "no-cache",
                            "pragma": "no-cache",
                            "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"97\", \"Chromium\";v=\"97\"",
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": "\"Windows\"",
                            "sec-fetch-dest": "empty",
                            "sec-fetch-mode": "cors",
                            "sec-fetch-site": "same-origin"
                        },
                        "referrerPolicy": "unsafe-url",
                        "body": null,
                        "method": "GET",
                        "mode": "cors",
                        "credentials": "include"
                    }                    
                    );
                    const json = await response.json();
                    console.log('json', json);

                    return resolve(json);
                });
            }, params, wants);
            console.log("here 2?");
            let mapResults = json?.cat1?.searchResults?.mapResults;
            //console.log('map results', mapResults[22], mapResults?.length);
            console.log(mapResults?.length, "property found");
            let limit = 0;
            if(mapResults?.length > req.query.limit )
                limit = mapResults?.length;
            else limit = req.query.limit;
            for(let index = 0; index < limit; index++)
            {
                properties.push(index, mapResults[index]);
                //console.log('map results', mapResults[index]);
            }
            res.json(properties);

            //await page.screenshot({path: "image.png"});
            await page.close();
            await browser.close();

            
            // await page.goto('https://spacejelly.dev/');
            // const title = await page.title();
            // const description = await page.$eval('meta[name="description"]', element => element.content);
            // await browser.close();
            // res.json({
            //     'status':'Ok',
            //      page: {
            //             title,
            //             description
            //         }
            // });

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
