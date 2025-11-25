import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
    HomeIcon,
    AcademicCapIcon,
    DocumentTextIcon,
    ChartBarIcon,
    UsersIcon,
    Cog6ToothIcon,
    ArrowRightStartOnRectangleIcon,
    XMarkIcon,
    BuildingLibraryIcon,
    BookOpenIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface SidebarProps {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
}

interface NavItem {
    name: string
    href: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    roles?: string[]
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    // Public routes
    { name: 'Universities', href: '/universities', icon: AcademicCapIcon },
    { name: 'Departments', href: '/departments', icon: BuildingLibraryIcon },
    { name: 'Programs', href: '/programs', icon: BookOpenIcon },
    { name: 'Courses', href: '/courses', icon: AcademicCapIcon },
    // Protected routes
    { name: 'Assessments', href: '/assessments', icon: DocumentTextIcon, roles: ['instructor', 'admin'] },
    { name: 'Outcomes', href: '/outcomes', icon: ChartBarIcon, roles: ['instructor', 'admin'] },
    { name: 'Students', href: '/students', icon: UsersIcon, roles: ['instructor', 'admin'] },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['instructor', 'admin'] },
]

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const filteredNavigation = navigation.filter(item => {
        // If user is not logged in (guest)
        if (!user) {
            // Show only Dashboard
            return item.name === 'Dashboard'
        }
        // If user is logged in, show items that match their role or have no role restriction
        return !item.roles || item.roles.includes(user.role)
    })

    return (
        <>
            {/* Mobile sidebar backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-md border-r border-secondary-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-secondary-200/50">
                        <Link to="/" className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">SE</span>
                            </div>
                            <span className="text-xl font-bold text-secondary-900 tracking-tight">Student Eval</span>
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-2 rounded-full hover:bg-secondary-100 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6 text-secondary-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {filteredNavigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={clsx(
                                        "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
                                        isActive
                                            ? 'bg-primary-50 text-primary-700 shadow-sm'
                                            : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                                    )}
                                >
                                    <item.icon className={clsx(
                                        "h-6 w-6 transition-colors duration-200",
                                        isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'
                                    )} />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Bottom actions */}
                    <div className="p-4 border-t border-secondary-200/50 space-y-1">
                        {user ? (
                            <>
                                <Link
                                    to="/settings"
                                    className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 transition-colors group"
                                >
                                    <Cog6ToothIcon className="h-6 w-6 text-secondary-400 group-hover:text-secondary-600 transition-colors" />
                                    <span>Settings</span>
                                </Link>
                                <button
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-danger-600 hover:bg-danger-50 transition-colors group"
                                    onClick={() => {
                                        logout()
                                        navigate('/login')
                                    }}
                                >
                                    <ArrowRightStartOnRectangleIcon className="h-6 w-6 group-hover:text-danger-700 transition-colors" />
                                    <span>Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-primary-600 hover:bg-primary-50 transition-colors group"
                            >
                                <ArrowRightStartOnRectangleIcon className="h-6 w-6 group-hover:text-primary-700 transition-colors" />
                                <span>Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </aside>
        </>
    )
}
