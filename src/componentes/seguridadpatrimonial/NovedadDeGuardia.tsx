import React, { useEffect, useRef, useState } from 'react';
import { Formik, type FormikProps } from 'formik';
import { BsFillCloudUploadFill, BsFillTrashFill, BsFillPrinterFill } from 'react-icons/bs';
import type { TypeArrayCliente, TypeArraySucursal } from '../../util/types';
import { useAuth } from '../../context/AuthContext';
import AvisoModal, { estadoInicialAviso } from '../modal/AvisoModal';
import Spinner from '../modal/Spinner';
import Input from '../../ui/Input';
import { agregarNovedad, eliminarNovedad, obtenerNovedades } from '../../consultasDB/apiSupabase';

export default function NovedadesDeGuardia() {
    const { dataUser, idscliente, idssucursal } = useAuth();
    const arrayClientes = (idscliente || []) as unknown as TypeArrayCliente[];
    const arraySucursales = (idssucursal || []) as unknown as TypeArraySucursal[];

    const [ShowSpinner, setShowSpinner] = useState(false)
    const [Aviso, setAviso] = useState(estadoInicialAviso);
    const [TableCoincidencia, setTableCoincidencia] = useState(false);
    const formikRef = useRef<FormikProps<{
        fecha: string;
        cliente: string | number;
        hora: string;
        sucursal?: string | number;
        descripcion: string;
        acciones: string;
        gerencia: number;
        estructura?: string | number;
        usuario: number | undefined;
    }> | null>(null);
    const [Volcado, setVolcado] = useState(false);
    const [ArrayNovedad, setArrayNovedad] = useState<any[]>([]);

    /* interface TipoStatus {
        show: boolean;
        valor: number | string;
    } */
    //const [TipoStatus, setTipoStatus] = useState<TipoStatus>({ show: false, valor: "" });

    const CerrarAviso = () => {
        setAviso({...estadoInicialAviso})
    };

    const ChangeCliente = (e: React.ChangeEvent<HTMLSelectElement>) => {
        formikRef?.current?.setFieldValue('cliente', e.target.value);
        setVolcado(true)
    }

    const PreguntarEliminarNovedad= (idNovedad: number, nombreSucursal: string, hora: string) => {
       setAviso({         
         show: true,
         logo:'BsFillQuestionCircleFill',
         colorlogo: "text-orange-400",
         texto:"¿ Desea eliminar novedad de la \nsucursal \n\""+nombreSucursal+"\"\n\a las\n\""+hora+"\" ?",
         aligntexto: "text-center",
         sizetexto: "text-lg",
         botones:{ Bcerrar:true, Benviar:true },
         txtbotones: { Bcerrar: "No", Benviar: "Eliminar" },
         ClickCancel:()=>CerrarAviso(),
         ClickConfirm:()=>EliminarNovedad(idNovedad),
      })
    }

    const EliminarNovedad = async (idNovedad: number) => {
        const id = idNovedad;

        setAviso({...estadoInicialAviso})

        const fetchData = async () => {
            try {
                setShowSpinner(true);
                await eliminarNovedad(Number(id))
                    
            } catch (error) {
                console.error("Error al obtener datos:", error);
            } finally {
                setShowSpinner(false);
                setVolcado(true);
            }
        };

        fetchData();
    }
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);
    const GenerarPDF = async () => {
        setAviso({...estadoInicialAviso})

        const nombrecliente= arrayClientes.find(cliente => cliente.id === Number(formikRef?.current?.values.cliente))?.nombre || "Cliente Desconocido";
        const fecha= formikRef?.current?.values.fecha || "00/00/0000";

        const fetchData = async () => {
            try {
                setShowSpinner(true);
                const body = {
                    fecha: fecha,
                    cliente: nombrecliente,
                    location: window.location.origin,
                    sucursales: arraySucursales,
                    novedades: ArrayNovedad,
                };

                const response = await fetch(`/w_generarpdfnovedad`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                });

                if (!response.ok) { throw new Error(`Error en la respuesta: ${response.status}`) }

                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPdfBase64(reader.result as string);
                };
                reader.readAsDataURL(blob);

            } catch (error) {
                console.error("Error al obtener datos:", error);
            } finally {
                setShowSpinner(false);
                setVolcado(true);
            }
        };

        fetchData();
    }

    useEffect( () => {

        if(Volcado){
            let fecha=formikRef?.current?.values.fecha
            let cliente=formikRef?.current?.values.cliente
            if(fecha!="" && cliente!=""){
                async function main() {
                    try {
                        setShowSpinner(true);
                        const [novedadesData] = await Promise.all([
                            obtenerNovedades(Number(cliente), 16, String(fecha))
                        ]);
                        setArrayNovedad(novedadesData as any[]);
                        setTableCoincidencia(true);
                    } catch (err) {
                        setTableCoincidencia(false);
                        console.error("Error en la función main:", err);
                    } finally {
                        setShowSpinner(false);
                    }
                }
            
                main();
            }else{
                setTableCoincidencia(false)
                
            }
        }
        return () => {
            setVolcado(false)
        }
        
    }, [Volcado]);

    useEffect(() => {
        if(!dataUser?.V_T && arrayClientes.length === 1) {
            formikRef?.current?.setFieldValue('cliente', arrayClientes[0].id);
            ChangeCliente({ target: { value: arrayClientes[0].id } } as unknown as React.ChangeEvent<HTMLSelectElement>);
        }
    }, [dataUser, arrayClientes]);

    return (
        <>
            <Spinner show={ShowSpinner} />
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
            <Formik
                innerRef={formikRef} 
                initialValues={{
                    fecha: "",
                    cliente: "",
                    hora:"",
                    sucursal: '',
                    descripcion:"",
                    acciones: '',
                    gerencia: 16,
                    usuario: dataUser?.id
                }}
                validate={(values) => {
                    const errors: { fecha?: string; cliente?: string; hora?: string; sucursal?: string; descripcion?: string; acciones?: string; } = {};
                    if (!values.fecha) {
                        errors.fecha = "Por favor, seleccione un item";
                    }
                    if (!values.hora) {
                        errors.hora = "Por favor, seleccione un item";
                    }
                    if (!values.descripcion) {
                        errors.descripcion = "Por favor, seleccione un item";
                    }
                    if (!values.cliente) {
                        errors.cliente = "Por favor, seleccione un item";
                    }
                    if (!values.acciones) {
                        errors.acciones = "Por favor, seleccione un item";
                    }
                    return errors;
                }}
                onSubmit={async (values, {resetForm}) => {
                    const fecha = String(values.fecha);
                    const cliente = Number(values.cliente);
                    const hora = String(values.hora);
                    const sucursal = Number(values.sucursal);
                    const descripcion = String(values.descripcion);
                    const acciones = String(values.acciones);
                    const gerencia = Number(values.gerencia);
                    const usuario = Number(values.usuario);
                    try {
                        await agregarNovedad(fecha, cliente, hora, sucursal, descripcion, acciones, gerencia, usuario);
                        resetForm({ 
                            values: { 
                                fecha: values.fecha,
                                cliente: values.cliente,
                                hora:"",
                                sucursal: '',
                                descripcion:"",
                                acciones: '',
                                gerencia: 16,
                                usuario: dataUser?.id
                            },
                        });
                            
                    } catch (error: any) {
                        console.error('Error:', error);
                    } finally {
                        setVolcado(true)
                    }
                }}
            >
                {({isSubmitting, values, touched, errors, handleChange, handleBlur, handleSubmit }) => { 

                    return(
                        isSubmitting ? (
                            <Spinner show={true} />
                        ) : (
                            <> 
                                <form method="post" className="" onSubmit={handleSubmit}>
                                    <div className="flex justify-around items-center m-2">
                                        <div className="w-auto m-1 p-4 bg-blue-900 flex flex-col justify-center items-center rounded-md">
                                            <label htmlFor="fecha" className="font-bold text-white mb-2">Fecha</label>
                                            <input 
                                                type="date"
                                                id="fecha" 
                                                name="fecha"
                                                className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                aria-invalid={(touched.fecha && errors.fecha) ? "true" : undefined}
                                                aria-describedby={(touched.fecha && errors.fecha) ? "nombre-error" : undefined}
                                                value={values.fecha}
                                                onChange={(e)=>{handleChange(e); setVolcado(true); setTableCoincidencia(false)}}
                                                onBlur={(e)=>{handleBlur(e)}}
                                                onClick={() => {
                                                    !dataUser?.V_T && arrayClientes.length === 1 ? values.cliente: values.cliente=""
                                                    values.hora=""
                                                    values.sucursal=""
                                                    values.descripcion=""
                                                    values.acciones=""
                                                    if(!dataUser?.V_T && arrayClientes.length === 1){
                                                        setTableCoincidencia(false)     
                                                        setVolcado(true)
                                                    }
                                                }}
                                            />
                                            {(touched.fecha && errors.fecha) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.fecha}</div>)}
                                        </div>
                                        {(!dataUser?.V_T && arrayClientes.length === 1) ? (
                                            null
                                        ) : (
                                            <div className="w-auto m-1 p-4 bg-blue-900 flex flex-col justify-center items-center rounded-md">
                                                <label htmlFor="cliente" className="font-bold text-white mb-2">Cliente</label>
                                                <select 
                                                    id="cliente" 
                                                    name="cliente"
                                                    className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                    aria-invalid={(touched.cliente && errors.cliente) ? "true" : undefined}
                                                    aria-describedby={(touched.cliente && errors.cliente) ? "nombre-error" : undefined}
                                                    value={values.cliente}
                                                    onChange={(e) => { handleChange(e); ChangeCliente(e)}}
                                                    onBlur={(e)=>{handleBlur(e)}}
                                                >
                                                    <option value=""> Selección...</option>
                                                    {arrayClientes.map((cliente) => (
                                                        <option key={"cli_"+cliente.id} value={cliente.id}>
                                                            {cliente.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                                {(touched.cliente && errors.cliente) && (<div className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.cliente}</div>)}
                                            </div>
                                        )}
                                    </div>
                                    {TableCoincidencia ? (
                                        <>
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-blue-900">
                                                    <tr>
                                                        <th style={{width:"10%"}} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">HORA</th>
                                                        <th style={{width:"20%"}} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">SUCURSAL</th>
                                                        <th style={{width:"40%"}} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">DESCRIPCIÓN</th>
                                                        <th style={{width:"25%"}} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">ACCIONES</th>
                                                        <th style={{width:"5%"}} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    <tr>
                                                        <td className="p-1 text-sm border border-slate-300 text-center">
                                                            <Input
                                                                type="time"
                                                                id="hora"
                                                                name="hora"
                                                                className=""
                                                                value={values.hora}
                                                                onChange={(e: any) => { handleChange(e); }}
                                                                onBlur={(e: any) => { handleBlur(e); }}
                                                            />
                                                            {touched.hora && errors.hora && <div className="text-sm font-semibold text-red-500 italic">{errors.hora}</div>}
                                                        </td>
                                                        <td className="p-1 text-sm border border-slate-300 text-center">
                                                            <select
                                                                id="sucursal"
                                                                name="sucursal"
                                                                className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                                value={values.sucursal}
                                                                onChange={e => { handleChange(e); }}
                                                                onBlur={e => { handleBlur(e); }}
                                                            >
                                                                <option value="">Seleccione...</option>
                                                                {arraySucursales.map((sucursal) => {
                                                                    if (sucursal.idcliente === Number(values.cliente)) {
                                                                        return (
                                                                            <option key={"suc_" + sucursal.id} value={sucursal.id}>
                                                                                {sucursal.nombre}
                                                                            </option>
                                                                        )
                                                                    }
                                                                })}
                                                            </select>
                                                            {touched.sucursal && errors.sucursal && <div className="text-sm font-semibold text-red-500 italic">{errors.sucursal}</div>}
                                                        </td>
                                                        <td className="p-1 text-sm border border-slate-300 text-center">
                                                            <textarea 
                                                                name="descripcion"
                                                                id="descripcion"
                                                                cols={30}
                                                                rows={5}
                                                                className="form-select block w-full px-1 py-0.5 text-sm font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                                value={values.descripcion}
                                                                onChange={(e) => {
                                                                    const nuevoEvento = { ...e };
                                                                    nuevoEvento.target.value = e.target.value.toUpperCase();
                                                                    handleChange(nuevoEvento);
                                                                }}
                                                                onBlur={handleBlur}
                                                            >
                                                            </textarea>
                                                            {touched.descripcion && errors.descripcion && <div className="text-sm font-semibold text-red-500 italic">{errors.descripcion}</div>}
                                                        </td>
                                                        <td className="p-1 text-sm border border-slate-300 text-center">
                                                            <textarea 
                                                                name="acciones"
                                                                id="acciones"
                                                                cols={30}
                                                                rows={5}
                                                                className="form-select block w-full px-1 py-0.5 text-sm font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                                value={values.acciones}
                                                                onChange={(e) => {
                                                                    const nuevoEvento = { ...e };
                                                                    nuevoEvento.target.value = e.target.value.toUpperCase();
                                                                    handleChange(nuevoEvento);
                                                                }}
                                                                onBlur={handleBlur}
                                                            >
                                                            </textarea>
                                                        </td>
                                                        <td className="p-1 text-sm border border-slate-300 text-center">
                                                            {values.hora === "" || values.sucursal === "" || values.descripcion === "" || values.acciones === "" ? null : <button type='submit' className="text-5xl cursor-pointer"><span className='text-yellow-500'><BsFillCloudUploadFill /></span></button>}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table className="min-w-full divide-y divide-gray-200 mt-2">
                                                <thead className="bg-blue-900">
                                                    <tr>
                                                        <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">HORA</th>
                                                        <th style={{ width: "25%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">SUCURSAL</th>
                                                        <th style={{ width: "40%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">DESCRIPCIÓN</th>
                                                        <th style={{ width: "25%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">ACCIONES</th>
                                                        <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {ArrayNovedad.length > 0 ? (
                                                        ArrayNovedad.map(function (d, i) {
                                                            const nombre_sucursal = arraySucursales.find(sucursal => sucursal.id === d.idsucursal)?.nombre || "Sucursal Desconocida";
                                                            return (
                                                            <tr key={`novedad_${i}`}>
                                                                <td className="p-1 text-xs border border-slate-300 text-center">{d.hora}</td>
                                                                <td className="p-1 text-xs border border-slate-300 text-center">{nombre_sucursal}</td>
                                                                <td className="p-1 text-xs border border-slate-300 text-justify whitespace-pre-line">{d.descripcion}</td>
                                                                <td className="p-1 text-xs border border-slate-300 text-justify whitespace-pre-line">{d.acciones}</td>
                                                                <td className="p-1 text-xs border border-slate-300 text-center">
                                                                    <button type='button' className="text-4xl text-red-900 cursor-pointer" onClick={() =>PreguntarEliminarNovedad(d.id, nombre_sucursal, d.hora)}><BsFillTrashFill/></button>
                                                                </td>
                                                            </tr>
                                                            )
                                                        })
                                                    )
                                                    :
                                                        <tr>
                                                            <td colSpan={5} className="p-1 text-center">No hay datos disponibles.</td>
                                                        </tr>
                                                    }
                                                </tbody>
                                            </table>
                                            {ArrayNovedad.length > 0 ? (
                                            <div className="flex justify-center items-center mt-4">
                                                <button type="button" className="inline-block px-3 py-2.5 bg-blue-900 text-white font-medium text-lg leading-tight uppercase rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out cursor-pointer" onClick={()=> GenerarPDF()}><BsFillPrinterFill/></button>
                                            </div>
                                            ):null}
                                            {pdfBase64 && (
                                                <>
                                                    <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                                                        <div className="relative my-6 mx-auto w-2/3" style={{ height: '80vh' }}>
                                                            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full h-full outline-none focus:outline-none bg-blue-900">
                                                                <div className="relative p-4 flex-auto text-white flex flex-col" style={{ height: '100%' }}>
                                                                    <div className="flex justify-center items-center flex-grow" style={{ height: '100%' }}>
                                                                        <iframe
                                                                        src={pdfBase64}
                                                                        width="100%"
                                                                        height="100%"
                                                                        title="Vista previa PDF"
                                                                        style={{ border: "1px solid #ccc" }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-center rounded-b px-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <button type="button" className="text-red-500 hover:bg-red-500 hover:text-white rounded-lg background-transparent font-bold uppercase px-4 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"  onClick={() => setPdfBase64(null)} > Cerrar </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="opacity-50 fixed inset-0 z-40 bg-blue-900"></div>
                                                </>
                                            )}
                                        </>
                                    ):(null)}
                                    {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                                </form>
                            </>
                        )
                    )

                }}
            </Formik>
        </>
    );
}