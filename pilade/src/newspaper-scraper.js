import { humanReadableDate, parseLocaleDate } from './date.js'
import { chromium, devices } from 'playwright'

const login = async ({ username, password, headless = 'true' }) => {
  const browser = await chromium.launch({
    headless: JSON.parse(headless),
    args: ['--no-sandbox', '--disable-web-security'],
  })

  const context = await browser.newContext(devices['Desktop Chrome'])
  const page = await context.newPage()

  await page.goto('https://shop.ilfattoquotidiano.it/login')

  const cookieConsent = 'a.cl-consent__btn[data-role="b_agree"]'
  await page.locator(cookieConsent).click()

  await page.locator('input[name="username"]').type(username)
  await page.locator('input[name="password"]').type(password)
  await page.locator('button[name="login"]').click()

  return { browser, context, page }
}

export const scrapeNewspaper = async opts => {
  const { browser, context, page } = await login(opts)

  await page.goto('https://www.ilfattoquotidiano.it/in-edicola')

  const articleLinkSelector = `
  .box-direttore .box-direttore-article-title a,
  .article-preview h2 a
  `

  const articlesUrl = await page
    .locator(articleLinkSelector)
    .evaluateAll(links => links.map(e => e.href))

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

  const separator = '\n<hr />\n'

  return `
  <!DOCTYPE html>

  <html lang="it-IT">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="https://www.ilfattoquotidiano.it/wp-content/themes/ifq-extra/css/normalize.css?ver=1666972418132" media="all" />
    <link rel="stylesheet" href="https://www.ilfattoquotidiano.it/wp-content/themes/ifq-extra/css/main.min.css?ver=1666972418132" media="all" />
    <link rel="stylesheet" href="https://www.ilfattoquotidiano.it/wp-content/themes/ifq-extra/css/flickity.min.css?ver=1666972418132" media="all" />

    <title>Il Fatto Quotidiano, ${humanReadableDate}</title>
  </head>

  <body class="ifq-paper-post-template-default single single-ifq-paper-post postid-6855385 single-format-standard no-sidebar">
    <main id="primary" class="site-main">
      ${articles
        .sort((a1, a2) => a2.timestamp - a1.timestamp)
        .map(art => art.html)
        .join(separator)}
    </main>
  </body>

  </html>
  `
}

const cleanSelector = `
.social,
.disquis,
.label-title,
.article-list,
.after-content,
.container-title,
.box-direttore-data,
.title-section.occhiello,
.attachment-post-thumbnail
`

const contentSelector = '.site-main'

const scrapeArticle = async (page, url) => {
  await page.goto(url)
  await page.locator(contentSelector).waitFor()

  await page.$$eval(cleanSelector, elements => {
    elements.forEach(e => e.remove())
  })

  await page.$$eval('img', inlineImages)

  const date = await page.locator('.date').textContent()
  const html = await page.locator(contentSelector).innerHTML()
  const timestamp = parseLocaleDate(date)?.getTime() ?? 0

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

    await new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onloadend = () => {
        img.src = reader.result
        resolve()
      }

      reader.onerror = reject

      reader.readAsDataURL(blob)
    })
  }
}
