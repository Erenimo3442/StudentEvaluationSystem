import {
    Bars3Icon,
    UserCircleIcon,
} from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface HeaderProps {
    setSidebarOpen: (isOpen: boolean) => void
}

export const Header = ({ setSidebarOpen }: HeaderProps) => {
    const { user } = useAuth()

    const getNavItems = () => {
        switch (user?.role) {
            case 'student':
                return [
                    { to: '/student', label: 'Homepage' },
                    { to: '/student/courses', label: 'Courses' }
                ]
            case 'instructor':
                return [
                    { to: '/instructor', label: 'Homepage' },
                    { to: '/instructor/courses', label: 'Courses' }
                ]
            case 'admin':
                return [
                    { to: '/head', label: 'Homepage' },
                    { to: '/head/courses', label: 'Courses' }
                ]
            default:
                return []
        }
    }

    const navItems = getNavItems()

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-secondary-200 sticky top-0 z-30">
            <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Mobile menu button */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-full hover:bg-secondary-100 transition-colors"
                    aria-label="Open menu"
                >
                    <Bars3Icon className="h-6 w-6 text-secondary-600" />
                </button>

                {/* Navigation buttons */}
                <div className="flex-1 flex items-center space-x-6">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.label === 'Homepage'}
                            className={({ isActive }) =>
                                `font-medium transition-colors ${
                                    isActive
                                        ? 'text-primary-600'
                                        : 'text-secondary-600 hover:text-primary-600'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>
                <div className="flex items-center space-x-4">
                    {user ? (
                        <>
                            {/* Bell icon commented out */}
                            {/* <button className="p-2 rounded-full hover:bg-secondary-100 transition-colors relative group">
                                <BellIcon className="h-6 w-6 text-secondary-600 group-hover:text-secondary-900 transition-colors" />
                                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-danger-500 border-2 border-white rounded-full"></span>
                            </button> */}
                            <div className="flex items-center space-x-3 pl-4 border-l border-secondary-200">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-secondary-900">
                                        {user.first_name || user.username} {user.last_name || ''}
                                    </p>
                                    <p className="text-xs text-secondary-500 capitalize">{user.role}</p>
                                </div>
                                <div className="p-1 rounded-full">
                                    <UserCircleIcon className="h-9 w-9 text-secondary-400" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-secondary-500 font-medium">Guest Mode</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
