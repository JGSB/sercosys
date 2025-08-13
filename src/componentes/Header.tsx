import { Link } from 'react-router-dom'
import logoA70  from '../assets/logoA70.png'
import { useAuth } from '../context/AuthContext'
import HeaderNav from './HeaderNav'


export default function Header() {
    const { user } = useAuth()
    return (
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-18">
            <div className="w-full max-w-6xl flex justify-between items-center px-1 text-sm m-2">
                <div className="w-20 sm:w-24 md:w-28 lg:w-auto gap-5 items-center font-semibold bg-white p-2 rounded-lg shadow-sm">
                <Link to={'/'}>
                    <img src={logoA70} alt="" />
                </Link>
                </div>
                {user===null ? <span className="font-semibold">SercoSysWeb</span> : <HeaderNav />}
            </div>
        </nav>
    )
}