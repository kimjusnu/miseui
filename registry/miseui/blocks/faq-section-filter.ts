import type * as React from "react"

interface FaqItem {
  id: string
  question: string
  answer: React.ReactNode
  /** Extra words to match on `search`, such as "refund" on a question about cancelling. Needed when `answer` is not plain text. */
  keywords?: string
}

function searchableText(item: FaqItem) {
  const answer = typeof item.answer === "string" ? item.answer : ""
  return `${item.question} ${answer} ${item.keywords ?? ""}`.toLocaleLowerCase()
}

/** Every word has to appear somewhere, in any order: people type "cancel refund", not the wording of the question. */
function filterFaq(items: readonly FaqItem[], query: string): readonly FaqItem[] {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return items
  return items.filter((item) => {
    const text = searchableText(item)
    return words.every((word) => text.includes(word))
  })
}

function faqCountLabel(shown: number, total: number) {
  const noun = total === 1 ? "question" : "questions"
  return shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`
}

export { faqCountLabel, filterFaq, type FaqItem }
