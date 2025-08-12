import { BsWifiOff } from "react-icons/bs"

export default function NoInternet() {

  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
         <div className="relative w-auto my-6 mx-auto max-w-sm">
            {/*content*/}
            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full outline-none focus:outline-none bg-sky-900">
               {/*header*/}
               <div className="flex justify-center items-center rounded-t">
                     <span className="p-2"><BsWifiOff className="text-red-500 text-9xl"/></span>
               </div>
            </div>
         </div>
      </div>
      <div className="opacity-50 fixed inset-0 z-40 bg-sky-900"></div>
   </>
  )
}