export const SITE_CONFIG = {
  name: 'คนไทยลืมง่าย',
  tagline: 'บันทึกเรื่องราว เพื่อไม่ให้สังคมลืม',
  description:
    'พื้นที่รวบรวมข้อมูลสาธารณะ ลิงก์ต้นทาง วิดีโอ และประเด็นสังคม เพื่อช่วยให้ผู้อ่านตรวจสอบและทบทวนความทรงจำสาธารณะ',
  primaryColor: '#E53935',
  apiBaseUrl: import.meta.env.VITE_APPS_SCRIPT_API_URL || '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  adminSessionKey: 'ktln_admin_session',
  memberSessionKey: 'khonthai_user',
  commentCooldownMs: 30_000,
}

export const CATEGORIES = [
  'การเมือง',
  'เศรษฐกิจ',
  'อาชญากรรม',
  'สังคม',
  'ต่างประเทศ',
  'เทคโนโลยี',
  'กีฬา',
  'บันเทิง',
  'อื่นๆ',
]

export const POST_STATUSES = ['Draft', 'Published', 'Hidden']
