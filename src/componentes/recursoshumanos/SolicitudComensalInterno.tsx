import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { TypeArrayCliente, TypeArraySucursal, TypeArrayMenu, TypeArrayGerencia, TypeTipoComensal, TypeGerencia, TypeCargo, TypeSolicitudComensal } from "../../util/types";
import Spinner from "../../componentes/modal/Spinner";
import AvisoModal, { estadoInicialAviso } from "../../componentes/modal/AvisoModal";
import { Formik, type FormikProps } from "formik";
import Select from "react-select";
import { BsFillTrashFill } from "react-icons/bs";
import { ajustarFechaHora, separateDateAndTimeSis } from "../../util/workDate";
import { useAuth } from "../../context/AuthContext";
import { agregarSolicitudComensal, eliminarSolicitudComensal, Now, obtenerPersonalComensal, obtenerSolicitudComensal, obtenerTipoComensal } from "../../consultasDB/apiSupabase";
import Button from "../../ui/Button";

export default function SolicitudComensalInterno() {
    const { dataUser, idscliente, idssucursal, idsmenu, idsgerencia } = useAuth();
    const arrayClientes = (idscliente || []) as unknown as TypeArrayCliente[];
    const arraySucursales = (idssucursal || []) as unknown as TypeArraySucursal[];
    const arrayMenus = (idsmenu || []) as unknown as TypeArrayMenu[];
    const arrayGerencias = (idsgerencia || []) as unknown as TypeArrayGerencia[];

    const [ShowSpinner, setShowSpinner] = useState(false)
    const [Aviso, setAviso] = useState(estadoInicialAviso);
    const [TableCoincidencia, setTableCoincidencia] = useState(false);
    const formikRef = useRef<FormikProps<{
        fecha: string;
        cliente: string | number;
        sucursal: string | number;
        menu: string | number;
        cedula: string[];
        comensal: string[];
        filtromenu: any;
        usuario: number | undefined;
    }> | null>(null);

    interface Personal {
        nrocedula: number;
        nombres: string;
        apellidos: string;
        tipocomensal: TypeTipoComensal;
        cargo: TypeCargo;
        gerencia: TypeGerencia;
    }

    const [ArraySucursales, setArraySucursales] = useState<any[]>([]);
    const [ArrayMenus, setArrayMenus] = useState<any[]>([]);
    const [ArraySolicitud, setArraySolicitud] = useState<TypeSolicitudComensal[]>([]);
    const [ArrayPersonal, setArrayPersonal] = useState<Personal[]>([]);
    const [ArrayTipoComensal, setArrayTipoComensal] = useState<any[]>([]);
    const [Volcado, setVolcado] = useState(false);
    const [Volcado2, setVolcado2] = useState(false);
    const [SelectedPersonal, setSelectedPersonal] = useState<string[]>([]);
    const [SelectedTipoComensal, setSelectedTipoComensal] = useState<string[]>([]);
    type RowTabla = {
        gerencia: string;
        [key: string]: string | number;
    };
    const [datosTabla, setDatosTabla] = useState<RowTabla[]>([]);
    const [totalPorTipoComensal, setTotalPorTipoComensal] = useState<Record<string, number>>({});
    const [totalGeneral, setTotalGeneral] = useState(0);
    const estadoInicialViewInputCedula = {
        show: false,
        showMsg: false,
        Msg: ''
    }
    const [ViewInputCedula, setViewInputCedula] = useState(estadoInicialViewInputCedula);
    const estadoInicialViewTable = {
        textfecha:"",
        textcliente:"",
        textsucursal:"",
        textmenu:"",
        textedicion:"",
    };
    const [ViewTable, setViewTable] = useState(estadoInicialViewTable);

    const CerrarAviso = () => {
        setAviso({...estadoInicialAviso})
    };

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

        const selectedSucursalId = e.target.value;
        let filteredMenus: any[] = [];
        if (selectedSucursalId !== "") {
            const sucursalIdNum = parseInt(selectedSucursalId, 10);
            filteredMenus = arrayMenus.filter(element => element.idsucursal === sucursalIdNum);
        }
        setArrayMenus(filteredMenus);
        setVolcado(true)
    }

    const ChangeMenu = (e: ChangeEvent<HTMLSelectElement>) => {
        formikRef?.current?.setFieldValue('menu', e.target.value);
        const selectedMenuId = e.target.value;
        
        let filteredMenus: any[] = [];
        let textmenu=""
        if (selectedMenuId !== "") {
            const menuIdNum = parseInt(selectedMenuId, 10);
            filteredMenus = arrayMenus.filter(element => element.id === menuIdNum);
            const menuEncontrado = arrayMenus.find(element => element.id === menuIdNum);
            if (menuEncontrado) { 
                textmenu = menuEncontrado.nombre; 
                formikRef?.current?.setFieldValue('filtromenu', filteredMenus[0]);
            }
        }
        const fechaSe:any=formikRef.current?.values.fecha
        const clienteSe:any=formikRef.current?.values.cliente
        const sucursalSe:any=formikRef.current?.values.sucursal

        let textcliente=""
        let textsucursal=""

        const clienteYes = arrayClientes.find(element => element.id === parseInt(clienteSe, 10));
        if (clienteYes) { textcliente = clienteYes.nombre; }

        const sucursalYes = arraySucursales.find(element => element.id === parseInt(sucursalSe, 10));
        if (sucursalYes) { textsucursal = sucursalYes.nombre; }

        const [ySel, mSel, dSel]=fechaSe.split('-')
        const fechaSelA=new Date(ySel,mSel-1,dSel)

        if(e.target.value !==""){
            const fetchData = async () => {
                try {
                    setShowSpinner(true)
                    const now = ajustarFechaHora(new Date(await Now()));
                    let ySis= now.getFullYear();
                    let mSis= now.getMonth() + 1;
                    let dSis= now.getDate();
                    let hSis= now.getHours();
                    let iSis= now.getMinutes();
                    const fechaSisA=new Date(Number(ySis),Number(mSis)-1,Number(dSis))
                    const fechaSisB=new Date(Number(ySis),Number(mSis)-1,Number(dSis), Number(hSis), Number(iSis))
                    if(fechaSelA.getTime() < fechaSisA.getTime()){
                        setViewInputCedula({
                            show:false,
                            showMsg:true,
                            Msg: 'Solicitud no disponible, cerró el ('+dSel+'/'+mSel+'/'+ySel+')'
                        })
                    }else if(fechaSelA.getTime() > fechaSisA.getTime()){
                        setViewInputCedula({
                            show:true,
                            showMsg:false,
                            Msg: ''
                        })
                    }else{
                        const Restar= filteredMenus[0].antelacion===true ? 1: 0
                        let [Hm, Im, Sm] = filteredMenus[0].hora_tope.split(':');
                        
                        const newHoraTope = new Date(ySel, mSel-1, dSel, parseInt(Hm), parseInt(Im), parseInt(Sm));
                        function padToTwoDigits(num:any) {
                            return num.toString().padStart(2, '0');
                        }
                        const hHT = padToTwoDigits(newHoraTope.getHours());
                        const iHT = padToTwoDigits(newHoraTope.getMinutes());
                        //const sHT = padToTwoDigits(newHoraTope.getSeconds());
                        
                        const fechaSelB=new Date(ySel,mSel-1,dSel, hHT, iHT)
                        fechaSelB.setDate(fechaSelB.getDate() - Restar);
                        const dR = padToTwoDigits(fechaSelB.getDate());
                        const mR = padToTwoDigits(fechaSelB.getMonth() + 1);
                        const yR = padToTwoDigits(fechaSelB.getFullYear());

                        if(fechaSisB.getTime() >= fechaSelB.getTime()){
                            setViewInputCedula({
                                show:false,
                                showMsg:true,
                                Msg: Restar == 1 
                                    ? 'Solicitud no disponible, cerró el ('+dR+'/'+mR+'/'+yR+' ' + hHT + ':' + iHT + ')'
                                    : 'Solicitud no disponible, cerró a las (' + hHT + ':' + iHT + ')'
                            })
                        }else if(fechaSisB.getTime() < fechaSelB.getTime()){
                            setViewInputCedula({
                                show:true,
                                showMsg:false,
                                Msg: ''
                            })
                        }
                    }
                    
                    setViewTable({
                        textfecha: dSel+"-"+mSel+"-"+ySel,
                        textcliente: textcliente,
                        textsucursal: textsucursal,
                        textmenu: textmenu,
                        textedicion: String(dSis > 9 ? dSis : `0${dSis}`)+"-"+String(mSis > 9 ? mSis : `0${mSis}`)+"-"+String(ySis > 9 ? ySis : `0${ySis}`)+" "+String(hSis > 9 ? hSis : `0${hSis}`)+":"+String(iSis > 9 ? iSis : `0${iSis}`),
                    })
    
                } catch (error) {
                    console.error("Error al obtener datos:", error);
                } finally{
                    setShowSpinner(false)
                    setVolcado(true)
                }
            };
            fetchData();
        }else{
            setVolcado(true)
        }
    }
    
    useEffect( () => {
        let fecha=formikRef?.current?.values.fecha
        let cliente=formikRef?.current?.values.cliente
        let sucursal=formikRef?.current?.values.sucursal
        let menu=formikRef?.current?.values.menu
        let gerencias= dataUser?.V_T ? []: dataUser?.idsgerencia

        if(Volcado){
            if(fecha!="" && cliente!="" && sucursal!="" && menu!=""){                
                async function main() {
                    try {
                        setShowSpinner(true);
                            const [personalData, tipocomensalData, solicitudData] = await Promise.all([
                            obtenerPersonalComensal(Number(cliente), gerencias),
                            obtenerTipoComensal(),
                            obtenerSolicitudComensal(Number(cliente), Number(sucursal), Number(menu), String(fecha))
                        ]);
                        setArrayPersonal(personalData as Personal[]);
                        setArrayTipoComensal(tipocomensalData as TypeTipoComensal[]);
                        setArraySolicitud(solicitudData as TypeSolicitudComensal[]);
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
            if(fecha!="" && cliente!="" && sucursal!="" && menu!=""){                
                async function main() {
                    try {
                        setShowSpinner(true);
                            const [solicitudData] = await Promise.all([
                            obtenerSolicitudComensal(Number(cliente), Number(sucursal), Number(menu), String(fecha))
                        ]);
                        setArraySolicitud(solicitudData as TypeSolicitudComensal[]);
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
            ChangeCliente({ target: { value: arrayClientes[0].id } } as unknown as React.ChangeEvent<HTMLSelectElement>);
        }
    }, [dataUser, arrayClientes]);

    useEffect(() => {
        formikRef?.current?.setFieldValue("cedula", SelectedPersonal);
        formikRef?.current?.setFieldValue("comensal", SelectedTipoComensal);
    }, [SelectedPersonal, SelectedTipoComensal]);

    useEffect(() => {
        if (ArraySolicitud.length > 0 && ArrayPersonal.length > 0 && ArrayTipoComensal.length > 0) {

            const gerenciasSet = new Set<string>();
            ArraySolicitud.forEach(solicitud => {
                const personal = ArrayPersonal.find(p => p.nrocedula === solicitud.nrocedula);
                const gerencia = personal?.gerencia?.nombre || "SIN GERENCIA";
                if (!personal) {
                    return null;
                }
                gerenciasSet.add(gerencia);
            });
            const gerenciasUnicas = Array.from(gerenciasSet).sort();;
            const tiposComensalUnicos = ArrayTipoComensal.map(tc => tc.nombre);

            const datosTabla: RowTabla[] = gerenciasUnicas.map(gerencia => {
                const row: RowTabla = { gerencia };
                tiposComensalUnicos.forEach((tipo: string) => {
                    row[tipo] = 0;
                });
                row.total = 0;
                return row;
            });

            const totalPorTipoComensal: Record<string, number> = {};
            tiposComensalUnicos.forEach(tipo => {
                totalPorTipoComensal[tipo] = 0;
            });

            ArraySolicitud.forEach(solicitud => {
                const personal = ArrayPersonal.find(p => p.nrocedula === solicitud.nrocedula);
                const gerencia = personal?.gerencia?.nombre || "SIN GERENCIA";
                const tipoComensalObj = ArrayTipoComensal.find(tc => tc.id === solicitud.idtipocomensal);
                const tipoComensal = tipoComensalObj?.nombre || "Sin Tipo";
                
                if (!personal) {
                    return null;
                }

                const row = datosTabla.find(row => row.gerencia === gerencia);
                if (row) {
                    row[tipoComensal] = (row[tipoComensal] as number || 0) + 1;
                    row.total = (row.total as number || 0) + 1;
                }
                if (totalPorTipoComensal[tipoComensal] !== undefined) {
                    totalPorTipoComensal[tipoComensal] += 1;
                } else {
                    totalPorTipoComensal[tipoComensal] = 1;
                }
            });

            setDatosTabla(datosTabla);
            setTotalPorTipoComensal(totalPorTipoComensal);
            const totalGeneral = Object.values(totalPorTipoComensal).reduce((acc, val) => acc + val, 0);
            setTotalGeneral(totalGeneral);
        }else{
            setDatosTabla([]);
            setTotalPorTipoComensal({});
            setTotalGeneral(0);
        }
    }, [ArraySolicitud, ArrayPersonal, ArrayTipoComensal]);

    const cedulasEnSolicitud = new Set(ArraySolicitud.map(solicitud => solicitud.nrocedula));

    const personalOptions = ArrayPersonal
        .filter(person => !cedulasEnSolicitud.has(person?.nrocedula))
        .map(person => ({
        value: person?.nrocedula?.toString(),
        label: `${person.nombres ?? ""} ${person.apellidos ?? ""}`.trim().replace(/\s+/g, ' '),
        comensal: person?.tipocomensal?.id?.toString(),
        cargo: person?.cargo?.nombre,
    }));
    const formatOptionLabel = (option: any) => (
        <div>
            <div style={{ fontWeight: "bold", fontSize: "0.7rem" }}>{option.label}</div>
            <div style={{ fontSize: "0.5rem" }}>{option.cargo}</div>
        </div>
    );

    const PreguntaEliminar = (id:number, nombres:string, apellidos:string, nrocedula:number)=>{
      setAviso({
         show: true,
         logo: "BsFillQuestionCircleFill",
         colorlogo: "text-orange-400",
         texto: "¿ Desea cancelar la solicitud de\n\""+new Intl.NumberFormat('es-ES').format(nrocedula)+"\"\n\""+nombres+" "+apellidos+"\" ?",
         aligntexto: "text-center",
         sizetexto: "text-lg",
         botones: { Bcerrar: true, Benviar: true },
         txtbotones: { Bcerrar: "Cerrar", Benviar: "Eliminar" },
         ClickCancel: () => { CerrarAviso() },
         ClickConfirm: () => {Eliminar(id)}
      })
    }

    const Eliminar = (id:Number) =>{
      setAviso({...estadoInicialAviso})

    const fetchData = async () => {
        try {
            setShowSpinner(true);
            await eliminarSolicitudComensal(Number(id))            
        } catch (error) {
            console.error("Error al obtener datos:", error);
        } finally {
            setShowSpinner(false);
            setVolcado2(true);
        }
    };

    fetchData();
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
                    fecha: "",
                    cliente: "",
                    sucursal: "",
                    menu:'',
                    cedula:[],
                    comensal:[],
                    filtromenu: {},
                    usuario: dataUser?.id
                }}
                validate={(values) => {
                    const errors: { fecha?: string; cliente?: string; sucursal?: string; menu?: string; } = {};
                    if (!values.fecha) {
                        errors.fecha = "Por favor, seleccione un item";
                    }
                    if (!values.cliente) {
                        errors.cliente = "Por favor, seleccione un item";
                    }
                    if (!values.sucursal) {
                        errors.sucursal = "Por favor, seleccione un item";
                    }
                    if(!values.menu){
                        errors.menu='Por favor, seleccione un item'
                    }
                    return errors;
                }}
                onSubmit={async (values, {resetForm}) => {
                    const fecha = String(values.fecha);
                    const cliente = Number(values.cliente);
                    const sucursal = Number(values.sucursal);
                    const menu = Number(values.menu);
                    const usuario = Number(values.usuario);
                    const cedula = Array.from(values.cedula.map(Number));
                    const comensal = Array.from(values.comensal.map(Number));
                    let filtromenuParsed;

                    if (typeof values.filtromenu === 'string') {
                        try {
                            filtromenuParsed = JSON.parse(values.filtromenu);
                        } catch(e) {
                            console.error('Error al parsear filtromenu:', e);
                            filtromenuParsed = {};
                        }
                    } else {
                        filtromenuParsed = values.filtromenu;
                    }

                    const [ySel, mSel, dSel]=fecha.split('-')
                    const fechaSelA=new Date(Number(ySel),Number(mSel)-1,Number(dSel))
                    const now = ajustarFechaHora(new Date(await Now()));
                    let ySis= now.getFullYear();
                    let mSis= now.getMonth() + 1;
                    let dSis= now.getDate();
                    let hSis= now.getHours();
                    let iSis= now.getMinutes();
                    const fechaSisA=new Date(Number(ySis),Number(mSis)-1,Number(dSis))
                    const fechaSisB=new Date(Number(ySis),Number(mSis)-1,Number(dSis), Number(hSis), Number(iSis))
                    if(fechaSelA.getTime() < fechaSisA.getTime()){
                        setViewInputCedula({
                            show:false,
                            showMsg:true,
                            Msg: 'Solicitud no disponible, cerró el ('+dSel+'/'+mSel+'/'+ySel+')'
                        })
                        return null
                    }else if(fechaSelA.getTime() > fechaSisA.getTime()){
                        setViewInputCedula({
                            show:true,
                            showMsg:false,
                            Msg: ''
                        })
                    }else{
                        const Restar= filtromenuParsed.antelacion===true ? 1: 0
                        let [Hm, Im, Sm] = filtromenuParsed.hora_tope.split(':');

                        const newHoraTope = new Date(Number(ySel), Number(mSel)-1, Number(dSel), parseInt(Hm), parseInt(Im), parseInt(Sm));
                        function padToTwoDigits(num:any) {
                            return num.toString().padStart(2, '0');
                        }
                        const hHT = padToTwoDigits(newHoraTope.getHours());
                        const iHT = padToTwoDigits(newHoraTope.getMinutes());
                        //const sHT = padToTwoDigits(newHoraTope.getSeconds());

                        const fechaSelB=new Date(Number(ySel),Number(mSel)-1,Number(dSel), hHT, iHT)
                        fechaSelB.setDate(fechaSelB.getDate() - Restar);
                        const dR = padToTwoDigits(fechaSelB.getDate());
                        const mR = padToTwoDigits(fechaSelB.getMonth() + 1);
                        const yR = padToTwoDigits(fechaSelB.getFullYear());

                        if(fechaSisB.getTime() >= fechaSelB.getTime()){
                            setViewInputCedula({
                                show:false,
                                showMsg:true,
                                Msg: Restar == 1 
                                    ? 'Solicitud no disponible, cerró el ('+dR+'/'+mR+'/'+yR+' ' + hHT + ':' + iHT + ')'
                                    : 'Solicitud no disponible, cerró a las (' + hHT + ':' + iHT + ')'
                            })
                            return null
                        }else if(fechaSisB.getTime() < fechaSelB.getTime()){
                            setViewInputCedula({
                                show:true,
                                showMsg:false,
                                Msg: ''
                            })
                        }
                    }

                    try {
                        await agregarSolicitudComensal(
                            fecha,
                            cliente,
                            sucursal,
                            menu,
                            cedula,
                            comensal,
                            usuario
                        );
                        resetForm({
                            values: {
                                fecha: values.fecha,
                                cliente: values.cliente,
                                sucursal: values.sucursal,
                                menu: values.menu,
                                cedula: [],
                                comensal: [],
                                filtromenu: values.filtromenu,
                                usuario: values.usuario,
                            },
                        });
                            
                    } catch (error: any) {
                        console.error('Error:', error);
                    } finally {
                        setSelectedPersonal([])
                        setSelectedTipoComensal([])
                        setVolcado2(true)
                    }
                }}
            >
                {({isSubmitting, values, touched, errors, handleChange, handleBlur, handleSubmit }) => {                    

                    let count = 0;
                    return(
                        isSubmitting ? (
                            <Spinner show={true} />
                        ):(
                            <>
                                <form method="post" className="space-y-5" onSubmit={handleSubmit}>
                                    <div className="w-full flex justify-around items-center flex-wrap">
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
                                                    values.sucursal=""
                                                    values.menu=""
                                                    if (arrayClientes.length > 1) {
                                                        setArraySucursales([])
                                                        setArrayMenus([])
                                                    }else{
                                                        setArrayMenus([])
                                                    }
                                                    setSelectedPersonal([])
                                                    setViewInputCedula(estadoInicialViewInputCedula)
                                                    setVolcado(true)
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
                                                    onClick={() => {
                                                        values.sucursal=""
                                                        values.menu=""
                                                        setArrayMenus([])
                                                        setSelectedPersonal([])
                                                        setViewInputCedula(estadoInicialViewInputCedula)
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
                                                onChange={(e) => { handleChange(e); ChangeSucursal(e)}}
                                                onBlur={(e)=>{handleBlur(e)}}
                                                onClick={() => {
                                                    values.menu=""
                                                    setSelectedPersonal([])
                                                    setViewInputCedula(estadoInicialViewInputCedula)
                                                    setTableCoincidencia(false)
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
                                        <div className="w-auto m-1 p-4 bg-blue-900 flex flex-col justify-center items-center rounded-md">
                                            <label htmlFor="menu" className="font-bold text-white mb-2">Menú</label>
                                            <select 
                                                id="menu" 
                                                name="menu"
                                                className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none" 
                                                aria-invalid={(touched.menu && errors.menu) ? "true" : undefined}
                                                aria-describedby={(touched.menu && errors.menu) ? "nombre-error" : undefined}
                                                value={values.menu}
                                                onChange={(e) => { handleChange(e); ChangeMenu(e); setSelectedPersonal([])}}
                                                onBlur={(e)=>{handleBlur(e)}}
                                            >
                                                <option value="">Seleccione...</option>
                                                {ArrayMenus.map((menu) => (
                                                    <option key={"suc_" + menu.id} value={menu.id}>
                                                        {menu.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            {(touched.menu && errors.menu) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.menu}</div>)}
                                        </div>
                                    </div>
                                    {TableCoincidencia ? (                                        
                                        <div className="w-full">
                                            {(dataUser?.V_T || dataUser?.F_33) && ViewInputCedula.show ? (
                                                <div className="grid grid-cols-[4fr_1fr] items-center py-4">                                                    
                                                    <div className="w-full p-2">
                                                        <Select
                                                            isMulti
                                                            id="colaborador"
                                                            name="colaborador"
                                                            options={personalOptions}
                                                            value={personalOptions.filter(opt => SelectedPersonal.includes(opt.value))}
                                                            onChange={(selected: any) => {
                                                                const selectedArr = Array.isArray(selected) ? selected : [];
                                                                const selectedValues = selectedArr.map((opt: any) => opt.value);
                                                                setSelectedPersonal(selectedValues);

                                                                const newTiposComensal = selectedArr.map((opt: any) => opt.comensal ?? "");
                                                                setSelectedTipoComensal(newTiposComensal);
                                                            }}
                                                            formatOptionLabel={formatOptionLabel}
                                                            className="w-full"
                                                            classNamePrefix="react-select"
                                                            placeholder="Selección..."
                                                        />
                                                    </div>
                                                    <div className="flex flex-col justify-center items-center">
                                                        {SelectedPersonal.length > 0 ?(
                                                            <>
                                                                <span>
                                                                    {SelectedPersonal.length >= 1 && SelectedPersonal.length <= 9 ?(
                                                                        "Seleccionados: 0"+SelectedPersonal.length
                                                                    ):(
                                                                        "Seleccionados: "+SelectedPersonal.length
                                                                    )}
                                                                </span>
                                                                <Button type="submit" className="">Agregar</Button>
                                                            </>
                                                        ):(null)}
                                                    </div>
                                                </div>
                                            ):(null)}
                                            
                                            <div id="div_pdf" className="p-1.5 w-full inline-block align-middle">
                                                <div className="overflow-hidden border rounded-lg">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-blue-900">
                                                            <tr>
                                                                <td scope="col" colSpan={6} className="px-2 py-1 text-xs border border-slate-300 text-center text-white">
                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <div className='w-full flex justify-between items-center mb-2'>
                                                                            <div className='flex flex-col mx-2'>
                                                                                <span className='text-sm font-black underline'>SOLICITUD</span>
                                                                                <span>{ViewTable.textfecha}</span>
                                                                            </div>
                                                                            <div className='flex flex-col mx-2'>
                                                                                <span className='text-sm font-black underline'>CLIENTE</span>
                                                                                <span>{ViewTable.textcliente}</span>
                                                                            </div>
                                                                            <div className='flex flex-col mx-2'>
                                                                                <span className='text-sm font-black underline'>SUCURSAL</span>
                                                                                <span>{ViewTable.textsucursal}</span>
                                                                            </div>
                                                                            <div className='flex flex-col mx-2'>
                                                                                <span className='text-sm font-black underline'>MENÚ</span>
                                                                                <span>{ViewTable.textmenu}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <span className='text-sm font-black mr-1 underline'>EDICIÓN:</span> 
                                                                            <span>{ViewTable.textedicion}</span>
                                                                        </div>
                                                                        {ViewInputCedula.showMsg ?(
                                                                            <div className='flex justify-center items-center font-bold bg-orange-100 border-red-900 text-red-900 px-2 py-0.5 rounded mt-4'>{ViewInputCedula.Msg}</div>
                                                                        ):(null)}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <th style={{width:"5%"}} scope="col" className="px-1 py-3 text-sm border border-slate-300 font-bold text-center text-white">Nro</th>
                                                                <th style={{width:"auto%"}} scope="col" className="px-1 py-3 text-sm border border-slate-300 font-bold text-center text-white">NOMBRES Y APELLIDOS</th>
                                                                <th style={{width:"10%"}} scope="col" className="px-1 py-3 text-sm border border-slate-300 font-bold text-center text-white">COMENSAL</th>
                                                                {(arrayGerencias.length == 0 || arrayGerencias.length > 1) &&
                                                                    <th style={{width:"auto%"}} scope="col" className="px-1 py-3 text-sm border border-slate-300 font-bold text-center text-white">GERENCIA</th>
                                                                }
                                                                <th style={{width:"auto%"}} scope="col" className="px-1 py-3 text-sm border border-slate-300 font-bold text-center text-white">RESPONSABLE</th>
                                                                {((dataUser?.V_T) || (dataUser?.F_33 && ViewInputCedula.show)) ? (
                                                                    <th style={{width:"auto%"}} scope="col" className="px-1 py-3 text-sm border border-slate-300 font-bold text-center text-white"></th>
                                                                ):(null)}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {ArraySolicitud.length>0 ? (
                                                                ArraySolicitud.map(function(d,i) {
                                                                    const personal = ArrayPersonal.filter(element => element.nrocedula === d.nrocedula);
                                                                    const comensal = ArrayTipoComensal.filter(element => element.id === d.idtipocomensal);

                                                                    if (personal.length === 0) {
                                                                        return null;
                                                                    }
                                                                    count++;
                                                                    return (
                                                                        <tr key={i}>
                                                                            <>
                                                                                <td className="px-1 py-0.5 text-xs border border-slate-300 text-center"><div className="flex flex-col"><span className="font-bold">{count}</span></div></td>
                                                                                <td className="px-1 py-0.5 text-xs border border-slate-300 text-left"><div className="flex flex-col"><span className="font-bold whitespace-nowrap">{personal[0].nombres} {personal[0].apellidos}</span><span className="font-light">C.I.: {new Intl.NumberFormat('es-ES').format(d.nrocedula)}</span><span className="font-light whitespace-nowrap">Cgo: {personal[0].cargo.nombre}</span></div></td>
                                                                                <td className="px-1 py-0.5 text-xs border border-slate-300 text-center"><div className="flex flex-col"><span><span className="font-light">{comensal[0].nombre}</span></span></div></td>
                                                                                {(arrayGerencias.length == 0 || arrayGerencias.length > 1) &&
                                                                                    <td className="px-1 py-0.5 text-xs border border-slate-300 text-center">
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-light whitespace-nowrap">{personal[0].gerencia.nombre}</span>
                                                                                        </div>
                                                                                    </td>
                                                                                }
                                                                                <td className="px-1 py-0.5 text-xs border border-slate-300 text-right">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-light whitespace-nowrap">{d.usuario.email.toLowerCase()}</span>
                                                                                        <span className="font-light whitespace-nowrap">{separateDateAndTimeSis(d.datetime).gfh}</span>
                                                                                    </div>
                                                                                </td>
                                                                                {((dataUser?.V_T) || (dataUser?.F_33 && ViewInputCedula.show)) ? (
                                                                                    <td className="px-1 py-0.5 text-xs border border-slate-300 text-right">
                                                                                        <div className="flex justify-center align-center">
                                                                                            <div className="flex justify-center align-center">
                                                                                                <button type="button" className="text-2xl text-red-900 cursor-pointer" onClick={()=> PreguntaEliminar(d.id, personal[0].nombres, personal[0].apellidos, d.nrocedula)}><BsFillTrashFill/></button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                ) : (null) }
                                                                            </>
                                                                        </tr>
                                                                    )
                                                                })
                                                            ):
                                                            <tr>
                                                                <td colSpan={5} className="px-2 py-1 text-xs border border-slate-300 text-center">No hay coincidencias</td>
                                                            </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="p-1.5 w-full flex justify-center items-center mt-4">
                                                    <table className="min-w-auto divide-y divide-gray-200">
                                                        <thead className="bg-blue-900">
                                                            <tr>
                                                                <td scope="col" colSpan={6} className="px-2 py-1 text-xs border border-slate-300 text-center text-white">
                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <div className='w-full flex justify-between items-center mb-2'>
                                                                            <div className='flex flex-col mx-2'>
                                                                                <span className='text-sm font-black underline'>SOLICITUD</span>
                                                                                <span>{ViewTable.textfecha}</span>
                                                                            </div>
                                                                            <div className='flex flex-col mx-2'>
                                                                                <span className='text-sm font-black underline'>CLIENTE</span>
                                                                                <span>{ViewTable.textcliente}</span>
                                                                            </div>
                                                                            <div className='flex flex-col mx-2'>
                                                                                <span className='text-sm font-black underline'>SUCURSAL</span>
                                                                                <span>{ViewTable.textsucursal}</span>
                                                                            </div>
                                                                            <div className='flex flex-col mx-2'>
                                                                                <span className='text-sm font-black underline'>MENÚ</span>
                                                                                <span>{ViewTable.textmenu}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <span className='text-sm font-black mr-1 underline'>EDICIÓN:</span> 
                                                                            <span>{ViewTable.textedicion}</span>
                                                                        </div>
                                                                        {ViewInputCedula.showMsg ?(
                                                                            <div className='flex justify-center items-center font-bold bg-orange-100 border-red-900 text-red-900 px-2 py-0.5 rounded mt-4'>{ViewInputCedula.Msg}</div>
                                                                        ):(null)}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <th style={{width:"auto%"}} scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center text-white">UNIDAD</th>
                                                                    {ArrayTipoComensal.map(tipo => (
                                                                        <th key={tipo.id} style={{width:"10%"}} scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center text-white">{tipo.nombre}</th>
                                                                    ))}
                                                                    <th style={{width:"5%"}} scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center text-white">TOTAL</th>
                                                                </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {datosTabla.length > 0 ? (
                                                                <>
                                                                    {datosTabla.map((row, index) => (
                                                                        <tr key={index}>
                                                                            <>
                                                                                <td className="px-2 py-0.5 text-xs border border-slate-300 text-left">{row.gerencia}</td>
                                                                                {ArrayTipoComensal.map(tipo => (
                                                                                    <td key={tipo.id} className="px-2 py-0.5 text-xs border border-slate-300 text-center">{row[tipo.nombre] || "-"}</td>
                                                                                ))}
                                                                                <td className="px-2 py-0.5 text-sm border border-slate-300 text-center font-bold">{row.total || "-"}</td>
                                                                            </>
                                                                        </tr>
                                                                    ))}
                                                                    {datosTabla.length > 1 ?(
                                                                        <>
                                                                            <tr className="bg-blue-900">
                                                                                <>
                                                                                    <td className="px-3 text-lg border border-slate-300 font-bold text-right text-white">TOTAL GENERAL</td>
                                                                                    {ArrayTipoComensal.map(tipo => (
                                                                                        <td key={tipo.id} className="px-3 text-lg border border-slate-300 font-bold text-center text-white">
                                                                                            {totalPorTipoComensal[tipo.nombre] || "-"}
                                                                                        </td>
                                                                                    ))}
                                                                                    <td className="px-3 text-lg border border-slate-300 font-bold text-center text-white">{totalGeneral}</td>
                                                                                </>
                                                                            </tr>
                                                                        </>
                                                                    ):(null)}
                                                                </>
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={5} className="px-2 py-1 text-xs border border-slate-300 text-center">No hay coincidencias</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>

                                                </div>
                                            </div>
                                        </div>
                                    ):null}
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
