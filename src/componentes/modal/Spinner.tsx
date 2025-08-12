import { BiLoaderAlt } from "react-icons/bi";

type SpinnerProps = {
    show: boolean;
};

export default function Spinner({show}: SpinnerProps) {
   if (!show) return null;
   return (
      <>
         <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-sm">
               <div className="border-0 rounded-lg relative flex flex-col w-full outline-none focus:outline-none">
               <div className="relative flex-auto">
                  <button disabled type="button" className="text-white bg-blue-900 hover:bg-blue-800 focus:ring-4 focus:ring-blue-700 font-medium rounded-lg text-xl px-5 py-2.5 text-center mr-2 inline-flex items-center">
                     <BiLoaderAlt className="animate-spin"/>
                     <span className="ml-2">Conectando...</span>
                  </button>
               </div>
               </div>
            </div>
         </div>
         <div className="opacity-50 fixed inset-0 z-40 bg-blue-900/75"></div>
      </>
   );
}