import { SITE_CONFIG } from '../config.js'

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="container-shell grid gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <div className="text-lg font-bold text-[#E53935]">{SITE_CONFIG.name}</div>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            เว็บไซต์นี้เป็นพื้นที่รวบรวมข้อมูลสาธารณะและลิงก์อ้างอิง ไม่ใช่สำนักข่าว
            ผู้ดูแลเว็บไซต์เป็นผู้รับผิดชอบเนื้อหาและการกลั่นกรองความคิดเห็นทั้งหมด
          </p>
        </div>
        <div className="ad-slot text-xs">พื้นที่รองรับ Google AdSense</div>
      </div>
    </footer>
  )
}
