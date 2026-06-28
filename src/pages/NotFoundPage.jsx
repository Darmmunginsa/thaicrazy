import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container-shell grid min-h-[60vh] place-items-center py-12 text-center">
      <div>
        <h1 className="text-4xl font-black">ไม่พบหน้า</h1>
        <Link to="/" className="mt-4 inline-flex rounded-md bg-[#E53935] px-4 py-2 font-semibold text-white">กลับหน้าแรก</Link>
      </div>
    </div>
  )
}
