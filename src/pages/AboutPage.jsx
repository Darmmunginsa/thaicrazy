import { SITE_CONFIG } from '../config.js'

export default function AboutPage() {
  return (
    <div className="container-shell py-12">
      <div className="max-w-3xl">
        <p className="font-semibold text-[#E53935]">About</p>
        <h1 className="mt-3 text-4xl font-black">{SITE_CONFIG.name}</h1>
        <p className="mt-5 leading-8 text-zinc-700 dark:text-zinc-300">
          {SITE_CONFIG.name} ไม่ได้ทำหน้าที่เป็นสำนักข่าว แต่เป็นระบบจัดเก็บและจัดหมวดหมู่ข้อมูลสาธารณะ เช่น ข่าวเดิม วิดีโอ YouTube
          ประกาศทางการ แถลงการณ์ และหัวข้อสนทนาที่เคยเป็นประเด็นในสังคมไทย
        </p>
        <p className="mt-4 leading-8 text-zinc-700 dark:text-zinc-300">
          ทุกโพสต์ควรมีวันที่เผยแพร่ หมวดหมู่ แท็ก และลิงก์ต้นทางเพื่อให้ผู้อ่านตรวจสอบบริบทด้วยตัวเอง ผู้ดูแลเว็บไซต์เป็นคนเดียวที่สร้าง แก้ไข
          หรือซ่อนโพสต์ และเป็นผู้รับผิดชอบการกลั่นกรองความคิดเห็นทั้งหมด
        </p>
      </div>
    </div>
  )
}
