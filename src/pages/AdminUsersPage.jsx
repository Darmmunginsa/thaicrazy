import { ShieldAlert, ShieldCheck, UserCog } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'
import { formatDate } from '../utils/format.js'

const roles = ['Member', 'Moderator', 'Admin']
const statuses = ['Active', 'Suspended', 'Banned']

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAdmin || !user?.userId) return
    api
      .listUsers(user.userId)
      .then((data) => setUsers(data || []))
      .catch((error) => setMessage(error.message))
  }, [isAdmin, user])

  async function changeRole(targetUserId, role) {
    await api.updateUserRole(user.userId, targetUserId, role)
    setUsers((items) => items.map((item) => (item.userId === targetUserId ? { ...item, role } : item)))
  }

  async function changeStatus(targetUserId, status) {
    const banReason = status === 'Banned' ? window.prompt('เหตุผลการระงับบัญชี') || '' : ''
    await api.updateUserStatus(user.userId, targetUserId, status, banReason)
    setUsers((items) => items.map((item) => (item.userId === targetUserId ? { ...item, status, banReason } : item)))
  }

  if (!user) {
    return (
      <div className="container-shell py-12">
        <h1 className="text-3xl font-black">จัดการสมาชิก</h1>
        <p className="mt-3 text-zinc-500">กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินก่อน</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container-shell py-12">
        <h1 className="text-3xl font-black">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-3 text-zinc-500">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>
    )
  }

  return (
    <div className="container-shell py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[#E53935]">Admin Users</p>
          <h1 className="text-3xl font-black">จัดการสมาชิก</h1>
        </div>
        <Link to="/admin" className="rounded-md border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">
          กลับ Dashboard
        </Link>
      </div>
      {message && <p className="mt-4 text-sm text-[#E53935]">{message}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-3">สมาชิก</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Comments</th>
                <th className="px-4 py-3">Warnings</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.userId} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={item.photoUrl || `${import.meta.env.BASE_URL}og-image.svg`} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <div className="font-semibold">{item.displayName}</div>
                        <div className="text-xs text-zinc-500">{item.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={item.role} onChange={(event) => changeRole(item.userId, event.target.value)} className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700">
                      {roles.map((role) => <option key={role}>{role}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#E53935]/10 text-[#E53935]'}`}>
                      {item.status === 'Active' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.commentCount || 0}</td>
                  <td className="px-4 py-3">{item.warningCount || 0}</td>
                  <td className="px-4 py-3">{formatDate(item.lastLogin)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((status) => (
                        <button key={status} onClick={() => changeStatus(item.userId, status)} className="rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700">
                          {status === 'Active' ? 'เปิดใช้' : status === 'Suspended' ? 'พักใช้' : 'ระงับ'}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-zinc-500">
                    <UserCog className="mx-auto mb-2 text-[#E53935]" />
                    ยังไม่มีข้อมูลสมาชิก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
