// Using regular img tags instead of Next.js Image

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-call-to-action.jpg'

export function CallToAction() {
  return (
    <section
      id="get-started-today"
      className="relative overflow-hidden bg-white py-32"
    >
      <img
        className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        src={backgroundImage}
        alt=""
      />
      <Container className="relative">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Get started today
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            It's time to take control of your books. Buy our software so you can
            feel like you're doing something productive.
          </p>
          <Button href="/register" className="mt-10 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-6 py-3 rounded-md transition-colors duration-200">
            Get 6 months free
          </Button>
        </div>
      </Container>
    </section>
  )
}
