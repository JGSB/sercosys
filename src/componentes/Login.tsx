import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext';
import Spinner from './modal/Spinner';
import { Formik } from 'formik';
import { BiShow, BiHide } from 'react-icons/bi'
import LogoA100 from '../assets/logoA100.png';
import Button from '../ui/Button';
import Label from '../ui/Label';
import Input from '../ui/Input'
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { signIn } = useAuth()
  const formikRef = useRef<any>(null);
  const [ShowSpinner, setShowSpinner] = useState(false);
  const [Error, setError] = useState<string | null>(null)
  const [ShowPassword, setShowPassword] = useState(false)

  const navigate = useNavigate();

  return (
    <>
        <Spinner show={ShowSpinner} />
        <div className="w-full max-w-xl min-h-screen mx-auto flex flex-col justify-center items-center p-2">
          <Formik
            innerRef={formikRef}
            initialValues={{
              email: "",
              password: "",
            }}
            validate={(values) => {
              const errors: { email?: string; password?: string; } = {};
              if (!values.email) {
                errors.email = "Por favor, ingrese su correo electrónico";
              } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(values.email)) {
                  errors.email = "Por favor, ingrese un correo electrónico válido";
                }
              }

              if (!values.password) {
                errors.password = "Por favor, ingrese su contraseña";
              }
                return errors;
            }}
            onSubmit={async (values) => {
              setShowSpinner(true);
              setShowPassword
              try {
                await signIn(values.email, values.password)
                navigate('/home');
              } catch (err: any) {
                console.error('Error:', err.message);
                setError(err.message)
              } finally {
                setShowSpinner(false);
              }
                
            }}
          >
          {({ isSubmitting, values, touched, errors, handleChange, handleBlur, handleSubmit, resetForm }) => {                  
            
            return (
              isSubmitting ? (
                <Spinner show={true}/>
              ):(
                <>
                <form onSubmit={handleSubmit} className="w-full space-y-2">
                  <div className='w-full border rounded-lg p-4 flex flex-col gap-4'>
                    <div className="text-center">
                      <div className="flex justify-center items-center">
                          <img src={LogoA100} className="object-cover bg-white p-2 rounded-md" alt="" />
                      </div>
                      <h1 className="text-xs font-bold text-blue-900">SercoSysWeb</h1>
                    </div>
                    <div className="flex flex-col gap-2 m-4">
                      <div className='flex flex-col gap-1'>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          type="email"
                          id="email" 
                          name="email" 
                          placeholder="su@email.com" 
                          aria-invalid={(touched.email && errors.email) ? "true" : undefined} 
                          aria-describedby={(touched.email && errors.email) ? "div-error" : undefined} 
                          value={values.email} 
                          onChange={(e) => {handleChange(e); setError(null)}}
                          onBlur={(e) => handleBlur(e)} 
                        />
                        {(touched.email && errors.email) && (<div id="div-error" className="w-full text-xs bg-orange-50 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.email}</div>)}
                      </div>
                      <div className='flex flex-col gap-1 mt-2'>
                        <Label htmlFor="password">Contraseña</Label>
                        <div className='relative w-full'>
                          <Input
                            id="password"
                            type={ShowPassword ? "text" : "password"}
                            name="password"
                            placeholder="Su Contraseña"
                            aria-invalid={(touched.password && errors.password) ? "true" : undefined}
                            aria-describedby={(touched.password && errors.password) ? "div-error" : undefined}
                            value={values.password}
                            onChange={(e) => {handleChange(e); setError(null)}}
                            onBlur={(e) => handleBlur(e)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((show) => !show)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 cursor-pointer"
                            aria-label={ShowPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {ShowPassword ? <BiHide size={20} /> : <BiShow size={20} />}
                          </button>
                        </div>
                        {(touched.password && errors.password) && (<div id="div-error" className="w-full text-xs bg-orange-50 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.password}</div>)}
                      </div>
                      <div className='flex justify-center items-center gap-2 mt-4'>
                        <Button type="submit" variant="blue900" className='bg-blue-900 text-white' onClick={() => {}}>
                          Ingresar
                        </Button>
                      </div>
                      {Error && (
                        <div className="w-full text-center text-red-600 text-xs mt-1">Email ó Contraseña incorrectos</div>
                      )}
                    </div>
                    <div className="w-full text-center text-xs text-gray-400 font-bold">
                      <span>UV 20250518 1000</span>
                    </div>
                  </div>
                </form>
                </>
              )
            );
          }}
          </Formik>
        </div>
    </>
  )
}
