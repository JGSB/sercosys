import { Formik, type FormikProps } from "formik";
import AvisoModal, { estadoInicialAviso } from "../modal/AvisoModal";
import Spinner from "../modal/Spinner";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import type { TypeCargo, TypeArrayCliente, TypeArraySucursal, TypeEstatusPuesto } from "../../util/types";
import React from "react";
import { BsFillPinMapFill, BsFillClockFill, BsFillClipboardCheckFill, BsFillPeopleFill, BsFillBinocularsFill, BsFillTrashFill, BsFillCloudUploadFill, BsFillPrinterFill } from "react-icons/bs";
import Select from 'react-select';
import { agregarCobertura, eliminarCobertura, obtenerCobertura, obtenerEstatusPuesto, obtenerEstructuraCobertura, obtenerPersonalCobertura } from "../../consultasDB/apiSupabase";

export default function CoberturaDePuesto() {
    const { dataUser, idscliente, idssucursal } = useAuth();
    const arrayClientes = (idscliente || []) as unknown as TypeArrayCliente[];
    const arraySucursales = (idssucursal || []) as unknown as TypeArraySucursal[];

    const [ShowSpinner, setShowSpinner] = useState(false)
    const [Aviso, setAviso] = useState(estadoInicialAviso);
    const [TableCoincidencia, setTableCoincidencia] = useState(false);
    
    const formikRef = useRef<FormikProps<{
        fecha: string;
        cliente: string | number;
        hentrada: string;
        hsalida: string;
        estatus: string | number;
        colaborador: string;
        observacion: string;
        gerencia: number;
        estructura?: string | number;
        sucursal?: string | number;
        usuario: number | undefined;
    }> | null>(null);

    const [Volcado, setVolcado] = useState(false);
    const [Volcado2, setVolcado2] = useState(false);
  
    interface Personal {
        id: string | number | readonly string[] | undefined;
        nrocedula: number;
        nombres: string;
        apellidos: string;
        cargo: TypeCargo;
    }
    const [ArrayPersonal, setArrayPersonal] = useState<Personal[]>([]);
    const [ArrayEstructura, setArrayEstructura] = useState<any[]>([]);
    const [ArrayEstatusPuesto, setArrayEstatusPuesto] = useState<TypeEstatusPuesto[]>([]);
    const [ArrayCobertura, setArrayCobertura] = useState<any[]>([]);
    //const [SelectedPersonal, setSelectedPersonal] = useState<any[]>([]);
    const [ArraySucursales, setArraySucursales] = useState<any[]>([]);

    interface CargarPuesto {
        show: boolean;
        id_sucursal?: number;
        nombre_sucursal?: string;
        id_puesto?: number;
        nombre_puesto?: string;
        entrada?: string;
        salida?: string;
    }
    const [ViewCargarPuesto, setViewCargarPuesto] = useState<CargarPuesto>({ show: false });
    interface TipoStatus {
        show: boolean;
        valor: number | string;
    }
    const [TipoStatus, setTipoStatus] = useState<TipoStatus>({ show: false, valor: "" });

    const estadoInicialCargarPuesto: CargarPuesto = {
        show: false,
        id_sucursal: undefined,
        nombre_sucursal: undefined,
        id_puesto: undefined,
        nombre_puesto: undefined,
        entrada: undefined,
        salida: undefined
    };
    const CerrarAviso = () => {
        setAviso({...estadoInicialAviso})
        setViewCargarPuesto({...estadoInicialCargarPuesto})
        setTipoStatus({ show: false, valor: "" });
        formikRef?.current?.setFieldValue('estatus', '');
        formikRef?.current?.setFieldValue('colaborador', '');
        formikRef?.current?.setFieldValue('observacion', '');
        formikRef?.current?.setFieldValue('estructura', '');
        formikRef?.current?.setFieldValue('sucursal', '');
    };

    const ChangeCliente = (e: React.ChangeEvent<HTMLSelectElement>) => {
        formikRef?.current?.setFieldValue('cliente', e.target.value);
        setVolcado(true)
    }
    
    const ChangeSalida = (e: React.ChangeEvent<HTMLInputElement>) => {
        formikRef?.current?.setFieldValue('hsalida', e.target.value);
        setVolcado(true)
    }

    const ViewCargarCobertura = (sucursalID: number, sucursalName: string, estructuraID: number, estructuraName: string, he: string, hs: string) => {
        const [hE, mE] = he.split(':').map(Number);
        const [hS, mS] = hs.split(':').map(Number);
        const heFormateada = `${hE > 9 ? hE : `0${hE}`}:${mE > 9 ? mE : `0${mE}`}`;
        const hsFormateada = `${hS > 9 ? hS : `0${hS}`}:${mS > 9 ? mS : `0${mS}`}`;

        setViewCargarPuesto({
            show: true,
            id_sucursal: sucursalID,
            nombre_sucursal: sucursalName,
            id_puesto: estructuraID,
            nombre_puesto: estructuraName,
            entrada: heFormateada,
            salida: hsFormateada,
        })
    }

    const ChangeStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cobertura = e.target.value;
        formikRef?.current?.setFieldValue('estatus', cobertura);

      if( cobertura === "") {
         setTipoStatus({ show: false, valor: "" });
         formikRef?.current?.setFieldValue('sucursal', '');
         formikRef?.current?.setFieldValue('estructura', '');
        }else{
            const coberturaOptions = {
                1: { show: true, valor: 1 },
                2: { show: true, valor: 2 },
                3: { show: true, valor: 3 },
                4: { show: true, valor: 4 }
            };
            const tipoStatusData = coberturaOptions[Number(cobertura) as 1 | 2 | 3 | 4] || { show: false, valor: "" };
            setTipoStatus(tipoStatusData);
      }
    }

    const PreguntarEliminarCobertura= (idCobertura: number, nombreSucursal: string, nombreEstructura: string) => {
       setAviso({         
         show: true,
         logo:'BsFillQuestionCircleFill',
         colorlogo: "text-orange-400",
         texto:"¿ Desea eliminar \n\""+nombreEstructura+"\"\nde la sucursal \n\""+nombreSucursal+"\" ?",
         aligntexto: "text-center",
         sizetexto: "text-lg",
         botones:{ Bcerrar:true, Benviar:true },
         txtbotones: { Bcerrar: "No", Benviar: "Eliminar" },
         ClickCancel:()=>CerrarAviso(),
         ClickConfirm:()=>EliminarCargarCobertura(idCobertura),
      })
    }

    const EliminarCargarCobertura = async (idCobertura: number) => {
        const id = idCobertura;

        setAviso({...estadoInicialAviso})

        const fetchData = async () => {
            try {
                setShowSpinner(true);
                await eliminarCobertura(Number(id))                 
            } catch (error) {
                console.error("Error al obtener datos:", error);
            } finally {
                setShowSpinner(false);
                setViewCargarPuesto({ show: false });
                setTipoStatus({ show: false, valor: "" });
                setVolcado2(true);
                formikRef?.current?.setTouched({
                    estatus: false,
                    colaborador: false,
                });
            }
        };

        fetchData();
    }
    
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);
    const GenerarPDF = async () => {
        setAviso({...estadoInicialAviso})

        //const nombrecliente= dataUser?.clientes.find(cliente => cliente.id_cliente === Number(formikRef?.current?.values.cliente))?.nombre_cliente || "Cliente Desconocido";
        const nombrecliente= arrayClientes.find(cliente => cliente.id === Number(formikRef?.current?.values.cliente))?.nombre || "Cliente Desconocido";
        const Hentrada= formikRef?.current?.values.hentrada || "00:00";
        const Hsalida= formikRef?.current?.values.hsalida || "00:00";
        const fecha= formikRef?.current?.values.fecha || "00/00/0000";

        const fetchData = async () => {
            try {
                setShowSpinner(true);
                const body = {
                    fecha: fecha,
                    cliente: nombrecliente,
                    hentrada: Hentrada,
                    hsalida: Hsalida,
                    location: window.location.origin,
                    sucursales: arraySucursales,
                    ArraySucursales: ArraySucursales,
                    personal: ArrayPersonal,
                    estatuspuesto: ArrayEstatusPuesto,
                    estructuras: ArrayEstructura,
                    cobertura: ArrayCobertura,
                };

                const response = await fetch(`/w_generarpdfcobertura`, {
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
                setViewCargarPuesto({ show: false });
                setTipoStatus({ show: false, valor: "" });
                setVolcado2(true);
                formikRef?.current?.setTouched({
                    estatus: false,
                    colaborador: false,
                });
            }
        };

        fetchData();
    }

    useEffect( () => {

        if(Volcado){
            let fecha=formikRef?.current?.values.fecha
            let cliente=formikRef?.current?.values.cliente
            let hentrada=formikRef?.current?.values.hentrada
            let hsalida=formikRef?.current?.values.hsalida
            if(fecha!="" && cliente!="" && hentrada!="" && hsalida!=""){               
                async function main() {
                    try {
                        setShowSpinner(true);
                         const [estatusData, personalData, estructuraData, coberturaData] = await Promise.all([
                            obtenerEstatusPuesto(),
                            obtenerPersonalCobertura(Number(cliente), 16),
                            obtenerEstructuraCobertura(Number(cliente), 16, String(fecha), String(hentrada), String(hsalida)),
                            obtenerCobertura(Number(cliente), 16, String(fecha))
                        ]);
                        setArrayEstatusPuesto(estatusData as TypeEstatusPuesto[]);
                        setArrayPersonal(personalData as Personal[]);
                        setArrayEstructura((estructuraData as { estructurasFiltradas: any[] }).estructurasFiltradas)
                        setArraySucursales((estructuraData as { sucursales: any[] }).sucursales)
                        setArrayCobertura(coberturaData as any[]);
                        //setSelectedPersonal((coberturaData as any[]).map((cobertura: any) => cobertura.id_personal));
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
        if(Volcado2){
            let fecha=formikRef?.current?.values.fecha
            let cliente=formikRef?.current?.values.cliente
            let hentrada=formikRef?.current?.values.hentrada
            let hsalida=formikRef?.current?.values.hsalida
            if(fecha!="" && cliente!="" && hentrada!="" && hsalida!=""){
                async function main() {
                    try {
                        setShowSpinner(true);
                         const [coberturaData] = await Promise.all([
                            obtenerCobertura(Number(cliente), 16, String(fecha))
                        ]);
                        setArrayCobertura(coberturaData as any[]);
                        //setSelectedPersonal((coberturaData as any[]).map((cobertura: any) => cobertura.id_personal));
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
            setVolcado2(false)
        }
        
    }, [Volcado, Volcado2]);

    useEffect(() => {
        if(!dataUser?.V_T && arrayClientes.length === 1) {
            formikRef?.current?.setFieldValue('cliente', arrayClientes[0].id);
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
                    hentrada:"",
                    hsalida:"",
                    estatus: '',
                    colaborador: '',
                    observacion: '',
                    gerencia: 16,
                    estructura: '',
                    sucursal: '',
                    usuario: dataUser?.id
                }}
                validate={(values) => {
                    const errors: { fecha?: string; cliente?: string; hentrada?: string; hsalida?: string; estatus?: string; colaborador?: string|number; } = {};
                    if (!values.fecha) {
                        errors.fecha = "Por favor, seleccione un item";
                    }
                    if (!values.hentrada) {
                        errors.hentrada = "Por favor, seleccione un item";
                    }
                    if (!values.hsalida) {
                        errors.hsalida = "Por favor, seleccione un item";
                    }
                    if (!values.cliente) {
                        errors.cliente = "Por favor, seleccione un item";
                    }
                    if (!values.estatus) {
                        errors.estatus = "Por favor, seleccione un item";
                    }
                    if (!values.colaborador) {
                        errors.colaborador = "Por favor, seleccione un item";
                    }
                    return errors;
                }}
                onSubmit={async (values, { resetForm }) => {
                    const fecha = String(values.fecha);
                    const cliente = Number(values.cliente);
                    const estatus = Number(values.estatus);
                    const colaborador = Number(values.colaborador);
                    const observacion = String(values.observacion);
                    const gerencia = Number(values.gerencia);
                    const estructura = Number(values.estructura);
                    const sucursal = Number(values.sucursal);
                    const usuario = Number(values.usuario);
                    let descripcionEstatus = '';

                    if(colaborador === 0) {
                        switch (estatus) {
                            case 2:
                            descripcionEstatus = 'Puesto No Cubierto';
                            break;
                            case 3:
                            descripcionEstatus = 'Puesto Sin Comunicación';
                            break;
                            case 4:
                            descripcionEstatus = 'Puesto No Aplica';
                            break;    
                            default:
                            break;
                        }
                    }
                    try {
                        await agregarCobertura(fecha, cliente, sucursal, estructura, estatus, colaborador, observacion, descripcionEstatus, gerencia, usuario);
                        resetForm({ 
                            values: { 
                                fecha:values.fecha,
                                hentrada:values.hentrada,
                                hsalida:values.hsalida,
                                cliente:values.cliente,
                                estatus: '',
                                colaborador: '',
                                observacion: '',
                                sucursal: '',
                                estructura: '',
                                gerencia: 16,
                                usuario:values.usuario,
                            },
                        });                            
                    } catch (error: any) {
                        console.error('Error:', error);
                    } finally {
                        setViewCargarPuesto({ show: false });
                        setTipoStatus({ show: false, valor: "" });
                        setVolcado2(true)
                    }
                }}
            >
                {({ isSubmitting, values, touched, errors, handleChange, handleBlur, handleSubmit, setFieldValue }) => { 

                    const sucursalesCoincidentes = arraySucursales.filter(sucursal => ArraySucursales.some(s => s === sucursal.id) );

                    const personalEstructuraCobertura: (string | number | readonly string[] | undefined)[]=[];
                    const Hentrada: (string | number | readonly string[] | undefined)[]=[];
                    const Hsalida: (string | number | readonly string[] | undefined)[]=[];

                    if(values.fecha !== "" && values.cliente !== "" && values.hentrada !== "" && values.hsalida !== "") {
                        for (let i = 0; i < ArrayEstructura.length; i++) {
                            const est = ArrayEstructura[i];
                            for (let j = 0; j < ArrayCobertura.length; j++) {
                                const cob = ArrayCobertura[j];
                                if (est.id === cob.estructura.id && est.idsucursal === cob.idsucursal) {
                                    personalEstructuraCobertura.push(cob.idpersonal);
                                    if(!Hentrada.includes(est.h_entrada)) Hentrada.push(est.h_entrada);
                                    if(!Hsalida.includes(est.h_salida)) Hsalida.push(est.h_salida);
                                    break;
                                }
                            }
                        } 
                    }
                    const personalOptions = ArrayPersonal
                    .filter(person => !personalEstructuraCobertura.includes(person?.id))
                    .map(person => ({
                        value: person?.id?.toString(),
                        label: `${person.nombres ?? ""} ${person.apellidos ?? ""}`.trim().replace(/\s+/g, ' '),
                        cargo: person?.cargo?.nombre,
                    }));
                    const formatOptionLabel = (option: any) => (
                        <div>
                            <div style={{ fontWeight: "bold", fontSize: "0.7rem" }}>{option.label}</div>
                            <div style={{ fontSize: "0.4rem" }}>{option.cargo}</div>
                        </div>
                    );

                    let PC: number[]=[]

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
                                                onChange={(e)=>{handleChange(e)}}
                                                onBlur={(e)=>{handleBlur(e)}}
                                                onClick={() => {
                                                    !dataUser?.V_T && arrayClientes.length === 1 ? values.cliente: values.cliente=""
                                                    values.hentrada=""
                                                    values.hsalida=""
                                                    setTableCoincidencia(false)
                                                    
                                                    setVolcado(true)
                                                }}
                                            />
                                            {(touched.fecha && errors.fecha) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.fecha}</div>)}
                                        </div>
                                        <div className="w-auto m-1 p-4 bg-blue-900 flex flex-col justify-center items-center rounded-md">
                                            <label htmlFor="hentrada" className="font-bold text-white mb-2">Entrada</label>
                                            <input 
                                                type="time"
                                                id="hentrada" 
                                                name="hentrada"
                                                className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                aria-invalid={(touched.hentrada && errors.hentrada) ? "true" : undefined}
                                                aria-describedby={(touched.hentrada && errors.hentrada) ? "nombre-error" : undefined}
                                                value={values.hentrada}
                                                onChange={(e)=>{handleChange(e)}}
                                                onBlur={(e)=>{handleBlur(e)}}
                                                onClick={() => {
                                                    !dataUser?.V_T && arrayClientes.length === 1 ? values.cliente: values.cliente=""
                                                    values.hsalida=""
                                                    setTableCoincidencia(false)
                                                    
                                                    setVolcado(true)
                                                }}

                                            />
                                            {(touched.hentrada && errors.hentrada) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.hentrada}</div>)}
                                        </div>
                                        <div className="w-auto m-1 p-4 bg-blue-900 flex flex-col justify-center items-center rounded-md">
                                            <label htmlFor="hsalida" className="font-bold text-white mb-2">Salida</label>
                                            <input 
                                                type="time"
                                                id="hsalida" 
                                                name="hsalida"
                                                className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                aria-invalid={(touched.hsalida && errors.hsalida) ? "true" : undefined}
                                                aria-describedby={(touched.hsalida && errors.hsalida) ? "nombre-error" : undefined}
                                                value={values.hsalida}
                                                onChange={(e)=>{handleChange(e); ChangeSalida(e)}}
                                                onBlur={(e)=>{handleBlur(e)}}
                                                onClick={() => {
                                                    !dataUser?.V_T && arrayClientes.length === 1 ? values.cliente: values.cliente=""
                                                    setTableCoincidencia(false)
                                                    
                                                }}

                                            />
                                            {(touched.hsalida && errors.hsalida) && (<div id='nombre-error' className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.hsalida}</div>)}
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
                                            {sucursalesCoincidentes.length > 0 ? (
                                                sucursalesCoincidentes.map((sucursal, i) => {

                                                    const pacTBySucursal: Record<number, number> = {};
                                                        sucursalesCoincidentes.forEach(sucursal => {
                                                        const estructuraSucursal = ArrayEstructura.filter(e => e.idsucursal === sucursal.id);
                                                        pacTBySucursal[sucursal.id] = estructuraSucursal.length;
                                                    });
                                                    
                                                    const pacBySucursal: Record<number, number> = {};
                                                        sucursalesCoincidentes.forEach(sucursal => {

                                                        const estructurasSucursal = ArrayEstructura
                                                            .filter(e => e.idsucursal === sucursal.id)
                                                            .map(e => e.id);

                                                        const coberturaSucursal = ArrayCobertura.filter(e =>
                                                            e.idsucursal === sucursal.id &&
                                                            estructurasSucursal.includes(e.estructura.id) &&
                                                            [1, 2, 3, 4].includes(e.estatuspuesto.id)
                                                        );
                                                        pacBySucursal[sucursal.id] = coberturaSucursal.length;
                                                    });
                                                    if (pacBySucursal[sucursal.id] !== 0) {
                                                        PC.push(pacBySucursal[sucursal.id]);
                                                    }
                                                    
                                                    const pcBySucursal: Record<number, number> = {};
                                                        sucursalesCoincidentes.forEach(sucursal => {

                                                        const estructurasSucursal = ArrayEstructura
                                                            .filter(e => e.idsucursal === sucursal.id)
                                                            .map(e => e.id);

                                                        const coberturaSucursal = ArrayCobertura.filter(e =>
                                                            e.idsucursal === sucursal.id &&
                                                            estructurasSucursal.includes(e.estructura.id) &&
                                                            [1].includes(e.estatuspuesto.id)
                                                        );
                                                        pcBySucursal[sucursal.id] = coberturaSucursal.length;
                                                    });
                                                    
                                                    const pncBySucursal: Record<number, number> = {};
                                                        sucursalesCoincidentes.forEach(sucursal => {

                                                        const estructurasSucursal = ArrayEstructura
                                                            .filter(e => e.idsucursal === sucursal.id)
                                                            .map(e => e.id);

                                                        const coberturaSucursal = ArrayCobertura.filter(e =>
                                                            e.idsucursal === sucursal.id &&
                                                            estructurasSucursal.includes(e.estructura.id) &&
                                                            [2].includes(e.estatuspuesto.id)
                                                        );
                                                        pncBySucursal[sucursal.id] = coberturaSucursal.length;
                                                    });
                                                    const scBySucursal: Record<number, number> = {};
                                                        sucursalesCoincidentes.forEach(sucursal => {

                                                        const estructurasSucursal = ArrayEstructura
                                                            .filter(e => e.idsucursal === sucursal.id)
                                                            .map(e => e.id);

                                                        const coberturaSucursal = ArrayCobertura.filter(e =>
                                                            e.idsucursal === sucursal.id &&
                                                            estructurasSucursal.includes(e.estructura.id) &&
                                                            [3].includes(e.estatuspuesto.id)
                                                        );
                                                        scBySucursal[sucursal.id] = coberturaSucursal.length;
                                                    });
                                                    const naBySucursal: Record<number, number> = {};
                                                        sucursalesCoincidentes.forEach(sucursal => {

                                                        const estructurasSucursal = ArrayEstructura
                                                            .filter(e => e.idsucursal === sucursal.id)
                                                            .map(e => e.id);

                                                        const coberturaSucursal = ArrayCobertura.filter(e =>
                                                            e.idsucursal === sucursal.id &&
                                                            estructurasSucursal.includes(e.estructura.id) &&
                                                            [4].includes(e.estatuspuesto.id)
                                                        );
                                                        naBySucursal[sucursal.id] = coberturaSucursal.length;
                                                    });
                                                    
                                                    return (
                                                        <React.Fragment key={`divsuc2_${sucursal.id}`}>
                                                            <div className="rounded-lg bg-blue-900 py-1 px-1 mt-4">
                                                                <div className="flex flex-row justify-between items-center m-2 flex-wrap">
                                                                    <div className="flex flex-col font-bold text-white"> <span className="text-xs">{sucursal.nombre}</span> </div>
                                                                    <div className="flex flex-row justify-between items-center">
                                                                    <div className="flex flex-col justify-center items-center mx-4">
                                                                        <span className="text-sm font-bold text-white">PAC</span>
                                                                        <div id={`pac_${i}`} className="w-16 bg-yellow-500 p-1 rounded-lg text-center font-bold text-white">{pacBySucursal[sucursal.id]}/{pacTBySucursal[sucursal.id]}</div>
                                                                    </div>
                                                                    <div className="flex flex-col justify-center items-center mx-2">
                                                                        <span className="text-2xl font-bold text-white">=</span>
                                                                    </div>
                                                                    <div className="flex flex-col justify-center items-center mx-2">
                                                                        <span className="text-sm font-bold text-white">PC</span>
                                                                        <div id={`pc_${i}`} className="w-14 bg-green-900 p-1 rounded-lg text-center font-bold text-white">{pcBySucursal[sucursal.id]}</div>
                                                                    </div>
                                                                    <div className="flex flex-col justify-center items-center mx-0.1">
                                                                        <span className="text-2xl font-bold text-white">+</span>
                                                                    </div>
                                                                    <div className="flex flex-col justify-center items-center mx-2">
                                                                        <span className="text-sm font-bold text-white">PNC</span>
                                                                        <div id={`pnc_${i}`} className="w-14 bg-red-900 p-1 rounded-lg text-center font-bold text-white">{pncBySucursal[sucursal.id]}</div>
                                                                    </div>
                                                                    <div className="flex flex-col justify-center items-center mx-0.1">
                                                                        <span className="text-2xl font-bold text-white">+</span>
                                                                    </div>
                                                                    <div className="flex flex-col justify-center items-center mx-2">
                                                                        <span className="text-sm font-bold text-white">SC</span>
                                                                        <div id={`sc_${i}`} className="w-14 bg-orange-400 p-1 rounded-lg text-center font-bold text-white">{scBySucursal[sucursal.id]}</div>
                                                                    </div>
                                                                    <div className="flex flex-col justify-center items-center mx-0.1">
                                                                        <span className="text-2xl font-bold text-white">+</span>
                                                                    </div>
                                                                    <div className="flex flex-col justify-center items-center mx-2">
                                                                        <span className="text-sm font-bold text-white">N/A</span>
                                                                        <div id={`na_${i}`} className="w-14 bg-orange-600 p-1 rounded-lg text-center font-bold text-white">{naBySucursal[sucursal.id]}</div>
                                                                    </div>
                                                                    </div>
                                                                </div>
                                                                <div className="w-full bg-white mt-2">
                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                        <thead className="bg-blue-900">
                                                                            <tr className="bg-blue-900 text-white">
                                                                                <th style={{width:"30%"}} scope="col" className="py-3 text-sm border border-slate-300 font-bold text-center text-white"><span className="flex justify-center text-2xl"><BsFillPinMapFill /></span></th>
                                                                                <th style={{width:"10%"}} scope="col" className="py-3 text-sm border border-slate-300 font-bold text-center text-white"><span className="flex justify-center text-2xl"><BsFillClockFill /></span></th>
                                                                                <th style={{width:"5%" }}scope="col" className="py-3 text-sm border border-slate-300 font-bold text-center text-white"><span className="flex justify-center text-2xl"><BsFillClipboardCheckFill /></span></th>
                                                                                <th style={{width:"auto%"}} scope="col" className="py-3 text-sm border border-slate-300 font-bold text-center text-white"><span className="flex justify-center text-2xl"><BsFillPeopleFill /></span></th>
                                                                                <th style={{width:"5%" }}scope="col" className="py-3 text-sm border border-slate-300 font-bold text-center text-white"><span className="flex justify-center text-2xl"><BsFillBinocularsFill /></span></th>
                                                                                <th style={{width:"5%" }}scope="col" className="py-3 text-sm border border-slate-300 font-bold text-center text-white"></th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {ArrayEstructura.filter(e => e.idsucursal === sucursal.id).map((estructura) => {
                                                                                const timePartE = estructura.h_entrada.split(':');
                                                                                const timePartS = estructura.h_salida.split(':');
                                                                                const [hE, mE] = timePartE.map(Number);
                                                                                const [hS, mS] = timePartS.map(Number);

                                                                                const matchedCobertura = ArrayCobertura.find(cobertura =>
                                                                                    cobertura.idsucursal === sucursal.id &&
                                                                                    cobertura.estructura.id === estructura.id
                                                                                );
                                                                                const personalCobertura = matchedCobertura ? matchedCobertura.idpersonal : null;
                                                                                let colaboradorCobertura= null;
                                                                                let sincolaboradorCobertura= null;
                                                                                if(personalCobertura===null || personalCobertura===undefined || personalCobertura === 0) {
                                                                                    sincolaboradorCobertura = ArrayEstatusPuesto.find(option => option.id === matchedCobertura?.estatuspuesto?.id);
                                                                                }else if(personalCobertura > 0) {
                                                                                    colaboradorCobertura = ArrayPersonal.find(option => option.id === personalCobertura);
                                                                                }

                                                                                return (
                                                                                    <tr key={`estruc_${estructura.id}`} className="border-b">
                                                                                      <>
                                                                                        <td className="px-2 py-0.5 text-xs border border-slate-300 text-left">{estructura.nombre}</td>
                                                                                        <td className="px-0.5 py-0.5 text-xs border border-slate-300 text-center">
                                                                                            <div className="flex flex-col">
                                                                                                <span>E: {hE > 9 ? hE : `0${hE}`}:{mE > 9 ? mE : `0${mE}`}</span>
                                                                                                <span>S: {hS > 9 ? hS : `0${hS}`}:{mS > 9 ? mS : `0${mS}`}</span>
                                                                                            </div>
                                                                                        </td>
                                                                                        {matchedCobertura ? (
                                                                                            <>
                                                                                                <td className={`${matchedCobertura.estatuspuesto.id === 1 ? 'bg-green-900' : matchedCobertura.estatuspuesto.id === 2 ? 'bg-red-900' : matchedCobertura.estatuspuesto.id === 3 ? 'bg-orange-400' : 'bg-orange-600'} px-0.5 py-0.5 text-xs border border-slate-300 text-center text-white`}>
                                                                                                    <span > {matchedCobertura.estatuspuesto.letra} </span>
                                                                                                </td>
                                                                                                <td className="px-1 text-xs border border-slate-300 text-left">
                                                                                                    {personalCobertura ? (
                                                                                                        <span>{colaboradorCobertura ? colaboradorCobertura.nombres + " " + colaboradorCobertura.apellidos + ", C.I: " + new Intl.NumberFormat('es-ES').format(colaboradorCobertura.nrocedula) : "N/A"}</span>
                                                                                                    ) : (
                                                                                                        <span>{sincolaboradorCobertura ? sincolaboradorCobertura.nombre : "N/A"}</span>
                                                                                                    )}
                                                                                                </td>
                                                                                                <td className='px-1 border border-slate-300 text-center'>
                                                                                                    {matchedCobertura.obs ? (
                                                                                                        <span className="flex justify-center text-2xl cursor-pointer" title={matchedCobertura.obs}><BsFillBinocularsFill /></span>
                                                                                                    ) : (null)}
                                                                                                </td>
                                                                                                <td className='px-1 border border-slate-300 text-center'>
                                                                                                    <button type='button' className="text-2xl text-red-900 cursor-pointer" onClick={() => PreguntarEliminarCobertura(matchedCobertura.id, sucursal.nombre, estructura.nombre)}><BsFillTrashFill /></button>
                                                                                                </td>
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <td className="px-0.5 py-0.5 text-xs border border-slate-300 text-center">
                                                                                                    {dataUser?.V_T || dataUser?.F_23 ? (
                                                                                                        <button type="button" className="text-2xl text-green-500 cursor-pointer" onClick={() => ViewCargarCobertura( sucursal.id, sucursal.nombre, estructura.id, estructura.nombre, `${hE}:${mE}`, `${hS}:${mS}` ) } > <BsFillCloudUploadFill /> </button>
                                                                                                    ) : (
                                                                                                        <span></span>
                                                                                                    )}
                                                                                                </td>
                                                                                                <td className="px-0.5 py-0.5 text-xs border border-slate-300 text-center"></td>
                                                                                                <td className="px-0.5 py-0.5 text-xs border border-slate-300 text-center"></td>
                                                                                                <td className="px-0.5 py-0.5 text-xs border border-slate-300 text-center"></td>
                                                                                            </>
                                                                                        )}
                                                                                      </>                                                                                        
                                                                                    </tr>
                                                                                )
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                            {ViewCargarPuesto.show && (
                                                                <>
                                                                    <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                                                                        <div className="relative w-full md:w-7/10 lg:w-1/2">
                                                                            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full outline-none focus:outline-none bg-blue-900">
                                                                                <div className="flex justify-center items-center rounded-t">
                                                                                    <span className="p-2"><BsFillClipboardCheckFill className="text-white text-5xl" /></span>
                                                                                </div>
                                                                                <div className="relative p-4 flex-auto text-white">
                                                                                    <h1 className="text-2xl font-bold mb-4 text-center">CARGA DE PUESTO DE SERVICIO</h1>
                                                                                    <div className="bg-white">
                                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                                        <thead className="bg-blue-900">
                                                                                            <tr>
                                                                                                <th scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">SUCURSAL</th>
                                                                                                <th scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">PUESTO</th>
                                                                                                <th scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">HORARIO</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td className="px-2 py-0.5 text-xs border border-slate-300 text-black text-center">{ViewCargarPuesto.nombre_sucursal}</td>
                                                                                                <td className="px-2 py-0.5 text-xs border border-slate-300 text-black text-center">{ViewCargarPuesto.nombre_puesto}</td>
                                                                                                <td className="px-2 py-0.5 text-xs border border-slate-300 text-black text-center">E:{ViewCargarPuesto.entrada} - S:{ViewCargarPuesto.salida}</td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                                        <thead className="bg-blue-900">
                                                                                            <tr>
                                                                                                <th style={{width:"20%"}} scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">STATUS</th>
                                                                                                <th style={{width:"auto%"}} scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">COLABORADOR</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td className="text-xs border border-slate-300 text-black text-center">
                                                                                                <select
                                                                                                    name="estatus"
                                                                                                    id="estatus"
                                                                                                    className="form-select block w-full px-1 py-0.5 text-sm font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                                                                    value={values.estatus}
                                                                                                    onChange={e => { handleChange(e); ChangeStatus(e); }}
                                                                                                    onBlur={(e) => handleBlur(e)}
                                                                                                    onClick={() => {
                                                                                                        values.colaborador = ""
                                                                                                    }}
                                                                                                >
                                                                                                    <option value="">--</option>
                                                                                                    {ArrayEstatusPuesto.map((status, index) => (
                                                                                                        <option key={`status_${index}`} value={status.id} title={status.nombre}>{status.letra}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                                {touched.estatus && errors.estatus && <div className="text-sm font-semibold text-red-500 italic">{errors.estatus}</div>}
                                                                                                </td>
                                                                                                <td className="text-xs border border-slate-300 text-black text-left">
                                                                                                {TipoStatus.show ?(
                                                                                                    TipoStatus.valor === 1 ? (
                                                                                                        <Select
                                                                                                            id="colaborador"
                                                                                                            name="colaborador"
                                                                                                            options={personalOptions}
                                                                                                            value={personalOptions.find(option => option.value === values.colaborador) || null}
                                                                                                            onChange={option => { setFieldValue('colaborador', option ? option.value : null); setFieldValue('estructura', ViewCargarPuesto.id_puesto); setFieldValue('sucursal', ViewCargarPuesto.id_sucursal); }}
                                                                                                            onBlur={(e:any) => handleBlur(e)}
                                                                                                            placeholder="Selección..."
                                                                                                            isClearable
                                                                                                            className="w-full"
                                                                                                            classNamePrefix="react-select"
                                                                                                            formatOptionLabel={formatOptionLabel}
                                                                                                        />
                                                                                                    ):(
                                                                                                        <select
                                                                                                            name="colaborador"
                                                                                                            id="colaborador"
                                                                                                            className="form-select block w-full px-1 py-0.5 text-sm font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                                                                            value={values.colaborador}
                                                                                                            onChange={e => { handleChange(e); setFieldValue('estructura', ViewCargarPuesto.id_puesto); setFieldValue('sucursal', ViewCargarPuesto.id_sucursal); }}
                                                                                                            onBlur={(e) => handleBlur(e)}
                                                                                                        >
                                                                                                            {TipoStatus.valor == 2 &&
                                                                                                            <>
                                                                                                                <option value="">--</option>
                                                                                                                <option value={0}>PUESTO NO CUBIERTO</option>
                                                                                                            </>
                                                                                                            }
                                                                                                            {TipoStatus.valor == 3 &&
                                                                                                            <>
                                                                                                                <option value="">--</option>
                                                                                                                <option value={0}>PUESTO SIN COMUNICACIÓN</option>
                                                                                                            </>
                                                                                                            }
                                                                                                            {TipoStatus.valor == 4 &&
                                                                                                            <>
                                                                                                                <option value="">--</option>
                                                                                                                <option value={0}>NO APLICA</option>
                                                                                                            </>
                                                                                                            }
                                                                                                        </select>
                                                                                                    )
                                                                                                ):(null)}
                                                                                                {touched.colaborador && errors.colaborador && <div className="text-sm font-semibold text-red-500 italic">{errors.colaborador}</div>}
                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                                        <thead className="bg-blue-900">
                                                                                            <tr>
                                                                                                <th scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">OBSERVACIONES</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td className="px-2 py-0.5 text-xs border border-slate-300 text-black text-center">
                                                                                                <textarea
                                                                                                    name="observacion"
                                                                                                    id="observacion"
                                                                                                    cols={30}
                                                                                                    rows={5}
                                                                                                    className="form-select block w-full px-1 py-0.5 text-sm font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                                                                    value={values.observacion}
                                                                                                    onChange={e => { handleChange(e); }}
                                                                                                    onBlur={(e) => handleBlur(e)}
                                                                                                >
                                                                                                </textarea>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center justify-center rounded-b px-1">
                                                                                    <div className="grid gap-20 w-full grid-cols-2">
                                                                                    <button className="text-red-500 hover:bg-red-500 hover:text-white rounded-lg background-transparent font-bold uppercase px-4 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" type="button" onClick={()=>{CerrarAviso()}}>Cerrar</button>
                                                                                    {(Number(TipoStatus.valor) >= 1 && Number(TipoStatus.valor) <= 4) && values.colaborador &&
                                                                                        <button type="submit" className="text-green-500 hover:bg-green-500 hover:text-white rounded-lg background-transparent font-bold uppercase px-4 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 cursor-pointer">Cargar</button>
                                                                                    }
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="opacity-50 fixed inset-0 z-40 bg-blue-900/75"></div>
                                                                </>
                                                            )}
                                                        </React.Fragment>
                                                    )
                                                })  
                                            ) : (
                                                <div>No hay coincidencias</div>
                                            )}
                                            {PC && PC.length > 0 ? (
                                                <div className="flex justify-center items-center mt-4">
                                                    <button type="button" className="inline-block px-3 py-2.5 bg-blue-900 text-white font-medium text-lg leading-tight uppercase rounded-lg shadow-md hover:bg-sky-700 hover:shadow-lg focus:bg-sky-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-sky-800 active:shadow-lg transition duration-150 ease-in-out cursor-pointer" onClick={()=> GenerarPDF()}><BsFillPrinterFill/></button>
                                                </div>
                                            ):(null)}
                                            {pdfBase64 && (
                                                <>
                                                    <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                                                        <div className="relative my-6 mx-auto w-2/3" style={{ height: '80vh' }}>
                                                            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full h-full outline-none focus:outline-none bg-sky-900">
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
                                                                        <button className="text-red-500 hover:bg-red-500 hover:text-white rounded-lg background-transparent font-bold uppercase px-4 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" type="button" onClick={() => setPdfBase64(null)} > Cerrar </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="opacity-50 fixed inset-0 z-40 bg-sky-900"></div>
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
