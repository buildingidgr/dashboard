import Link from 'next/link'
import { Home, User, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  return (
    <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <nav>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">
            <item.icon className="inline-block mr-2 h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

