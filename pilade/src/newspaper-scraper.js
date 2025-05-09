import { humanReadableDate, parseLocaleDate } from './date.js'
import { chromium, devices } from 'playwright'

const waitUntil = 'domcontentloaded'

const login = async ({ username, password, headless = 'true' }) => {
  const browser = await chromium.launch({
    headless: JSON.parse(headless),
    args: ['--no-sandbox', '--disable-web-security', '--disable-gpu'],
  })

  const { deviceScaleFactor, hasTouch, isMobile, userAgent, viewport } =
    devices['Desktop Chrome']

  const context = await browser.newContext({
    acceptDownloads: true,
    bypassCSP: true,
    deviceScaleFactor,
    hasTouch,
    ignoreHTTPSErrors: true,
    isMobile,
    javaScriptEnabled: true,
    locale: 'it-IT',
    serviceWorkers: 'allow',
    timezoneId: 'Europe/Rome',
    userAgent,
    viewport,
  })

  const page = await context.newPage()

  await page.goto('https://shop.ilfattoquotidiano.it/login', { waitUntil })

  const cookieConsent = page.locator('a').getByText(/Accetta e chiudi/i)
  await cookieConsent.click()
  await cookieConsent.waitFor({ state: 'hidden' })

  await page.locator('input[name="username"]').fill(username)
  await page.locator('input[name="password"]').fill(password)
  await page.locator('button[name="login"]').click()

  try {
    await page.waitForURL('https://shop.ilfattoquotidiano.it', {
      waitUntil,
      timeout: 10_000,
    })
  } catch (error) {
    console.warn(`An error occurred during page reload after login: ${error}`)
  }

  return { browser, context, page }
}

export const scrapeNewspaper = async opts => {
  const { browser, context, page } = await login(opts)

  await page.goto('https://www.ilfattoquotidiano.it/in-edicola/', { waitUntil })

  await page.$$eval('#podcast-home', elements => {
    elements.forEach(e => e.remove())
  })

  const articleLinkSelector = [
    '.ifq-card-direttore__article-title a',
    '.ifq-news-spotlight__title a',
    '.ifq-news-aside__title a',
    'ifq-news-spotlight__eyelet + a',
  ].join(', ')

  const articlesUrl = await page
    .locator(articleLinkSelector)
    .evaluateAll(links => links.map(e => e.href))

  const body = page.locator('body')
  const bodyId = await body.getAttribute('id')
  const bodyClass = await body.getAttribute('class')

  const stylesElem = await page
    .locator('head style, link[as="style"]')
    .evaluateAll(elements =>
      elements.map(elem => {
        return elem.tagName === 'STYLE'
          ? { style: elem.innerText }
          : { href: elem.getAttribute('href') }
      })
    )

  const stylesheets = await Promise.all(
    stylesElem.map(async elem => {
      if (typeof elem.style === 'string') {
        return elem.style
      }

      const resp = await fetch(elem.href)
      return resp.text()
    })
  )

  const articles = []

  for (const url of articlesUrl) {
    try {
      const articleData = await scrapeArticle(page, url)
      articles.push(articleData)
    } catch (msg) {
      console.error(msg)
    }
  }

  await context.close()
  await browser.close()

  const separator = '\n'

  return `
  <!DOCTYPE html>

  <html lang="it-IT">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    ${stylesheets.map(css => `<style>${css}</style>`).join('')}

    <title>Il Fatto Quotidiano, ${humanReadableDate}</title>
  </head>

  <body id="${bodyId}" class="${bodyClass}">
    <div class="ifq-main-wrapper" style="margin-top: 0rem">
      <main class="ifq-main">
        <section
          class="ifq-main-content main-container"
          data-el="ifq-main-content"
        >
        ${articles
          .sort((a1, a2) => a2.timestamp - a1.timestamp)
          .map(art => art.html)
          .join(separator)}
        </section>
      </main>
    </div>
  </body>

  </html>
  `
}

const elementsToRemove = [
  '.ifq-post__info',
  '.ifq-post__last-update',
  '.ifq-post__thumbnail',
  '.ifq-author-header__date',
  '.ifq-post__discussion',
  '.ifq-post__audio',
  '.ifq-post__utils',
  '.ifq-post__footer',
].join(', ')

const articleContentSelector = '.ifq-post'

const scrapeArticle = async (page, url) => {
  await page.goto(url, { waitUntil })

  await page.locator(articleContentSelector).waitFor()

  await page.$$eval(elementsToRemove, elements => {
    elements.forEach(e => e.remove())
  })

  await page.$$eval('img', inlineImages)

  const entryDate = await page.locator('.entry-date').textContent()
  const html = await page.locator(articleContentSelector).innerHTML()
  const timestamp = parseLocaleDate(entryDate)?.getTime() ?? 0

  return { html, timestamp }
}

const inlineImages = async elements => {
  for (const img of elements) {
    try {
      const { protocol } = new URL(img.src)
      const isProtocolHttp = ['http:', 'https:'].includes(protocol)

      if (!isProtocolHttp) {
        continue
      }
    } catch {
      continue
    }

    const resp = await fetch(img.src)
    const blob = await resp.blob()

    await new Promise(resolve => {
      const reader = new FileReader()

      reader.onloadend = () => {
        img.src = reader.result
        resolve()
      }

      reader.onerror = () => {
        img.remove()
        resolve()
      }

      reader.readAsDataURL(blob)
    })
  }
}
