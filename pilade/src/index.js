import { basename, join } from 'path'
import { humanReadableDate, isoDate } from './date.js'
import { mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs'
import { scrapeNewspaper } from './newspaper-scraper.js'
import { spawnSync } from 'child_process'
import { uniqueString } from './random.js'
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

const tmp = join('/tmp', `pilade-${uniqueString()}`)
const htmlFilename = join(tmp, `newspaper-${isoDate}.html`)
const epubFilename = join(tmp, `newspaper-${isoDate}.epub`)

mkdirSync(tmp)
writeFileSync(htmlFilename, htmlContent)

const { status, error, stderr } = spawnSync('ebook-convert', [
  htmlFilename,
  epubFilename,
])

if (status !== 0) {
  if (error != null) {
    console.error(error)
  }

  if (stderr != null) {
    process.stderr.write(stderr)
  }

  rmSync(tmp, { recursive: true, force: true })
  process.exit(EX_SOFTWARE)
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: 465,
  secure: true,
  auth: {
    user: smtpUsername,
    pass: smtpPassword,
  },
})

const email = {
  from: `Ser Pilade <${smtpUsername}>`,
  to: recipients,
  subject: `Il Fatto Quotidiano, ${humanReadableDate}`,
  html: htmlContent,
  attachments: [
    {
      filename: basename(epubFilename),
      encoding: 'utf-8',
      contentType: 'application/epub+zip',
      contentTransferEncoding: 'base64',
      contentDisposition: 'attachment',
      content: readFileSync(epubFilename),
    },
  ],
}

try {
  await transporter.sendMail(email)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
