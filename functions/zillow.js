// const puppeteer = require('puppeteer-core');
// const chromium = require("@sparticuz/chromium");
// const dotenv = require("dotenv").config();
// // import dotenv from "dotenv"
// // dotenv.config();

// router.get('/puppeteer', (req, res) => {

//     res.json({
//         'path':'puppeteer',
//         'Message': "Done"
//     });
    
//     // try {
//     //     (async() =>{
//     //         const browser = await puppeteer.launch({
//     //             args: chromium.args,
//     //             executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
//     //             headless: false,
//     //         });
            
//     //         const page = await browser.newPage();
            
//     //         await page.goto('https://zillow.com/');
            
//     //         const title = await page.title();
//     //         const description = await page.$eval('meta[name="description"]', element => element.content);
            
//     //         await browser.close();

//     //         console.log(`Done`);

//     //         res.json({
//     //             'path':'puppeteer',
//     //             'Message': "Done"
//     //         });

//     //     })();
//     // } catch (error) {
//     //     res.json(error);
//     //     console.log(`Error`);
//     // }




// });



const puppeteer = require('puppeteer-core');
const chromium = require("@sparticuz/chromium");

const dotenv = require("dotenv").config();


exports.handler = async function(event, context) {
  const browser = await puppeteer.launch({
    // args: chromium.args,
    args: chromium.args,
    executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
    //executablePath: puppeteer.executablePath() || await chromium.executablePath,
    headless: true,
  });

  const page = await browser.newPage();

  //await page.goto('https://zillow.com/');
  await page.goto('https://spacejelly.dev/');

  const title = await page.title();
  const description = await page.$eval('meta[name="description"]', element => element.content);

  await browser.close();

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'Ok',
      page: {
        title,
        description
      }
    })
  };
}