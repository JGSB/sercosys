
import { BsFillPersonFill } from 'react-icons/bs'
import { useState } from 'react'
import { nombresPorRuta, nombresPorSubRuta } from '../util/ruta'
import { useAuth } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'
import Button from '../ui/Button'
import AvisoModal, { estadoInicialAviso } from './modal/AvisoModal'

export default function HeaderNav() {
  const { user, dataUser, signOut } = useAuth()
  const location = useLocation();

  const [userMenuOpen, setuserMenuOpen] = useState(false);
  const [Aviso, setAviso] = useState(estadoInicialAviso);

  function capitalizeWords(str: string) {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word ? word[0].toUpperCase() + word.slice(1) : '')
      .join(' ')
  }

  const nombreModulo = nombresPorRuta[location.pathname]
  const nombreFuncion = nombresPorSubRuta[location.pathname]

  return (
    <>
    <AvisoModal 
        show={Aviso.show} 
        logo={Aviso.logo} 
        colorlogo={Aviso.colorlogo} 
        texto={Aviso.texto} 
        aligntexto={Aviso.aligntexto} 
        sizetexto={Aviso.sizetexto} 
        botones={Aviso.botones} 
        txtbotones={Aviso.txtbotones}
        ClickCancel={Aviso.ClickCancel}
        ClickConfirm={Aviso.ClickConfirm}
    />
    <div className="flex justify-around items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
      <div className="p-2 sm:ml-6 sm:block w-full h-full">
        <div className="flex flex-col justify-center items-center w-full h-full">
          <span className="font-bold dark:text-white text-md sm:text-lg md:text-xl">{nombreModulo}</span>
          <span className="font-bold dark:text-white text-xs lg:text-md">{nombreFuncion}</span>
        </div>
      </div>
      <div className="relative ml-3">
        <div>
          <button
            type="button"
            className="relative p-1 flex rounded-full text-3xl sm:text-3xl md:text-4xl lg:text-5xl cursor-pointer"
            id="user-menu-button"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            onClick={() => setuserMenuOpen(!userMenuOpen)}
          >
            <span className="absolute -inset-1.5"></span>
            <span className="sr-only">Open user menu</span>
            <BsFillPersonFill/>
          </button>
        </div>        
        {userMenuOpen && (
          <div className="absolute right-0 z-10 mt-2 w-auto origin-top-right rounded-md bg-white py-1 px-2 shadow-lg ring-1 ring-black/5 focus:outline-hidden" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabIndex={-1}>
            <span className="w-full flex flex-col text-left px-1 py-2 text-xs text-gray-700">
              <span className='text-nowrap'>{capitalizeWords(dataUser.nombres)} {capitalizeWords(dataUser.apellidos)}</span>
              <span>{user?.email}</span>
            </span>
            <hr />
            <Button type='button' variant='red500' className='mt-1' onClick={() => {
              setuserMenuOpen(false);
              setAviso({
                show: true,
                logo: 'BsFillQuestionCircleFill',
                colorlogo: 'text-orange-500',
                texto: '¿Está seguro que desea Cerrar Sesión?',
                aligntexto: 'text-center',
                sizetexto: "text-2xl",
                botones: { Bcerrar: true, Benviar: true },
                txtbotones: { Bcerrar: "No", Benviar: "Sí" },
                ClickCancel: () => setAviso(estadoInicialAviso),
                ClickConfirm: () => signOut()
              })
            }}>
              Cerrar Sesión
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
