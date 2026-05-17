import Link from 'next/link'
import OrderForm from '@/components/OrderForm'

export const metadata = { title: 'New Order — Press Manager' }

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">Dashboard</Link>
        <span>/</span>
        <Link href="/orders" className="hover:text-gray-600">Orders</Link>
        <span>/</span>
        <span className="text-gray-700">New</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">New order</h1>

      <div className="card p-6 lg:p-8">
        <OrderForm />
      </div>
    </div>
  )
}
