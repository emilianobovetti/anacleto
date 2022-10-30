import { humanReadableDate, parseLocaleDate } from './date.js'
import puppeteer from 'puppeteer'

const login = async ({ username, password }) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  })

  const page = await browser.newPage()

  await page.goto('https://shop.ilfattoquotidiano.it/login')

  const cookieConsent = 'a.cl-consent__btn[data-role="b_agree"]'
  await page.waitForSelector(cookieConsent).then(e => e.click())
  await page.waitForSelector(cookieConsent, { hidden: true })

  await page.$('input[name="username"]').then(e => e.type(username))
  await page.$('input[name="password"]').then(e => e.type(password))
  await page.click('button[name="login"]')
  await page.waitForNavigation({ waitUntil: 'networkidle0' })

  return { browser, page }
}

export const scrapeNewspaper = async credentials => {
  const { browser, page } = await login(credentials)

  await page.goto('https://www.ilfattoquotidiano.it/in-edicola')
  await page.waitForNetworkIdle()

  const articleLinkSelector = `
  .box-direttore .box-direttore-article-title a,
  .article-preview h2 a
  `

  const articlesUrl = await page.$$eval(articleLinkSelector, links =>
    links.map(e => e.href)
  )

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

  const articles = []

  for (const url of articlesUrl) {
    try {
      await page.goto(url)
      await page.waitForSelector(contentSelector)
      await page.$$eval(cleanSelector, elements => {
        elements.forEach(e => e.remove())
      })

      const date = await page.$eval('.date', node => node.textContent)
      const html = await page.$eval(contentSelector, node => node.innerHTML)

      articles.push({ html, timestamp: parseLocaleDate(date)?.getTime() ?? 0 })
    } catch (msg) {
      console.error(msg)
    }
  }

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
