import { Resend } from "resend"
import type { ReactElement } from "react"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@caushun.io"

interface MailParams {
  to: string
  subject: string
  react: ReactElement
}

export async function sendMail({ to, subject, react }: MailParams) {
  const { error } = await resend.emails.send({ from: FROM, to, subject, react })
  if (error) throw new Error(error.message)
}
