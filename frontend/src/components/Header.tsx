import {
    Bars3Icon,
    BellIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'

interface HeaderProps {
    setSidebarOpen: (isOpen: boolean) => void
}

export const Header = ({ setSidebarOpen }: HeaderProps) => {
    const { user } = useAuth()

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-secondary-200 sticky top-0 z-30">
            <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Mobile menu button */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-full hover:bg-secondary-100 transition-colors"
                >
                    <Bars3Icon className="h-6 w-6 text-secondary-600" />
                </button>

                {/* Right side actions */}
                <div className="flex-1"></div>
                <div className="flex items-center space-x-4">
                    {user ? (
                        <>
                            <button className="p-2 rounded-full hover:bg-secondary-100 transition-colors relative group">
                                <BellIcon className="h-6 w-6 text-secondary-600 group-hover:text-secondary-900 transition-colors" />
                                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-danger-500 border-2 border-white rounded-full"></span>
                            </button>
                            <div className="flex items-center space-x-3 pl-4 border-l border-secondary-200">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-secondary-900">{user.username}</p>
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
