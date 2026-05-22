import { Suspense } from 'react'
import BookingForm from '@/components/BookingForm'
import PageBackground from '@/components/PageBackground'

export const metadata = {
  title: 'Book a Service — Tee-Jay Multimedia',
  description: 'Book printing or photography services with Tee-Jay Multimedia. T-shirts, logos, posters, flyers, weddings, graduations and more.',
}

export default function BookPage() {
  return (
    <>
      <PageBackground />
      <Suspense>
        <BookingForm />
      </Suspense>
    </>
  )
}
