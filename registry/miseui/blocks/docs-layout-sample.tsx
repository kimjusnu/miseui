import type * as React from "react"
import type { DocsGroup } from "./docs-layout-state"

function Term({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1 font-mono text-[13px]">{children}</code>
}

const CURL_INVOICE = `curl https://api.paperline.example/v1/invoices \\
  -H "Authorization: Bearer pl_test_example" \\
  -d customer=cus_example \\
  -d amount=128000`

const SDK_SETUP = `import { Paperline } from "paperline"

const client = new Paperline(process.env.PAPERLINE_KEY)`

const CREATE_INVOICE = `const invoice = await client.invoices.create({
  customer: "cus_example",
  amount: 128000,
  dueInDays: 14,
})`

const INVOICE_JSON = `{
  "id": "inv_example",
  "status": "open",
  "amount": 128000,
  "hostedUrl": "https://pay.paperline.example/inv_example"
}`

const WEBHOOK_HANDLER = `export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("paperline-signature")
  const event = client.webhooks.verify(body, signature)
  return new Response(null, { status: 200 })
}`

/** Every key, id and amount here is an example; none of it reaches a real service. */
const SAMPLE_GROUPS: readonly DocsGroup[] = [
  {
    label: "Get started",
    pages: [
      {
        id: "quick-start",
        title: "Quick start",
        lead: "Send your first invoice in about five minutes.",
        sections: [
          {
            id: "quick-start-install",
            title: "Install the library",
            body: <p>Add the package to your project. It works in Node 20 and later, and in any runtime with a standard fetch.</p>,
            code: { title: "Terminal", code: "npm install paperline", language: "bash" },
          },
          {
            id: "quick-start-client",
            title: "Create a client",
            body: <p>Read the key from your environment, so it never lands in your repository. Test keys start with <Term>pl_test_</Term> and never move real money.</p>,
            code: { title: "client.ts", code: SDK_SETUP, language: "ts" },
          },
          {
            id: "quick-start-invoice",
            title: "Send an invoice",
            body: <p>Amounts are in the smallest unit of the currency, so 128000 means 1,280.00. The customer gets an email with a link to pay.</p>,
            code: { title: "send.ts", code: CREATE_INVOICE, language: "ts" },
          },
          {
            id: "quick-start-next",
            title: "Where to go next",
            body: <p>Keep the invoice id. You will need it to read the status, and webhooks use it to tell you when the invoice is paid.</p>,
          },
        ],
      },
      {
        id: "authentication",
        title: "Authentication",
        lead: "One key per environment, sent as a bearer token.",
        sections: [
          {
            id: "authentication-keys",
            title: "Test and live keys",
            body: <p>A test key only reaches test data. Create a live key once you are ready, and keep the two in separate environments.</p>,
          },
          {
            id: "authentication-request",
            title: "Sending a request",
            body: <p>Put the key in the <Term>Authorization</Term> header. A request without one gets a 401 and nothing else happens.</p>,
            code: { title: "Terminal", code: CURL_INVOICE, language: "bash" },
          },
        ],
      },
    ],
  },
  {
    label: "Guides",
    pages: [
      {
        id: "invoices",
        title: "Invoices",
        lead: "What an invoice holds, and the states it moves through.",
        sections: [
          {
            id: "invoices-object",
            title: "The invoice object",
            body: <p>Status starts at <Term>open</Term> and moves to <Term>paid</Term> or <Term>void</Term>. The hosted link stays valid until then.</p>,
            code: { title: "Response", code: INVOICE_JSON, language: "json" },
          },
          {
            id: "invoices-reminders",
            title: "Reminders",
            body: <p>By default a reminder goes out three days before the due date and again on the day. Turn either off per invoice.</p>,
          },
        ],
      },
      {
        id: "webhooks",
        title: "Webhooks",
        lead: "Hear about a payment without asking for it.",
        sections: [
          {
            id: "webhooks-receive",
            title: "Receive an event",
            body: <p>Verify the signature before you trust the body, then answer quickly with a 200. Do slow work after the response.</p>,
            code: { title: "route.ts", code: WEBHOOK_HANDLER, language: "ts" },
          },
          {
            id: "webhooks-retries",
            title: "Retries",
            body: <p>An event that does not get a 200 is sent again, up to five times over a day. The same event can arrive twice, so treat the id as the key.</p>,
          },
        ],
      },
    ],
  },
]

export { SAMPLE_GROUPS }
