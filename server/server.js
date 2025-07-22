const express = require('express');
const puppeteer = require('puppeteer');
const { authenticator } = require('otplib');
const path = require('path');
const app = express();
app.use(express.json());
require('dotenv').config();

const NAME_SEL       = '#configurenew\\:j_id1\\:blockNew\\:j_id9\\:nameSectionItem\\:editName';
const CODE_SEL       = '#configurenew\\:j_id1\\:blockNew\\:j_id9\\:codeSectionItem\\:editIsoCode';
const ACTIVE_SEL     = '#configurenew\\:j_id1\\:blockNew\\:j_id9\\:activeSectionItem\\:editActive';
const VISIBLE_SEL    = '#configurenew\\:j_id1\\:blockNew\\:j_id9\\:visibleSectionItem\\:editVisible';
const SAVE_BTN_SEL   = '#configurenew\\:j_id1\\:blockNew\\:j_id43\\:addButton'; // confirm in DOM


async function clearAndType(page, selector, text) {
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.$eval(selector, el => { el.value = ''; });
  await page.type(selector, text);
}

async function ensureChecked(page, selector) {
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.$eval(selector, el => { if (!el.checked) el.click(); });
}

app.post('/add-state', async (req, res) => {
  const body = req.body;

  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Navigating to Salesforce login page...');
    await page.goto(process.env.SF_LOGIN);
    await page.type('#username', process.env.SF_USERNAME);
    await page.type('#password', process.env.SF_PASSWORD);
    await page.click('#Login');
    await page.waitForNavigation();

    const mfaExists = await page.$('#tc');
    if (mfaExists) {
        console.log('MFA required, entering OTP...');
        const token = authenticator.generate(process.env.SF_OTP_SEED);
        await page.type('#tc', token);
        await page.click('#save'); // or the confirm button
        await page.waitForNavigation();
    }

    console.log('login succesfull');

    for(let element of body) {
        const { countryIso, stateIso, stateName } = element;

        const newUrl = `${process.env.SF_DOMAIN}/i18n/ConfigureNewState.apexp?countryIso=${encodeURIComponent(countryIso)}`;
        console.log('Opening state page…', newUrl);
        console.log('Opening state page...');

        await page.goto(newUrl, { waitUntil: 'domcontentloaded' });

        console.log('Filling fields…', stateName, stateIso);
        await clearAndType(page, NAME_SEL, stateName);
        await clearAndType(page, CODE_SEL, stateIso);
        await ensureChecked(page, ACTIVE_SEL);
        await ensureChecked(page, VISIBLE_SEL);
    
        console.log('Submitting…');
        const [nav] = await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(err => {
                console.warn('Navigation after save did not complete:', err.message);
                return null;
            }),
            page.click(SAVE_BTN_SEL),
        ]);
    }
    console.log('Deploy completed successfully');
    // await browser.close();
    res.json({ status: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', error: error.toString() });
  }
});

app.post('/otp-generator', async (req, res) => {
    console.log('Generating OTP...', process.env.SF_OTP_SEED);
  try {
    console.log('Generating OTP...');
    const token = authenticator.generate(process.env.SF_OTP_SEED);
    console.log('Generated OTP:', token);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', error: error.toString() });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

app.listen(3000, () => console.log('Server running on port 3000'));
