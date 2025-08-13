import { Formik, type FormikProps } from "formik";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import AvisoModal, { estadoInicialAviso } from "../../componentes/modal/AvisoModal";
import Spinner from "../../componentes/modal/Spinner";
import LogoA70 from '../../assets/logoA70.png'
import { ajustarFechaHora, separateDateAndTimeSis } from "../../util/workDate";
import { BsFillPeopleFill, BsFillPersonCheckFill, BsFillPersonXFill, BsFillXCircleFill } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";
import type { TypeArrayCliente, TypeArraySucursal, TypeArrayMenu, TypePersonalComensal, TypeTipoComensal } from "../../util/types";
import { Now, obtenerPersonalComensal, obtenerRegistroComensal, obtenerTipoComensal } from "../../consultasDB/apiSupabase";

export default function ControlMenu() {

    const { dataUser, idscliente, idssucursal, idsmenu } = useAuth();
    const arrayClientes = (idscliente || []) as unknown as TypeArrayCliente[];
    const arraySucursales = (idssucursal || []) as unknown as TypeArraySucursal[];
    const arrayMenus = (idsmenu || []) as unknown as TypeArrayMenu[];
        
    const [ShowSpinner, setShowSpinner] = useState(false)
    const [Aviso, setAviso] = useState(estadoInicialAviso);

    const formikRef = useRef<FormikProps<{
        fecha: string;
        cliente: string | number;
        sucursal: string | number;
        menu: string | number;
        cedula: string | number;
        nombrecedula: string;
        tipocomensal: string |number;
        filtromenu: any;
        usuario: number | undefined;
    }> | null>(null);

    const [ArraySucursales, setArraySucursales] = useState<any[]>([]);
    const [ArrayMenus, setArrayMenus] = useState<any[]>([]);
    
    const [ArrayPersonal, setArrayPersonal] = useState<TypePersonalComensal[]>([]);
    const [ArrayRegistros, setArrayRegistros] = useState<any[]>([]);
    const [ArrayTipoComensal, setArrayTipoComensal] = useState<any[]>([]);
    const [ShowTeclado, setShowTeclado] = useState(false);
    const [Volcado, setVolcado] = useState(false);
    const [Volcado2, setVolcado2] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const intervaloId = useRef<NodeJS.Timeout | null>(null);
    const estadoInicialViewTable = {
        textfecha:"",
        textcliente:"",
        textsucursal:"",
        textmenu:"",
        textedicion:"",
    };
    const [ViewTable, setViewTable] = useState(estadoInicialViewTable);
    type RowTabla = {
        gerencia: string;
        [key: string]: string | number;
    };
    const [datosTabla, setDatosTabla] = useState<RowTabla[]>([]);
    const [totalPorTipoComensal, setTotalPorTipoComensal] = useState<Record<string, number>>({});
    const [totalGeneral, setTotalGeneral] = useState({
        total: 0,
        solicitada: 0,
        nosolicitada: 0,
        duplicada: 0
    });

    const CerrarAviso = () => {
        setAviso({...estadoInicialAviso})
    };

    const ChangeCliente = (e: React.ChangeEvent<HTMLSelectElement>) => {  
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

    const ChangeSucursal = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

    const ChangeMenu = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
            if(e.target.value !==""){
                const now = ajustarFechaHora(new Date(HoraActual));
                let ySis= now.getFullYear();
                let mSis= now.getMonth() + 1;
                let dSis= now.getDate();
                let hSis= now.getHours();
                let iSis= now.getMinutes();
                const fechaSisA=new Date(Number(ySis),Number(mSis)-1,Number(dSis))
                const fechaSisB=new Date(Number(ySis),Number(mSis)-1,Number(dSis), Number(hSis), Number(iSis))
    
                if(fechaSelA.getTime() < fechaSisA.getTime()){
                    setAviso({
                        show: true,
                        logo: "BsFillXCircleFill",
                        colorlogo: "text-red-500",
                        texto:`El Registro de Comensal\n"NO" está disponible\n\nLa fecha es anterior a hoy`,
                        aligntexto: "text-center",
                        sizetexto: "text-lg",
                        botones: { Bcerrar: true, },
                        txtbotones: { Bcerrar: "Cerrar", },
                        ClickCancel: () => { CerrarAviso() },
                        ClickConfirm: () => {}
                    })
                    formikRef?.current?.setFieldValue('menu', '');
                    formikRef?.current?.setFieldValue('filtromenu', undefined);
                }else if(fechaSelA.getTime() > fechaSisA.getTime()){
                    setAviso({
                        show: true,
                        logo: "BsFillXCircleFill",
                        colorlogo: "text-red-500",
                        texto:`El Registro de Comensal\n"NO" está disponible\n\nLa fecha es posterior a hoy`,
                        aligntexto: "text-center",
                        sizetexto: "text-lg",
                        botones: { Bcerrar: true, },
                        txtbotones: { Bcerrar: "Cerrar", },
                        ClickCancel: () => { CerrarAviso() },
                        ClickConfirm: () => {}
                    })
                    formikRef?.current?.setFieldValue('menu', '');
                    formikRef?.current?.setFieldValue('filtromenu', undefined);
                }else{
                    let [Hi, Ii] = filteredMenus[0].hora_inicio.split(':');
                    const HoraIncio = new Date(ySel,mSel-1,dSel, Hi, Ii);
                    const newHoraIncio = new Date(HoraIncio.getTime());
    
                    const [Hfin, Mfin] = filteredMenus[0].hora_fin.split(':');
                    const HoraFin = new Date(ySel,mSel-1,dSel, Hfin, Mfin);
                    const newHoraFin = new Date(HoraFin.getTime());
    
                    const hRIn = (newHoraIncio.getHours()<=9 ? '0'+newHoraIncio.getHours() :newHoraIncio.getHours())
                    const iRIn = (newHoraIncio.getMinutes()<=9 ? '0'+newHoraIncio.getMinutes() :newHoraIncio.getMinutes())
                    const hRFin = (newHoraFin.getHours()<=9 ? '0'+newHoraFin.getHours() :newHoraFin.getHours())
                    const iRFin = (newHoraFin.getMinutes()<=9 ? '0'+newHoraFin.getMinutes() :newHoraFin.getMinutes())
    
                    if((fechaSisB.getTime() >= newHoraIncio.getTime()) && (fechaSisB.getTime() <= newHoraFin.getTime())){
                        setShowTeclado(true)
                    }else if (fechaSisB.getTime() < newHoraIncio.getTime()){
                        setAviso({
                            show: true,
                            logo: "BsFillXCircleFill",
                            colorlogo: "text-red-500",
                            texto:`El Registro de Comensal\n"NO" está disponible\n\nComienza a las ${hRIn}:${iRIn}`,
                            aligntexto: "text-center",
                            sizetexto: "text-lg",
                            botones: { Bcerrar: true, },
                            txtbotones: { Bcerrar: "Cerrar", },
                            ClickCancel: () => { CerrarAviso() },
                            ClickConfirm: () => {}
                        })
                        formikRef?.current?.setFieldValue('menu', '');
                        formikRef?.current?.setFieldValue('filtromenu', undefined);
                    }else{
                        setAviso({
                            show: true,
                            logo: "BsFillXCircleFill",
                            colorlogo: "text-red-500",
                            texto:`El Registro de Comensal\n"NO" está disponible\n\nCulminó a las ${hRFin}:${iRFin}`,
                            aligntexto: "text-center",
                            sizetexto: "text-lg",
                            botones: { Bcerrar: true, },
                            txtbotones: { Bcerrar: "Cerrar", },
                            ClickCancel: () => { CerrarAviso() },
                            ClickConfirm: () => {}
                        })
                        formikRef?.current?.setFieldValue('menu', '');
                        formikRef?.current?.setFieldValue('filtromenu', undefined);
                    }
                }
                
                setViewTable({
                    textfecha: dSel+"-"+mSel+"-"+ySel,
                    textcliente: textcliente,
                    textsucursal: textsucursal,
                    textmenu: textmenu,
                    textedicion: dSis+"-"+mSis+"-"+ySis+" "+hSis+":"+iSis,
                })
                setVolcado(true)
            }else{
                setVolcado(true)
            }
        }else{
            setVolcado(true)
        }
    }

    const ChangeTipoComensal = async(e: ChangeEvent<HTMLSelectElement>, registro: string, cedula: string)=>{
      const id_registro = Number(registro)
      const tipo = Number(e.target.value);
      const selectElement = document.getElementById(''+registro+'_'+cedula+'');
      if (selectElement) {
        selectElement.style.display = 'none';
      }

      const fetchData = async () => {
         try {
            const body = {
               id: id_registro,
               tipo: tipo
            };

            const response = await fetch(`/w_actualizarregistrocomensal`, {
               method: "PUT",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify(body),
            });

            if (!response.ok) { throw new Error(`Error en la respuesta: ${response.status}`) }
            //const data = await response.json();
         } catch (error) {
            console.error("Error al obtener datos:", error);
         } finally {
            setShowSpinner(false);
            setVolcado2(true)
         }
      };

      fetchData();
    }

    const longitudAnterior = useRef(0);
    const intentosConsulta = useRef(0);
    const sonidoActualizacion = useRef<HTMLAudioElement | null>(null);    

    useEffect(() => {
        sonidoActualizacion.current = new Audio("/assets/Correcto.mp3");
    }, []);

    useEffect(() => {
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
                        const [personalData, tipocomensalData] = await Promise.all([
                            obtenerPersonalComensal(Number(cliente), gerencias),
                            obtenerTipoComensal()
                        ]);
                        //console.log("Datos de personal obtenidos:", personalData);
                        setArrayPersonal(personalData as TypePersonalComensal[]);
                        setArrayTipoComensal(tipocomensalData as TypeTipoComensal[]);
                    } catch (err) {
                        setViewTable(estadoInicialViewTable);
                        console.error("Error en la función main:", err);
                    } finally {
                        setShowSpinner(false);
                    }
                }
            
                main();
            }else{
                setViewTable(estadoInicialViewTable);
            }
        }
        if(Volcado2){
            intentosConsulta.current = intentosConsulta.current + 1
            if(fecha!="" && cliente!="" && sucursal!="" && menu!=""){                
                async function main() {
                    try {
                        setShowSpinner(true);
                        const [registroData,] = await Promise.all([
                            obtenerRegistroComensal(Number(cliente),Number(sucursal),Number(menu), String(fecha)),
                        ]);
                        //console.log("Datos de registro obtenidos:", registroData);
                        interface Registro{
                            length: any;
                            forEach: any;
                            nrocedula: string | number;
                            idtipocomensal: any;
                            solicitado: boolean;
                            countduplicado: number;
                        }
                        let data = registroData as Registro;
                        //######################################################################################//

                        const gerenciasSet = new Set<string>();
                        data.forEach((element: Registro) => {
                            const personal = ArrayPersonal.find(p => p.nrocedula === element.nrocedula);
                            const gerencia = personal?.gerencia?.nombre || "SIN/INFO";
                            gerenciasSet.add(gerencia);
                        });
                        const gerenciasUnicas = Array.from(gerenciasSet).sort();;
                        const tiposComensalUnicos = ArrayTipoComensal.map(tc => tc.nombre);
                        tiposComensalUnicos.push("SIN/INFO");

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
                        let Tsolicitada=0
                        let TNOsolicitada=0
                        let TDuplicada=0
                        data.forEach((element: Registro) => {
                            const personal = ArrayPersonal.find(p => p.nrocedula === element.nrocedula);
                            const gerencia = personal?.gerencia?.nombre || "SIN/INFO";
                            const tipoComensalObj = ArrayTipoComensal.find(tc => tc.id === element.idtipocomensal);
                            const tipoComensal = tipoComensalObj?.nombre || "SIN/INFO";
                            if (!element.solicitado) {
                                TNOsolicitada += 1;
                            }
                            if(element.solicitado){
                                Tsolicitada += 1;
                            }
                            if(element.countduplicado > 0){
                                TDuplicada += 1;
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
                        setTotalGeneral({
                            total: totalGeneral,
                            solicitada: Tsolicitada,
                            nosolicitada: TNOsolicitada,
                            duplicada: TDuplicada
                        })

                        //######################################################################################//
                        const longitudActual = data.length;

                        if(intentosConsulta.current === 1){
                            longitudAnterior.current = longitudActual;
                            setArrayRegistros(registroData as any[]);
                        }
                        if(longitudAnterior.current < longitudActual){
                            intentosConsulta.current = 0;
                            longitudAnterior.current = longitudActual;
                            setArrayRegistros(registroData as any[]);
                            sonidoActualizacion.current?.play();
                        }
                        if(intentosConsulta.current === 75 && (longitudActual===longitudAnterior.current)){
                            setIsActive(false)
                            intentosConsulta.current = 0;
                        }
                        
                    } catch (err) {
                        setViewTable(estadoInicialViewTable);
                        console.error("Error en la función main:", err);
                    } finally {
                        setShowSpinner(false);
                    }
                }
            
                main();
            }else{
                setViewTable(estadoInicialViewTable);
            }
        }
        return () => {
            setVolcado(false)
            setVolcado2(false)
        }
    }, [Volcado, Volcado2])

    const IniciarDetener = () => {
        setIsActive((prev) => !prev);
    };

    useEffect(() => {
        if (isActive) {
            // Iniciar intervalo que activa volcado2 cada 4 segundos
            intervaloId.current = setInterval(() => {
                setVolcado2(true);
            }, 4000);
            } else {
            // Limpiar intervalo cuando se desactiva
            if (intervaloId.current) {
                clearInterval(intervaloId.current);
                intervaloId.current = null;
            }
        }
        // Limpiar intervalo al desmontar el componente
        return () => {
            if (intervaloId.current) {
                clearInterval(intervaloId.current);
                intervaloId.current = null;
            }
        };
    }, [isActive]);

    useEffect(() => {
        if(!dataUser?.V_T && arrayClientes.length === 1) {
            formikRef?.current?.setFieldValue('cliente', arrayClientes[0].id);
            ChangeCliente({ target: { value: arrayClientes[0].id } } as unknown as React.ChangeEvent<HTMLSelectElement>);
        }
    }, [dataUser, arrayClientes]);

    const [HoraActual, setHoraActual] = useState("");
    const horaActual = async() => {
        try {
            const hora = await Now();
            const filtromenu= formikRef?.current?.values.filtromenu;

            if(filtromenu=== undefined){
                setHoraActual(hora)
            }else{
                const fechaSe:any=formikRef.current?.values.fecha
                const [ySel, mSel, dSel]=fechaSe.split('-')
                
                const now = ajustarFechaHora(new Date(hora));
                let ySis= now.getFullYear();
                let mSis= now.getMonth() + 1;
                let dSis= now.getDate();
                let hSis= now.getHours();
                let iSis= now.getMinutes();
                const fechaSisB=new Date(Number(ySis),Number(mSis)-1,Number(dSis), Number(hSis), Number(iSis))

                let [Hi, Ii] = filtromenu.hora_inicio.split(':');
                const HoraIncio = new Date(ySel,mSel-1,dSel, Hi, Ii);
                const newHoraIncio = new Date(HoraIncio.getTime());

                const [Hfin, Mfin] = filtromenu.hora_fin.split(':');
                const HoraFin = new Date(ySel,mSel-1,dSel, Hfin, Mfin);
                const newHoraFin = new Date(HoraFin.getTime());

                const hRFin = (newHoraFin.getHours()<=9 ? '0'+newHoraFin.getHours() :newHoraFin.getHours())
                const iRFin = (newHoraFin.getMinutes()<=9 ? '0'+newHoraFin.getMinutes() :newHoraFin.getMinutes())

                if((fechaSisB.getTime() >= newHoraIncio.getTime()) && (fechaSisB.getTime() <= newHoraFin.getTime())){
                    setHoraActual(hora)
                    return
                }else{
                    setHoraActual(hora);
                    setShowTeclado(false);
                    setAviso({
                        show: true,
                        logo: "BsFillXCircleFill",
                        colorlogo: "text-red-500",
                        texto:`El Registro de Comensal\n"NO" está disponible\n\nCulminó a las ${hRFin}:${iRFin}`,
                        aligntexto: "text-center",
                        sizetexto: "text-lg",
                        botones: { Bcerrar: true, },
                        txtbotones: { Bcerrar: "Cerrar", },
                        ClickCancel: () => { CerrarAviso() },
                        ClickConfirm: () => {}
                    })
                    formikRef?.current?.setFieldValue('menu', '');
                    formikRef?.current?.setFieldValue('filtromenu', undefined);
                    return
                }
            }
        } catch (error) {
            console.error("Error al obtener la hora actual:", error);
        }
    }

    useEffect(() => {
        horaActual()
        const intervalo = setInterval(() => {
            horaActual();
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalo);
    }, []);

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
                    fecha: "",
                    cliente: "",
                    sucursal: "",
                    menu: '',
                    cedula: "",
                    nombrecedula: "",
                    tipocomensal: 0,
                    filtromenu: undefined,
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
                onSubmit={() => {
                    
                }}
            >
                {({ isSubmitting, values, touched, errors, handleChange, handleBlur}) => {                    

                    return (
                        isSubmitting ? (
                            <Spinner show={true} />                            
                        ) : (
                            <>
                                <form method="post" className="space-y-5" >

                                    {!ShowTeclado ? (
                                        <div className="max-w-screen min-h-screen flex flex-col justify-center items-center p-2">
                                            <div className="w-full sm:w-11/12 md:w-1/2 lg:w-1/3 bg-white rounded-lg shadow-lg">
                                                <nav className="w-full bg-blue-900 rounded-t-lg shadow-md">
                                                    <div className="mx-auto max-w-full px-2 sm:px-2 md:px-3 lg:px-4">
                                                        <div className="relative flex h-full items-center">
                                                            <div className="flex-1 my-2 grid grid-rows-1 grid-cols-[1fr_3fr]">
                                                                <div className="flex shrink-0 items-center p-2 rounded-lg bg-white">
                                                                    <img className="w-auto" src={LogoA70} alt="A70 Logo" />
                                                                </div>
                                                                <div className="p-2 sm:ml-6 sm:block w-full h-full flex items-center justify-center">
                                                                    <span className="font-bold text-white text-xl">Control Menú</span>
                                                                </div>
                                                            </div>                                                        
                                                        </div>
                                                    </div>
                                                </nav>
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
                                                            }}
                                                        >
                                                            <option value=""> Selección...</option>
                                                            {arrayClientes.map((cliente) => (
                                                                <option key={"cli_" + cliente.id} value={cliente.id}>
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
                                                        onChange={(e) => { handleChange(e); ChangeMenu(e); }}
                                                        onBlur={(e)=>{handleBlur(e)}}
                                                    >
                                                        <option value="">Seleccione...</option>
                                                        {ArrayMenus.map((menu) => (
                                                            <option key={"men_" + menu.id} value={menu.id}>
                                                                {menu.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {(touched.menu && errors.menu) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.menu}</div>)}
                                                </div>
                                            </div>
                                        </div>
                                    ):(null)}
                                    {ShowTeclado ?(
                                        <>
                                            <div className="max-w-screen min-h-screen flex flex-col justify-between items-center p-2">
                                                <div className="w-full grid grid-cols-[1fr_1fr_3fr_1fr] bg-blue-900 mb-2 px-4 py-1 text-white text-xs">
                                                    <div className="flex justify-start shrink-0 items-center">
                                                        <img className="w-auto p-2 rounded-lg bg-white" src={LogoA70} alt="Logo" />
                                                    </div>
                                                    <div className="flex flex-col justify-center items-center">
                                                        <input id="iniciar" type="checkbox" className="cursor-pointer" checked={isActive} onChange={IniciarDetener}/>
                                                        <label htmlFor="iniciar" className="cursor-pointer">{isActive ? "DETENER" : "INICIAR"}</label>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-0 ml-2">
                                                        <div> <span className="font-bold">Fecha:</span> <span>{ViewTable.textfecha}</span> </div>
                                                        <div> <span className="font-bold">Cliente:</span> <span>{ViewTable.textcliente}</span> </div>
                                                        <div> <span className="font-bold">Sucursal:</span> <span>{ViewTable.textsucursal}</span> </div>
                                                        <div> <span className="font-bold">Menú:</span> <span>{ViewTable.textmenu}</span> </div>
                                                    </div>
                                                    <div className="flex justify-end items-center p-1"><button type="button" className="text-3xl text-red-900 cursor-pointer" onClick={()=>{setShowTeclado(false); formikRef?.current?.setFieldValue('menu', '');}}><BsFillXCircleFill/></button></div>
                                                </div>
                                                {ArrayRegistros.length > 0 ? (
                                                    <>
                                                        <div className='flex flex-col justify-between w-full'>
                                                            <div className='m-1 w-full max-h-80 overflow-y-scroll '>
                                                                <table className="max-w-full divide-y border-gray-200 divide-gray-200">
                                                                    <thead className="bg-blue-900 sticky top-0">
                                                                            <tr>
                                                                                <th style={{ width: "14%" }} scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">HORA</th>
                                                                                <th style={{ width: "auto%" }} scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-left text-white">IDENTIFICACIÓN</th>
                                                                                <th style={{ width: "10%" }} scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">TIPO</th>
                                                                                <th style={{ width: "5%" }} scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">SOLICITADA</th>
                                                                                <th style={{ width: "5%" }} scope="col" className="px-3 py-3 text-sm border border-slate-300 font-bold text-center text-white">DUPLICADO</th>
                                                                            </tr>
                                                                    </thead>
                                                                    <tbody className="w-full divide-y divide-gray-200">
                                                                        {ArrayRegistros.map((registro, i) => {
                                                                            const personal = ArrayPersonal.find((p) => p.nrocedula === registro.nrocedula);
                                                                            const tiComensal= ArrayTipoComensal.find((tc) => tc.id === registro.idtipocomensal);
                                                                            return(
                                                                                <tr key={registro.id} className="hover:bg-gray-100">
                                                                                    <td className={` ${i==0 ? "text-lg border bg-black text-white font-extrabold" : "text-xs border text-black"} px-2 py-1 border-slate-300 text-center`}> <div className="flex flex-col"><span className="font-bold"> {separateDateAndTimeSis(registro.datetime).hhmmss} </span></div></td>
                                                                                    <td className={` ${i==0 ? "text-lg border bg-black text-white font-extrabold" : "text-xs border text-black"} px-2 py-1 border-slate-300 text-left`}>
                                                                                        <div className="flex flex-col"><span className="font-bold">{personal?.nombres} {personal?.apellidos}</span><span className="font-light">C.I.: {new Intl.NumberFormat('es-ES').format(registro.nrocedula)}</span><span className="font-light">{personal?.cargo.nombre}</span><span className="font-light">{personal?.gerencia.nombre}</span></div>
                                                                                    </td>
                                                                                    <td className={` ${i==0 ? "text-lg border bg-black text-white font-extrabold" : "text-xs border text-black"} px-2 py-1 border-slate-300 text-center`}>
                                                                                        {tiComensal 
                                                                                            ? 
                                                                                                tiComensal.nombre
                                                                                            : 
                                                                                            <select
                                                                                                className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-sky-600 focus:outline-none"
                                                                                                onChange={(e)=>ChangeTipoComensal(e, registro.id, registro.nrocedula)}
                                                                                            >
                                                                                                <option value="">Seleccione...</option>
                                                                                                {ArrayTipoComensal.map(function(d,i) {
                                                                                                    return (
                                                                                                        <option key={"tipocomensal_"+i} value={d.id}>{d.nombre}</option>
                                                                                                    )
                                                                                                })}
                                                                                            </select>
                                                                                        }
                                                                                    </td>
                                                                                    <td className={`px-2 py-1 border border-slate-300 font-extrabold text-center ${ registro.solicitado ? "bg-green-900" : "bg-red-900" }`} >
                                                                                        <div className="flex justify-center items-center text-4xl text-white">
                                                                                            {registro.solicitado ? (
                                                                                                <BsFillPersonCheckFill />
                                                                                            ) : (
                                                                                                <BsFillPersonXFill />
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td
                                                                                        className={`px-2 py-1 border border-slate-300 font-extrabold text-center ${ registro.countduplicado === 0 ? "" : "bg-orange-600" }`}
                                                                                    >
                                                                                        <div className="flex justify-center items-center text-4xl text-white">
                                                                                            {registro.countduplicado === 0 ? (
                                                                                                null
                                                                                            ) : (
                                                                                                <span className="mr-1 grid grid-cols-[1fr_1fr] items-center">
                                                                                                    <BsFillPeopleFill /> <span className="text-xl">({registro.countduplicado})</span>
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        })}                                                                
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>

                                                        <div className="p-1.5 w-full flex flex-row justify-around items-center">
                                                            <table className="min-w-auto divide-y divide-gray-200">
                                                                <thead>
                                                                <tr>
                                                                    <th scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center bg-green-900 text-white">
                                                                        <div className="flex justify-center align-center text-lg">
                                                                            <BsFillPersonCheckFill/>
                                                                        </div>
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center bg-red-900 text-white">
                                                                        <div className="flex justify-center align-center text-lg text-white">
                                                                            <BsFillPersonXFill/>
                                                                        </div>
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center text-white bg-sky-900">CANTD</th>
                                                                    <th scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center bg-orange-600 text-white">
                                                                        <div className="flex justify-center align-center text-lg text-white">
                                                                            <BsFillPeopleFill/>
                                                                        </div>
                                                                    </th>
                                                                </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200">
                                                                    <tr>
                                                                        <td className="px-6 text-sm border border-slate-300 font-bold text-center"><span className="text-lg">{totalGeneral.solicitada>0 ? totalGeneral.solicitada:"-"}</span></td>
                                                                        <td className="px-6 text-sm border border-slate-300 font-bold text-center"><span className="text-lg">{totalGeneral.nosolicitada>0 ? totalGeneral.nosolicitada:"-"}</span></td>
                                                                        <td className="px-6 text-sm border border-slate-300 font-bold text-center"><span className="text-lg">{totalGeneral.total}</span></td>
                                                                        <td className="px-6 text-sm border border-slate-300 font-bold text-center"><span className="text-lg">{totalGeneral.duplicada>0 ? totalGeneral.duplicada+"/"+totalGeneral.total:"-"}</span></td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </>    
                                                ):(null)}
                                            </div>
                                            {ArrayRegistros.length > 0 ? (
                                                <div className="max-w-screen min-h-screen flex flex-col justify-between items-center p-2">
                                                    <div className="p-1.5 w-full flex justify-center items-center mt-4">
                                                        <table className="min-w-auto divide-y divide-gray-200">
                                                            <thead className="bg-blue-900">
                                                                <tr>
                                                                    <td scope="col" colSpan={6} className="px-2 py-1 text-xs border border-slate-300 text-center text-white">
                                                                        <div className="flex flex-col items-center justify-center">
                                                                            <div className='w-full flex justify-between items-center mb-2'>
                                                                                <div className='flex flex-col mx-2'>
                                                                                    <span className='text-sm font-black underline'>REGISTRO</span>
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
                                                                                    <span className='text-sm font-black underline'>SERVICIO</span>
                                                                                    <span>{ViewTable.textmenu}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <th style={{width:"auto%"}} scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center text-white">UNIDAD</th>
                                                                    {ArrayTipoComensal.map(tipo => (
                                                                        <th key={tipo.id} style={{width:"10%"}} scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center text-white">{tipo.nombre}</th>
                                                                    ))}
                                                                    <th style={{width:"10%"}} scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center text-white">SIN/INFO</th>
                                                                    <th style={{width:"5%"}} scope="col" className="px-6 py-3 text-sm border border-slate-300 font-bold text-center text-white">TOTAL</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200">
                                                                {datosTabla.length > 0 ? (
                                                                    <>
                                                                        {datosTabla.map((row, index) => (
                                                                            <tr key={index}>
                                                                                <td className="px-2 py-0.5 text-xs border border-slate-300 text-left">{row.gerencia}</td>
                                                                                {ArrayTipoComensal.map(tipo => (
                                                                                    <td key={tipo.id} className="px-2 py-0.5 text-xs border border-slate-300 text-center">{row[tipo.nombre] || "-"}</td>
                                                                                ))}
                                                                                <td className="px-2 py-0.5 text-sm border border-slate-300 text-center font-bold">{row['SIN/INFO'] || "-"}</td>
                                                                                <td className="px-2 py-0.5 text-sm border border-slate-300 text-center font-bold">{row.total || "-"}</td>
                                                                            </tr>
                                                                        ))}
                                                                        {datosTabla.length > 1 ?(
                                                                            <>
                                                                                <tr className="bg-blue-900">
                                                                                    <td className="px-3 text-lg border border-slate-300 font-bold text-right text-white">TOTAL GENERAL</td>
                                                                                    {ArrayTipoComensal.map(tipo => (
                                                                                        <td key={tipo.id} className="px-3 text-lg border border-slate-300 font-bold text-center text-white">
                                                                                            {totalPorTipoComensal[tipo.nombre] || "-"}
                                                                                        </td>
                                                                                    ))}
                                                                                    <td className="px-3 text-lg border border-slate-300 font-bold text-center text-white">
                                                                                        {totalPorTipoComensal['SIN/INFO'] || "-"}
                                                                                    </td>
                                                                                    <td className="px-3 text-lg border border-slate-300 font-bold text-center text-white">{totalGeneral.total}</td>
                                                                                </tr>
                                                                            </>
                                                                        ):(null)}
                                                                    </>
                                                                ) : (
                                                                    <tr> <td colSpan={6} className="px-2 py-1 text-xs border border-slate-300 text-center">No hay coincidencias</td> </tr>
                                                                )}
                                                            </tbody>
                                                        </table>

                                                    </div> 
                                                </div>
                                            ):(null)}
                                        </>
                                    ):(null)}
                                    <pre>{JSON.stringify(values, null, 2)}</pre>
                                </form>
                            </>
                        )
                    );
                }}

            </Formik>
        </>
    );
}