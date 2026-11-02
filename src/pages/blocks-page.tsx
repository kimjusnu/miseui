import { BlockGallery } from "@/src/components/landing/block-gallery"
import { Footer } from "@/src/components/landing/footer"

export function BlocksPage() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <section className="rounded-[28px] bg-background px-4 py-12 md:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="text-display max-w-2xl text-4xl text-balance md:text-5xl">
            Whole screens.
            <span className="text-muted-foreground"> Pick one, copy it, change the words.</span>
          </h1>
          <div className="mt-10">
            <BlockGallery />
          </div>
        </div>
      </section>
      <section className="rounded-[28px] bg-background">
        <Footer />
      </section>
    </div>
  )
}
