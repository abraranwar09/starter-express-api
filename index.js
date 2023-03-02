const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const Q = require('q');
var searchTerm = '';
let products = [];

async function scrapeProducts(url) {
    products = [];
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'load', timeout: 0});

    // Wait for the product grid to load
    await page.waitForSelector('.product__listing');

    // Get the product elements
    const productElements = await page.$$('.product__list--item');
    console.log(productElements.length);
    // Extract the name and price for each product
    for (const el of productElements) {
        const name = await el.$eval('.product-desc h3', el => el.textContent.trim());
        // get image source
        const img = await el.$eval('.js-gtm-product-link img', el => el.src);
        const price = await el.$eval('.product-price', el => el.textContent.trim());
        products.push({ name, img, price });
        if (products.length > 10) break;
    }

    await browser.close();
    return products;
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

app.get('/', (req, res) => {
    const fullUrl = `${req.protocol}://${req.headers.host}${req.url}`;
    const currentUrl = new URL(fullUrl);
    const search_params = currentUrl.searchParams;
    var query = search_params.get('q');
    console.log(query);
    if (query) {
        searchTerm = query;
        scrapeProducts('https://www.luluhypermarket.com/en-ae/search/?text=' + searchTerm)
            .then(products => {
                console.log(products);
                res.json(products);
            })
            .catch(error => console.error(error));
    } else {
        res.json(products);
    }
});
