import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { TypeLayoutModuloProps } from "../../util/types";
import Spinner from "../modal/Spinner";
import { BsFillArrowLeftSquareFill, BsFillHouseGearFill } from "react-icons/bs";
import { funciones } from "../../util/modulofunciones";
import { useState } from "react";
import Button from "../../ui/Button";

export default function LayoutModulo({ pathname }: TypeLayoutModuloProps) {
    const hasPermission = (dataUser: Record<string, any> | undefined, permissions: string[]) =>
    !!dataUser && permissions.some((perm) => dataUser[perm]);
    const navigate = useNavigate();
    const [ShowSpinner, setShowSpinner] = useState(false);
    const { dataUser } = useAuth();
    const isBaseRoute = (
        pathname === "/home/configuracion" || 
        pathname === "/home/recursoshumanos" || 
        pathname === "/home/operaciones" || 
        pathname === "/home/frigorifico" || 
        pathname === "/home/panaderia" || 
        pathname === "/home/mayorista" ||
        pathname === "/home/seguridadpatrimonial"
    );

   const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      navigate(e.target.value);
   };

   const handleBackClick = () => {
      navigate(-1);
      const selectElement = document.getElementById("select-configuracion") as HTMLSelectElement | null;
      if (selectElement) {
        selectElement.selectedIndex = 0;
      }
   };
   const handleBackClickHome = () => {
      navigate("/home");
   };

   return (
    <>
      <div className="w-full max-w-6xl flex flex-col mx-auto">
        <Spinner show={ShowSpinner} />
        <fieldset className="w-full border-double border-4 border-blue-900 rounded-lg p-2 mb-8 mt-1">
          <legend className="py-0.5 px-2 rounded-lg text-xs sm:text-md md:text-lg font-bold">
            <div className="flex flex-row items-center justify-between">
              {!isBaseRoute && (
                <Button
                  type="button"
                  onClick={handleBackClickHome}
                  aria-label="Volver"
                  className="text-2xl md:text-3xl focus:outline-none mr-4"
                >
                  <BsFillHouseGearFill />
                </Button>
              )}
              <Button
                type="button"
                onClick={handleBackClick}
                aria-label="Volver"
                className="text-2xl md:text-3xl focus:outline-none"
              >
                <BsFillArrowLeftSquareFill />
              </Button>
              {isBaseRoute && (
                <select
                  id="select-configuracion"
                  name="select-configuracion"
                  onChange={(e)=>{handleSelectChange(e)}}
                  className="form-select block ml-2 px-2 py-1 text-md font-normal text-black bg-white border border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled> Selección...</option>
                  {funciones.map(({ location: loc, label, value, permissions }, index) => {
                    if (loc === location.pathname && hasPermission(dataUser, permissions)) {
                      return (
                        <option key={index} value={value}>
                          {label}
                        </option>
                      );
                    }
                    return null;
                  })}
                </select>
              )}
            </div>
          </legend>
          <Outlet />
        </fieldset>
      </div>
    </>
  )
}