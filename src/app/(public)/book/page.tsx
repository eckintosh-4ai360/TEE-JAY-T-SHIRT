import { Suspense } from 'react'
import BookingForm from '@/components/BookingForm'

export const metadata = {
  title: 'Book a Service — Tee-Jay',
  description: 'Book printing or photography services with Tee-Jay. T-shirts, logos, posters, flyers, weddings, graduations and more.',
}

export default function BookPage() {
  return (
    <Suspense>
      <BookingForm />
    </Suspense>
  )
}
