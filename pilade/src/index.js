import { humanReadableDate, isoDate } from './date.js'
import { scrapeNewspaper } from './newspaper-scraper.js'
import { createHash } from 'crypto'
import nodemailer from 'nodemailer'

// Exit codes based on /usr/include/sysexits.h directives

const EX_USAGE = 64
// The command was used incorrectly, e.g., with
//  the wrong number of arguments, a bad flag, a bad
//  syntax in a parameter, or whatever.

const EX_SOFTWARE = 70
// An internal software error has been detected.
//  This should be limited to non-operating system related
//  errors as possible.

const parseEnv = name => {
  const value = process.env[name]

  if (value == null || value.trim().length === 0) {
    console.error(`Missing mandatory variable ${name}`)
    process.exit(EX_USAGE)
  }

  return value
}

const smtpHost = parseEnv('PILADE_SMTP_HOST')
const smtpUsername = parseEnv('PILADE_SMTP_USERNAME')
const smtpPassword = parseEnv('PILADE_SMTP_PASSWORD')
const recipients = parseEnv('PILADE_RECIPIENTS').split(',')

if (recipients == null || recipients.length === 0) {
  console.error('Missing mandatory variable PILADE_RECIPIENTS')
  process.exit(EX_USAGE)
}

const htmlContent = await scrapeNewspaper({
  username: parseEnv('PILADE_NEWSPAPER_USERNAME'),
  password: parseEnv('PILADE_NEWSPAPER_PASSWORD'),
  headless: process.env.PILADE_HEADLESS,
})

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: 465,
  secure: true,
  auth: {
    user: smtpUsername,
    pass: smtpPassword,
  },
})

/*
 * Note: one of `text` or `html` field has to be present.
 * The root message content-type needs to be `multipart/mixed`,
 * but if we don't put a message body here there will be no
 * root multipart and just a single html attachment and it
 * won't be detected by amazon.
 */
const email = {
  from: `Ser Pilade <${smtpUsername}>`,
  to: recipients,
  subject: `Il Fatto Quotidiano, ${humanReadableDate}`,
  text: createHash('sha256').update(htmlContent).digest('hex'),
  attachments: [
    {
      filename: `newspaper-${isoDate}.html`,
      encoding: 'utf-8',
      contentType: 'text/html',
      contentTransferEncoding: 'base64',
      contentDisposition: 'attachment',
      content: htmlContent,
    },
  ],
}

await transporter.sendMail(email)
