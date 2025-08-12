import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'
import { modulos, funcionindependiente, funciones } from '../util/modulofunciones';

export default function Home() {
  const { dataUser } = useAuth()
  const location = useLocation();
  const isBaseRoute = location.pathname !== "/home";

  const hasPermission = (dataUser: Record<string, any> | undefined, permissions: string[]) =>
    !!dataUser && permissions.some((perm) => dataUser[perm]);

  return (
    <div className="w-full max-w-6xl flex flex-col mx-auto">
      {!isBaseRoute &&
        <div id="modulos" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
          {modulos.map(
            ({ name, label, icon: Icon, des, permissions }) =>
              hasPermission(dataUser, permissions) && (
                <Link key={"mod_" + name} to={name}>
                  <div className="max-w-sm h-full border-2 border-blue-900 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col items-center justify-around">
                      <div className="flex flex-col justify-center items-center mb-2 w-full text-blue-900">
                        <span className="text-4xl mr-2"><Icon /></span>
                        <span className="text-xl font-semibold text-center">{label}</span>
                      </div>
                      {des!=="" ?(
                        <p className="text-gray-600  text-xs text-center mb-4">{des}</p>
                      ):(null)}
                  </div>
                </Link>
              )
          )}
          {funcionindependiente.map(
            ({ name, label, icon: Icon, des, permissions }) =>
              hasPermission(dataUser, permissions) && (
                <Link key={"mod_" + name} to={"/"+name}>
                  <div className="max-w-sm h-full border-2 border-blue-900 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col items-center justify-around">
                      <div className="flex flex-col justify-center items-center mb-2 w-full text-blue-900 ">
                        <span className="text-4xl mr-2"><Icon /></span>
                        <span className="text-xl font-semibold text-center">{label}</span>
                      </div>
                      {des!=="" ?(
                        <p className="text-gray-600  text-xs text-center mb-4">{des}</p>
                      ):(null)}
                  </div>
                </Link>
              )
          )}
        </div>
      }
      {isBaseRoute &&
        <Outlet context={{ hasPermission, funciones }}/>
      }
    </div>
  )
}
