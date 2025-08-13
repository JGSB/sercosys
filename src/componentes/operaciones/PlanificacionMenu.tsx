import { Formik, type FormikProps } from "formik";
import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import type { TypeArrayCliente, TypeArraySucursal, TypeFichaMenu, TypePlanificacionMenu } from "../../util/types";
import Spinner from "../modal/Spinner";
import AvisoModal, { estadoInicialAviso } from "../modal/AvisoModal";
import { agregarPlanificacionMenu, eliminarPlanificacionMenu, obtenerFichaMenu, obtenerParteMenu, obtenerPlanificacionMenu } from "../../consultasDB/apiSupabase";
import { BsFillClipboardCheckFill, BsFillCloudUploadFill, BsFillXCircleFill } from "react-icons/bs";
import Button from "../../ui/Button";
import React from "react";

export default function PlanificacionMenu() {
    const { dataUser, idscliente, idssucursal } = useAuth();
    const arrayClientes = (idscliente || []) as unknown as TypeArrayCliente[];
    const arraySucursales = (idssucursal || []) as unknown as TypeArraySucursal[];

    const [ShowSpinner, setShowSpinner] = useState(false)
    const [Aviso, setAviso] = useState(estadoInicialAviso);
    const [TableCoincidencia, setTableCoincidencia] = useState(false);

    const formikRef = useRef<FormikProps<{
        semana: string;
        fecha: string;
        cliente: string | number;
        sucursal: string | number;
        tipomenu: string | number;
        partemenu: string | number;
        fichamenu: string | number;
        cantidad: string | number;
        usuario: number | undefined;
    }> | null>(null);

    interface ViewCargarMenu {
        show: boolean;
        idtipomenu: number | string;
        nombretipomenu: string;
        idpartemenu: number | string;
        nombreparte: string;
        letradiasemana: string;
        tipologia: string | string[];
        cantidad: boolean;
        yyyymmdd: string;
        ddmmyyyy: string;
    }
    const estadoInicialCargarMenu = {
        show: false,
        idtipomenu:0,
        nombretipomenu:"",
        idpartemenu:0,
        nombreparte:"",
        tipologia: "",
        cantidad: false,
        letradiasemana: "",
        yyyymmdd: "",
        ddmmyyyy: ""
    }
    
    const CerrarAviso = () => {
        setAviso({...estadoInicialAviso})
        setViewCargarMenu({...estadoInicialCargarMenu})
        //setViewCantidad(false);        
        formikRef?.current?.setFieldValue('fecha', '');
        formikRef?.current?.setFieldValue('tipomenu', '');
        formikRef?.current?.setFieldValue('partemenu', '');
        formikRef?.current?.setFieldValue('fichamenu', '');
        formikRef?.current?.setFieldValue('cantidad', '');
        formikRef?.current?.setTouched({
            tipomenu: false,
            partemenu: false,
            fichamenu: false,
            fecha: false,
            cantidad: false
        });
    };

    const [ArraySucursales, setArraySucursales] = useState<any[]>([]);
    const [DiaSemana, setDiaSemana] = useState<Date[]>([]);
    const [Volcado, setVolcado] = useState(false);
    const [Volcado2, setVolcado2] = useState(false);
    const [VolcadoFecha, setVolcadoFecha] = useState(false);
    const [ArrayParteMenu, setArrayParteMenu] = useState<any[]>([]);
    const [ArrayFichaMenu, setArrayFichaMenu] = useState<TypeFichaMenu[]>([]);
    const [ArrayPlanificacionMenu, setArrayPlanificacionMenu] = useState<any[]>([]);
    const [ViewCargarMenu, setViewCargarMenu] = useState<ViewCargarMenu>(estadoInicialCargarMenu);
    //const [ViewCantidad, setViewCantidad] = useState(false);

    const ChangeCliente = (e: ChangeEvent<HTMLSelectElement>) => {
        formikRef?.current?.setFieldValue('cliente', e.target.value);

        const selectedClienteId = e.target.value;
        let filteredSucursales: any[] = [];

        if (selectedClienteId !== "") {
            const clienteIdNum = parseInt(selectedClienteId, 10);
            filteredSucursales = arraySucursales.filter(element => element.idcliente === clienteIdNum);
        }
        setArraySucursales(filteredSucursales);
        setVolcado(true)
    }

    const ChangeSucursal = (e: ChangeEvent<HTMLSelectElement>) => {  
        formikRef?.current?.setFieldValue('sucursal', e.target.value);
        setVolcado(true)
    }

    const CargarMenu = (idtipomenu:number, nombretipomenu:string, idparte:number, nombreparte:string, tipologia:string, cantidad:boolean, letradiasemana:string, fechaISO:string) => {

        let [dd,mm,yyyy]= fechaISO.split("-");
        formikRef?.current?.setFieldValue('tipomenu', idtipomenu);
        formikRef?.current?.setFieldValue('partemenu', idparte);
        formikRef?.current?.setFieldValue('fecha', `${yyyy}-${mm}-${dd}`);
        setViewCargarMenu({
            show: true,
            idtipomenu: idtipomenu,
            nombretipomenu: nombretipomenu,
            idpartemenu: idparte,
            nombreparte: nombreparte,
            tipologia: tipologia,
            cantidad: cantidad,
            letradiasemana: letradiasemana,
            yyyymmdd: `${yyyy}-${mm}-${dd}`,
            ddmmyyyy: fechaISO
        });
    }

    useEffect(() => {
        if(!dataUser?.V_T && arrayClientes.length === 1) {
            formikRef?.current?.setFieldValue('cliente', arrayClientes[0].id);
            ChangeCliente({ target: { value: arrayClientes[0].id } } as unknown as React.ChangeEvent<HTMLSelectElement>);
        }
    }, [dataUser, arrayClientes]);

    useEffect(() => {
        let semana = formikRef?.current?.values.semana
        let cliente = formikRef?.current?.values.cliente
        let sucursal = formikRef?.current?.values.sucursal

        if (Volcado) {
            if (semana !== "" && cliente !== "" && sucursal !== "") {
                async function main() {
                    try {
                        setShowSpinner(true);
                        const [parteMenuData, fichaMenuData, planificacionData] = await Promise.all([
                            obtenerParteMenu(),
                            obtenerFichaMenu(),
                            obtenerPlanificacionMenu(String(semana), Number(cliente), Number(sucursal)),
                        ]);
                        //console.log("parteMenuData:", parteMenuData);
                        //console.log("fichaMenuData:", fichaMenuData);
                        //console.log("planificacionData:", planificacionData);

                        //Inicio obtenerParteMenu()######################################
                            type ParteMenu = { tipomenu: any; };
                            const parteMenuArray = parteMenuData as Array<ParteMenu>;
        
                            const grupoPorTipoMenu = parteMenuArray.reduce((acc, elem) => {
                            if (!acc[elem.tipomenu.id]) {
                                acc[elem.tipomenu.id] = [];
                            }
                            acc[elem.tipomenu.id].push(elem);
                            return acc;
                            }, {} as Record<number, ParteMenu[]>);
        
                            const jsonParteMenu = Object.entries(grupoPorTipoMenu).map(([idtipomenu, items]) => ({
                                idtipomenu: Number(idtipomenu),
                                nombretipomenu: items[0].tipomenu.nombre,
                                rowspan: items.length+1,
                                partesMenu: items,
                            }));
                        //Fin obtenerParteMenu()###############################################
                        
                        setArrayFichaMenu(fichaMenuData as TypeFichaMenu[]);
                        setArrayParteMenu(jsonParteMenu);
                        setArrayPlanificacionMenu(planificacionData as TypePlanificacionMenu[]);
                        setTableCoincidencia(true);
                        
                    } catch (err) {
                        setTableCoincidencia(false);
                        console.error("Error en la función main:", err);
                    } finally {
                        setShowSpinner(false);
                    }
                }
                main(); 
            }
        }
        if (Volcado2) {
            if (semana !== "" && cliente !== "" && sucursal !== "") {
                async function main() {
                    try {
                        setShowSpinner(true);
                        const [planificacionData] = await Promise.all([
                            obtenerPlanificacionMenu(String(semana), Number(cliente), Number(sucursal))
                        ]);
                        //console.log("planificacionData:", planificacionData);
                        setArrayPlanificacionMenu(planificacionData as TypePlanificacionMenu[]);
                        setTableCoincidencia(true);
                        
                    } catch (err) {
                        setTableCoincidencia(false);
                        console.error("Error en la función main:", err);
                    } finally {
                        setShowSpinner(false);
                    }
                }
                main(); 
            }
        }
        return () => {
            setVolcado(false)
            setVolcado2(false)
        }
    }, [Volcado, Volcado2])

    useEffect(() => {

        if(VolcadoFecha) {
            let semana = formikRef?.current?.values.semana;

            if (typeof semana === "string" && semana !== "") {

                function diasDeSemana(semanaISO: string): Date[] {
                    const [anioStr, semanaStr] = semanaISO.split('-W');
                    const anio = parseInt(anioStr);
                    const semana = parseInt(semanaStr);
    
                    const enero4 = new Date(anio, 0, 4);
    
                    let diaSemanaEnero4 = enero4.getDay();
                    if (diaSemanaEnero4 === 0) diaSemanaEnero4 = 7;
    
                    const primerLunes = new Date(enero4);
                    primerLunes.setDate(enero4.getDate() - (diaSemanaEnero4 - 1));
    
                    const lunesSemana = new Date(primerLunes);
                    lunesSemana.setDate(primerLunes.getDate() + (semana - 1) * 7);
    
                    const dias = [];
                    for (let i = 0; i < 7; i++) {
                        const dia = new Date(lunesSemana);
                        dia.setDate(lunesSemana.getDate() + i);
                        dias.push(dia);
                    }
    
                    return dias;
                }
    
                const dias = diasDeSemana(semana);
                setDiaSemana(dias);
            }
    
            return () => {
                setVolcadoFecha(false)
            }

        }
        return () => {
            setVolcadoFecha(false)
        }
    }, [VolcadoFecha]);

    const PreguntarEliminarPlanificacionMenu= (id:number, nombretipomenu:string, letradiasemana:string, fechaISO:string, nombreparte:string) => {
        setAviso({         
            show: true,
            logo:'BsFillQuestionCircleFill',
            colorlogo: "text-orange-400",
            texto:"¿ Desea eliminar \n\""+nombreparte+"\"\ndel dia \n\""+letradiasemana+" "+fechaISO+"\" \ncorrespondiente al \n\""+nombretipomenu+"\"?",
            aligntexto: "text-center",
            sizetexto: "text-lg",
            botones:{ Bcerrar:true, Benviar:true },
            txtbotones: { Bcerrar: "No", Benviar: "Eliminar" },
            ClickCancel:()=>CerrarAviso(),
            ClickConfirm:()=>EliminarPlanificacionMenu(id),
        })
    }

    const EliminarPlanificacionMenu = async (id: number) => {

        setAviso({...estadoInicialAviso})

        const fetchData = async () => {
            try {
                setShowSpinner(true);
                await eliminarPlanificacionMenu(Number(id))                 
            } catch (error) {
                console.error("Error al obtener datos:", error);
            } finally {
                setShowSpinner(false);
                setVolcado2(true);
            }
        };

        fetchData();
    }

    /* const setSelFichaMenu = ( e: React.ChangeEvent<HTMLSelectElement>, cantidad: boolean ) => {
        const value = e.target.value;

        if (value === "" || !cantidad) {
            //setViewCantidad(false);
            formikRef?.current?.setFieldValue('cantidad', "0");
        } else {
            //setViewCantidad(true);
        }
    }; */

    if (!dataUser) {
        return <Spinner show={true} />
    }

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
                    fecha: '',
                    semana: '',
                    cliente: '',
                    sucursal: '',
                    tipomenu: '',
                    partemenu: '',
                    fichamenu: '',
                    cantidad: "",
                    usuario: dataUser?.id
                }}
                validate={(values) => {
                    const errors: { semana?: string; cliente?: string; sucursal?: string; menu?: string; fichamenu?: string; cantidad?: string } = {};
                    if (!values.semana) {
                        errors.semana = "Por favor, seleccione una item";
                    }
                    if (!values.cliente) {
                        errors.cliente = "Por favor, seleccione un item";
                    }
                    if (!values.sucursal) {
                        errors.sucursal = "Por favor, seleccione un item";
                    }
                    if (!values.fichamenu) {
                        errors.fichamenu = "Por favor, seleccione un item";
                    }
                    if (!values.cantidad) {
                        errors.cantidad = "Por favor, ingrese una cantidad";
                    }
                    return errors;
                }}
                onSubmit={async (values, {resetForm}) => {
                    const fecha = String(values.fecha);
                    const semana = String(values.semana);
                    const cliente = Number(values.cliente);
                    const sucursal = Number(values.sucursal);
                    const tipomenu = Number(values.tipomenu);
                    const partemenu = Number(values.partemenu);
                    const fichamenu = Number(values.fichamenu);
                    const cantidad = Number(values.cantidad);
                    const usuario = Number(values.usuario);
                    try {
                        await agregarPlanificacionMenu(semana, fecha, cliente, sucursal, tipomenu, partemenu, fichamenu, cantidad, usuario);
                        resetForm({ 
                            values: {
                                semana:values.semana,
                                cliente:values.cliente,
                                sucursal:values.sucursal,
                                fecha:"",
                                tipomenu:"",
                                partemenu:"",
                                fichamenu:"",
                                cantidad:"",
                                usuario:values.usuario,
                            },
                        }); 
                    } catch (error: any) {
                        console.error('Error:', error);
                    } finally {
                        setViewCargarMenu({ ...estadoInicialCargarMenu });
                        //setViewCantidad(false);
                        setVolcado2(true)
                    }
                }}
            >
                {({isSubmitting, values, touched, errors, handleChange, handleBlur, handleSubmit }) => {

                    return(
                        <>
                        {isSubmitting ? <Spinner show={true} /> : (null)}
                            <form method="post" className="space-y-5" onSubmit={handleSubmit}>
                                
                                <div className="w-full flex justify-around items-center flex-wrap">
                                    <div className="w-auto m-1 p-4 bg-blue-900 flex flex-col justify-center items-center rounded-md">
                                        <label htmlFor="semana" className="font-bold text-white mb-2">Semana</label>
                                        <input 
                                            type="week"
                                            id="semana" 
                                            name="semana"
                                            className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                            aria-invalid={(touched.semana && errors.semana) ? "true" : undefined}
                                            aria-describedby={(touched.semana && errors.semana) ? "nombre-error" : undefined}
                                            value={values.semana}
                                            onChange={(e)=>{handleChange(e); setVolcadoFecha(true)}}
                                            onBlur={(e)=>{handleBlur(e)}}
                                            onClick={() => {
                                                !dataUser?.V_T && arrayClientes.length === 1 ? values.cliente: values.cliente=""
                                                values.sucursal=""
                                                if (arrayClientes.length > 1) {
                                                    setArraySucursales([])
                                                }
                                                setVolcado(true)
                                                setTableCoincidencia(false)
                                            }}

                                        />
                                        {(touched.semana && errors.semana) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.semana}</div>)}
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
                                                onChange={(e) => { handleChange(e); ChangeCliente(e);}}
                                                onBlur={(e)=>{handleBlur(e)}}
                                                onClick={() => {
                                                    values.sucursal=""
                                                    setTableCoincidencia(false)
                                                }}
                                            >
                                                <option value=""> Selección...</option>
                                                {arrayClientes.map((cliente) => (
                                                    <option key={"cli_"+cliente.id} value={cliente.id}>
                                                        {cliente.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            {(touched.cliente && errors.cliente) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.cliente}</div>)}
                                        </div>
                                    )}
                                    <div className="w-auto m-1 p-4 bg-blue-900 flex flex-col justify-center items-center rounded-md">
                                        <label htmlFor="sucursal" className="font-bold text-white mb-2">Sucursal</label>
                                        <select 
                                            id="sucursal" 
                                            name="sucursal"
                                            className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none" 
                                            aria-invalid={(touched.sucursal && errors.sucursal) ? "true" : undefined}
                                            aria-describedby={(touched.sucursal && errors.sucursal) ? "nombre-error" : undefined}
                                            value={values.sucursal}
                                            onChange={(e) => { handleChange(e); ChangeSucursal(e); setArrayParteMenu([]); setVolcado(true);}}
                                            onBlur={(e)=>{handleBlur(e)}}
                                            onClick={() => {
                                                values.tipomenu=""
                                                values.partemenu=""
                                                values.fichamenu=""
                                                values.cantidad=""
                                                setViewCargarMenu({ ...estadoInicialCargarMenu });
                                                //setViewCantidad(false);
                                            }}
                                            
                                        >
                                            <option value="">Seleccione...</option>
                                            {ArraySucursales.map((sucursal) => (
                                                <option key={"suc_" + sucursal.id} value={sucursal.id}>
                                                    {sucursal.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        {(touched.sucursal && errors.sucursal) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.sucursal}</div>)}
                                    </div>
                                </div>

                                {TableCoincidencia ? (
                                    <>
                                        {ArrayParteMenu.map((menu) => {
                                            if (menu.partesMenu.length === 0) return null;
                                            return(
                                                <React.Fragment key={`menu_${menu.idtipomenu}`}>
                                                    <div className="w-full max-w-6xl overflow-x-scroll">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-blue-900">
                                                                <tr>
                                                                    <th style={{ width: '12%' }} scope="col" className=" px-1 py-3 text-sm border border-slate-300 font-bold text-center text-white">MENÚ</th>
                                                                    <th style={{ width: '12%' }} scope="col" className="px-1 py-3 text-sm border border-slate-300 font-bold text-center text-white">COMPONENTE</th>
                                                                    {DiaSemana.map((dia, index) => {
                                                                        let letradiasemana=dia.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase()
                                                                        let diasemana=dia.toISOString().substring(0, 10)
                                                                        let [yyyy, mm, dd] = diasemana.split("-");
                                                                        let fechaISO = `${dd}-${mm}-${yyyy}`;

                                                                        //const arrayCantidad = ArrayPlanificacionMenu.filter(planificacion =>
                                                                            //planificacion.fecha === diasemana && planificacion.idtipomenu === menu.idtipomenu
                                                                        //);
                                                                        //let cantidad = arrayCantidad.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);

                                                                        return (
                                                                            <React.Fragment key={`dia_${index}_${dia.getTime()}`}>
                                                                                <th scope="col" className="px-1 py-3 text-sm border border-slate-300 font-bold text-center text-white">
                                                                                    <div className="flex flex-col items-center">
                                                                                        <span className="text-nowrap">{letradiasemana}</span>
                                                                                        <span className="text-nowrap">{fechaISO}</span>
                                                                                        {/* <span className="text-xs text-nowrap">CANTD:{cantidad}</span> */}
                                                                                    </div>
                                                                                </th>
                                                                            </React.Fragment>
                                                                        )
                                                                    })}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <>
                                                                    <tr key={`menu-${menu.idtipomenu}`}>
                                                                        <td rowSpan={menu.rowspan} className="px-1 py-0.5 text-xs border border-slate-300 text-center font-bold text-nowrap">{menu.nombretipomenu}</td>
                                                                    </tr>

                                                                    {menu.partesMenu.map((parte: { id:number, idstipologia: string; nombre: string, cantidad: boolean }, index: number) => {

                                                                        return(
                                                                            <React.Fragment key={`${menu.idtipomenu}_parte_${index}`}>
                                                                                <tr>
                                                                                    <td className="px-1 py-0.5 text-xs border border-slate-300 text-left text-nowrap" title={menu.nombretipomenu}>{parte.nombre}</td>
                                                                                    {DiaSemana.map((dia, diaIndex) => {
                                                                                        let letradiasemana=dia.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase()
                                                                                        let diasemana=dia.toISOString().substring(0, 10)
                                                                                        let [yyyy, mm, dd] = diasemana.split("-");
                                                                                        let fechaISO = `${dd}-${mm}-${yyyy}`;
                                                                                        
                                                                                        const matchedPlanificacion = ArrayPlanificacionMenu.find(planificacion =>
                                                                                            planificacion.idpartemenu === parte.id && 
                                                                                            planificacion.fecha === diasemana
                                                                                        );

                                                                                        return(
                                                                                            <React.Fragment key={`${menu.idtipomenu}_dia_${diaIndex}_${dia.getTime()}`}>
                                                                                                <td className="p-1 text-xs border border-slate-300 text-center">
                                                                                                    {matchedPlanificacion ? (
                                                                                                        <div className="flex flex-col items-center justify-between">
                                                                                                            <div className="p-2 rounded [writing-mode:sideways-lr] [text-orientation:mixed]" title={`${matchedPlanificacion.fichamenu.nombre}\n${matchedPlanificacion.cantidad}`}>
                                                                                                                <span className="text-nowrap cursor-zoom-in"> {matchedPlanificacion.fichamenu.nombre} ({matchedPlanificacion.cantidad}) </span>
                                                                                                            </div>
                                                                                                            <button type="button" className="hover:bg-gray-200 text-red-500 cursor-pointer" title={`${menu.nombretipomenu}\n${letradiasemana} ${fechaISO}\n${parte.nombre}`} onClick={() => { PreguntarEliminarPlanificacionMenu(matchedPlanificacion.id, menu.nombretipomenu, letradiasemana, fechaISO, parte.nombre) }}><BsFillXCircleFill /></button>
                                                                                                        </div>

                                                                                                    ) : (
                                                                                                        <button type="button" className="text-2xl text-green-500 cursor-pointer" title={`${menu.nombretipomenu}\n${letradiasemana} ${fechaISO}\n${parte.nombre}`} onClick={() => {CargarMenu(menu.idtipomenu, menu.nombretipomenu, parte.id, parte.nombre, parte.idstipologia, parte.cantidad, letradiasemana, fechaISO)}}> <BsFillCloudUploadFill /> </button>
                                                                                                    )}
                                                                                                </td>
                                                                                            </React.Fragment>
                                                                                        )
                                                                                    })} 
                                                                                </tr>
                                                                            </React.Fragment>
                                                                        )
                                                                    })}
                                                                </>                                                                                                  
                                                            </tbody>
                                                        </table>                                
                                                    </div>
                                                </React.Fragment>
                                            )
                                        })}
                                        {ViewCargarMenu.show && (
                                            <>
                                                <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                                                    <div className="relative my-6 mx-2 max-w-full">
                                                        <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full outline-none focus:outline-none bg-blue-900">
                                                            <div className="flex justify-center items-center rounded-t">
                                                                <span className="p-2"><BsFillClipboardCheckFill className="text-white text-5xl" /></span>
                                                            </div>
                                                            <div className="relative px-4 py-2 flex-auto text-white">
                                                                <h1 className="text-2xl font-bold mb-4 text-center">CARGA DE MENÚ</h1>
                                                                <div className="bg-white">
                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                        <thead className="bg-blue-900">
                                                                            <tr>
                                                                                <th scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">FECHA</th>
                                                                                <th scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">MENÚ</th>
                                                                                <th scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">COMPONENTE</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr>
                                                                                <td className="px-2 py-0.5 text-xs border border-slate-300 text-black text-center">
                                                                                    <div className="flex flex-col items-center">
                                                                                        <span>{ViewCargarMenu.letradiasemana}</span>
                                                                                        <span>{ViewCargarMenu.ddmmyyyy}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-2 py-0.5 text-xs border border-slate-300 text-black text-center">{ViewCargarMenu.nombretipomenu}</td>
                                                                                <td className="px-2 py-0.5 text-xs border border-slate-300 text-black text-center">{ViewCargarMenu.nombreparte}</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                        <thead className="bg-blue-900">
                                                                            <tr>
                                                                                <th scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">FICHA</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <select
                                                                                        id="fichamenu"
                                                                                        name="fichamenu"
                                                                                        className="form-select block w-full py-0.5 text-xs text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                                                        aria-invalid={(touched.fichamenu && errors.fichamenu) ? "true" : undefined}
                                                                                        aria-describedby={(touched.fichamenu && errors.fichamenu) ? "nombre-error" : undefined}
                                                                                        value={values.fichamenu}
                                                                                        onChange={(e)=>{handleChange(e); /* setSelFichaMenu(e, ViewCargarMenu.cantidad) */}}
                                                                                        onBlur={(e)=>{handleBlur(e)}}

                                                                                    >
                                                                                    <option value="">Selección...</option>
                                                                                    {ArrayFichaMenu.map((ficha) =>
                                                                                        ViewCargarMenu.tipologia.includes(String(ficha.idtipologia)) ? (
                                                                                            <option
                                                                                                key={`ficha_${ficha.id}`}
                                                                                                value={ficha.id}
                                                                                                title={ficha.nombre}
                                                                                            >
                                                                                                {ficha.nombre}
                                                                                            </option>
                                                                                        ) : null
                                                                                    )}
                                                                                    </select>
                                                                                    {(touched.fichamenu && errors.fichamenu) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.fichamenu}</div>)}
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                        <thead className="bg-blue-900">
                                                                            <tr>
                                                                                <th scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">CANTIDAD</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr>
                                                                                <td className="text-xs border border-slate-300 text-black text-center">
                                                                                    <input 
                                                                                        type="number"
                                                                                        id="cantidad"
                                                                                        name="cantidad"
                                                                                        min={0}
                                                                                        aria-invalid={(touched.cantidad && errors.cantidad) ? "true" : undefined}
                                                                                        aria-describedby={(touched.cantidad && errors.cantidad) ? "nombre-error" : undefined}
                                                                                        className="form-select block w-full px-1 py-2"
                                                                                        value={values.cantidad}
                                                                                        onChange={(e)=>{handleChange(e);}}
                                                                                        onBlur={(e)=>{handleBlur(e)}}
                                                                                    />
                                                                                    {(touched.cantidad && errors.cantidad) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.cantidad}</div>)}
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    {/* {ViewCargarMenu.cantidad ? (
                                                                    ):(null)} */}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-center rounded-b p-2">
                                                                <div className="grid gap-20 w-full grid-cols-2">
                                                                    <Button type="button" variant="red900" className="" onClick={() => { CerrarAviso() }}>Cerrar</Button>
                                                                    {values.fichamenu != "" && values.cantidad ? (
                                                                        <>
                                                                            {isSubmitting ? (
                                                                                <span className="flex items-center"> Cargando... </span>
                                                                            )  : (
                                                                                <Button type="submit" variant="green900" className="">Cargar</Button>
                                                                            )}
                                                                        </>
                                                                    ):(null)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="opacity-50 fixed inset-0 z-40 bg-blue-900/75"></div>
                                            </>
                                        )}
                                    </>
                                ) : (null)}

                                {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                                
                            </form>
                        </>
                    )
                }}
            </Formik>
        </>
    );
}
