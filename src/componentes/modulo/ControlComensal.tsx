import { Formik, type FormikProps } from "formik";
import { useEffect, useRef, useState } from "react";
import AvisoModal, { estadoInicialAviso } from "../modal/AvisoModal";
import Spinner from "../modal/Spinner";
import LogoA70 from '../../assets/logoA70.png'
import { BsFill1SquareFill, BsFill2SquareFill, BsFill3SquareFill, BsFill4SquareFill, BsFill5SquareFill, BsFill6SquareFill, BsFill7SquareFill, BsFill8SquareFill, BsFill9SquareFill, BsFill0SquareFill, BsFillXCircleFill } from "react-icons/bs";
import type { TypeArrayCliente, TypeArrayMenu, TypeArraySucursal, TypeCargo, TypeGerencia, TypePersonalComensal, TypeTipoComensal } from "../../util/types";
import { useAuth } from "../../context/AuthContext";
import { ajustarFechaHora } from "../../util/workDate";
import { agregarControlComensal, Now, obtenerPersonalComensal } from "../../consultasDB/apiSupabase";


export default function ControlComensal() {
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
    const [ShowTeclado, setShowTeclado] = useState(false);
    const [Volcado, setVolcado] = useState(false);
    const [NombreCedula, setNombreCedula] = useState("");
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
            const now = ajustarFechaHora(new Date(HoraActual));
            //const now = ajustarFechaHora(new Date(await Now()));
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
                formikRef?.current?.setFieldValue('filtromenu', '');
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
                formikRef?.current?.setFieldValue('filtromenu', '');
            }else{
                let [Hi, Ii, Si] = filteredMenus[0].hora_inicio.split(':');
                const HoraIncio = new Date(ySel,mSel-1,dSel, Hi, Ii);
                const newHoraIncio = new Date(HoraIncio.getTime());

                const [Hfin, Mfin, Sfin] = filteredMenus[0].hora_fin.split(':');
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
                    formikRef?.current?.setFieldValue('filtromenu', '');
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
                    formikRef?.current?.setFieldValue('filtromenu', '');
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
    }

    const [HoraActual, setHoraActual] = useState("");
    

    const [Cedula, setCedula] = useState("");
    const [UltimaCedula, setUltimaCedula] = useState("");
    const IngresarCedula = (numero: string) => {
        if(Cedula.length === 0 && numero === "0"){
            return
        }
        if (Cedula.length >= 8) {
            return;
        }
        const nombreCedula= ArrayPersonal.find(personal => personal.nrocedula.toString() === Cedula + numero);
        setCedula(prevCedula => prevCedula + numero);
        setNombreCedula(nombreCedula ? `${nombreCedula.nombres} ${nombreCedula.apellidos}` : "");
        formikRef?.current?.setFieldValue('cedula', Cedula + numero);
        formikRef?.current?.setFieldValue('nombrecedula', nombreCedula ? `${nombreCedula.nombres} ${nombreCedula.apellidos}` : "Sin Identificar");
        formikRef?.current?.setFieldValue('tipocomensal', nombreCedula ? nombreCedula.tipocomensal.id : 0);
    }

    const BorrarUltimoCaracter = () => {
        setCedula(prevCedula => prevCedula.slice(0, -1));
        formikRef?.current?.setFieldValue('cedula', Cedula.slice(0, -1));
        const nombreCedula= ArrayPersonal.find(personal => personal.nrocedula.toString() === Cedula.slice(0, -1));
        setNombreCedula(nombreCedula ? `${nombreCedula.nombres} ${nombreCedula.apellidos}` : "");
        formikRef?.current?.setFieldValue('nombrecedula', nombreCedula ? `${nombreCedula.nombres} ${nombreCedula.apellidos}` : "Sin Identificar");
        formikRef?.current?.setFieldValue('tipocomensal', nombreCedula ? nombreCedula.tipocomensal.id : 0);
    }

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
                    formikRef?.current?.setFieldValue('filtromenu', '');
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

    useEffect(() => {
      if(Volcado){
            let fecha=formikRef?.current?.values.fecha
            let cliente=formikRef?.current?.values.cliente
            let sucursal=formikRef?.current?.values.sucursal
            let menu=formikRef?.current?.values.menu
            let gerencias= dataUser?.V_T ? []: dataUser?.idsgerencia
            if(fecha!="" && cliente!="" && sucursal!="" && menu!=""){                
                
                async function main() {
                    try {
                        setShowSpinner(true);
                        const [personalData] = await Promise.all([
                            obtenerPersonalComensal(Number(cliente), gerencias)
                        ]);
                        //console.log("Datos de personal obtenidos:", personalData);
                        setArrayPersonal(personalData as TypePersonalComensal[]);
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
        }
    }, [Volcado])

    useEffect(() => {
        if(!dataUser?.V_T && arrayClientes.length === 1) {
            formikRef?.current?.setFieldValue('cliente', arrayClientes[0].id);
            ChangeCliente({ target: { value: arrayClientes[0].id } } as unknown as React.ChangeEvent<HTMLSelectElement>);
        }
    }, [dataUser, arrayClientes]);

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
                    const cedula = Number(values.cedula);
                    const tipocomensal = Number(values.tipocomensal);
                    const usuario = Number(values.usuario);
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
                        setShowTeclado(false)
                    }else{
                        let [Hi, Ii, Si] = filtromenuParsed.hora_inicio.split(':');
                        const HoraIncio = new Date(Number(ySel),Number(mSel)-1,Number(dSel), Hi, Ii);
                        const newHoraIncio = new Date(HoraIncio.getTime());

                        const [Hfin, Mfin, Sfin] = filtromenuParsed.hora_fin.split(':');
                        const HoraFin = new Date(Number(ySel),Number(mSel)-1,Number(dSel), Hfin, Mfin);
                        const newHoraFin = new Date(HoraFin.getTime());

                        const hRIn = (newHoraIncio.getHours()<=9 ? '0'+newHoraIncio.getHours() :newHoraIncio.getHours())
                        const iRIn = (newHoraIncio.getMinutes()<=9 ? '0'+newHoraIncio.getMinutes() :newHoraIncio.getMinutes())
                        const hRFin = (newHoraFin.getHours()<=9 ? '0'+newHoraFin.getHours() :newHoraFin.getHours())
                        const iRFin = (newHoraFin.getMinutes()<=9 ? '0'+newHoraFin.getMinutes() :newHoraFin.getMinutes())

                        if((fechaSisB.getTime() >= newHoraIncio.getTime()) && (fechaSisB.getTime() <= newHoraFin.getTime())){
                            
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
                            setShowTeclado(false)
                            return null
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
                            setShowTeclado(false)
                            return null
                        }
                    }

                    try {
                        type AgregarControlComensalResult = {
                            solicitado?: boolean;
                            duplicado?: boolean;
                            message: string;
                            [key: string]: any;
                        };
                        const result = await agregarControlComensal(
                            fecha,
                            cliente,
                            sucursal,
                            menu,
                            cedula,
                            tipocomensal,
                            usuario
                        ) as AgregarControlComensalResult;
                        resetForm({
                            values: {
                                fecha:values.fecha,
                                cliente:values.cliente,
                                sucursal:values.sucursal,
                                menu:values.menu,
                                cedula: "",
                                nombrecedula: "",
                                tipocomensal: 0,
                                filtromenu: values.filtromenu,
                                usuario: values.usuario,
                            },
                        });
                        let icono = "";
                        let color = "";
                        if (result.solicitado === true && result.duplicado === true) {
                            icono= "BsFillPersonCheckFill"
                            color = "text-orange-500";
                        } else if (result.solicitado === true && result.duplicado === false) {
                            icono= "BsFillPersonCheckFill"
                            color = "text-green-500";
                        } else if (result.solicitado === false && result.duplicado === true) {
                            icono= "BsFillPersonXFill"
                            color = "text-orange-500";
                        } else {
                            icono= "BsFillPersonXFill"
                            color = "text-red-500";
                        }

                        setAviso({
                            show: true,
                            logo: icono,
                            colorlogo: color,
                            texto: result.message,
                            aligntexto: "text-center",
                            sizetexto: "text-lg",
                            botones: { },
                            txtbotones: { },
                            ClickCancel: () => {},
                            ClickConfirm: () => {}
                        });
                        setTimeout(() => {
                            CerrarAviso()
                        }, 3000);
                            
                    } catch (error: any) {
                        console.error('Error:', error);
                    } finally {
                        setUltimaCedula(Cedula)
                        setCedula("");
                        setNombreCedula("");

                    }
                }}
            >
                {({ isSubmitting, values, touched, errors, handleChange, handleBlur, handleSubmit}) => {

                    /* useEffect(() => {
                        if (actionData?.success) {
                            resetForm({ 
                                values: { 
                                    fecha:values.fecha,
                                    cliente:values.cliente,
                                    sucursal:values.sucursal,
                                    menu:values.menu,
                                    cedula: "",
                                    nombrecedula: "",
                                    tipocomensal: 0,
                                    usuario: values.usuario,
                                },
                            });
                            
                            setAviso({
                                show: true,
                                logo: "BsFillCheckCircleFill",
                                colorlogo: "text-green-500",
                                texto: actionData?.data?.message ?? "",
                                aligntexto: "text-center",
                                sizetexto: "text-lg",
                                botones: { },
                                txtbotones: { },
                                ClickCancel: () => {},
                                ClickConfirm: () => {}
                            });
                            setUltimaCedula(Cedula)
                            setCedula("");
                            setNombreCedula("");

                            setTimeout(() => {
                                CerrarAviso()
                            }, 3000);

                        }
                    }, [actionData, resetForm]); */

                    return (
                        <>  
                            {isSubmitting ? <Spinner show={true} /> : (null)}
                            <form method="post" className="space-y-5 flex justify-center" onSubmit={handleSubmit}>

                                {!ShowTeclado ? (
                                    <div className="min-w-screen min-h-screen flex flex-col justify-center items-center p-2">
                                        <div className="w-full sm:w-11/12 md:w-1/2 lg:w-1/3 bg-white rounded-lg shadow-lg">
                                            <nav className="w-full bg-blue-900 rounded-t-lg shadow-md">
                                                <div className="mx-auto max-w-full px-2 sm:px-2 md:px-3 lg:px-4">
                                                    <div className="relative flex h-full items-center justify-between">
                                                        <div className="flex flex-1 items-center justify-center sm:justify-start my-2">
                                                            <div className="flex shrink-0 items-center p-2 rounded-lg bg-white">
                                                            <img className="w-auto" src={LogoA70} alt="Logo" />
                                                            </div>
                                                            <div className="p-2 sm:ml-4 sm:block w-full h-full">
                                                            <div className="flex flex-col justify-center items-center w-full h-full">
                                                                <span className="font-bold text-white text-xl">Control Comensal</span>
                                                            </div>
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
                                                        <option key={"suc_" + menu.id} value={menu.id}>
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
                                    <div className="w-full max-w-screen md:max-w-lg min-h-screen flex flex-col justify-between items-center p-2">
                                        <div className="w-full flex justify-between items-center bg-blue-900 mb-2 px-4 py-1 text-white text-xs ">
                                            <div className="flex-1 flex flex-row gap-4 ml-2">
                                                <div className="flex justify-start shrink-0 items-center ">
                                                    <img className="w-20 md:w-25 lg:w-30 p-2 rounded-lg bg-white" src={LogoA70} alt="Logo" />
                                                </div>
                                                {/* <div className="grid grid-cols-1 gap-0 ml-2">
                                                    <div> <span className="font-bold text-nowrap">Fecha:</span> <span>{ViewTable.textfecha}</span> </div>
                                                    <div> <span className="font-bold text-nowrap">Cliente:</span> <span>{ViewTable.textcliente}</span> </div>
                                                    <div> <span className="font-bold text-nowrap">Sucursal:</span> <span>{ViewTable.textsucursal}</span> </div>
                                                    <div> <span className="font-bold text-nowrap">Menú:</span> <span>{ViewTable.textmenu}</span> </div>
                                                </div> */}
                                            </div>
                                            <div className="w-1/9 flex justify-end items-center p-1"><button type="button" className="text-3xl text-red-900 cursor-pointer" onClick={()=>{setShowTeclado(false); formikRef?.current?.setFieldValue('menu', '');}}><BsFillXCircleFill/></button></div>
                                        </div>
                                        <div className="w-full grid grid-cols-1 gap-0 ml-2">
                                            <div> <span className="font-bold text-nowrap">Fecha:</span> <span>{ViewTable.textfecha}</span> </div>
                                            <div> <span className="font-bold text-nowrap">Cliente:</span> <span>{ViewTable.textcliente}</span> </div>
                                            <div> <span className="font-bold text-nowrap">Sucursal:</span> <span>{ViewTable.textsucursal}</span> </div>
                                            <div> <span className="font-bold text-nowrap">Menú:</span> <span>{ViewTable.textmenu}</span> </div>
                                        </div>
                                        <div className="w-full bg-white rounded-lg shadow-lg p-4 mb-2 grid grid-rows-1 gap-4 text-right">
                                            {UltimaCedula ? (
                                                <div>
                                                    <span className="font-bold">Anterior:</span>
                                                    <span className="text-red-900">{new Intl.NumberFormat('es-ES').format(Number(UltimaCedula))}</span>
                                                </div>
                                            ):(null)}
                                        </div>
                                        <div className="min-w-full mx-auto p-4 bg-black rounded-lg">
                                            <div id="div-numero" className="flex flex-col justify-center items-center rounded-lg text-center text-4xl h-1/6 mb-4 bg-white">
                                                <span className={`${ Cedula.length > 0 ? "font-bold" : "font-extralight text-gray-300 italic" } tracking-wide`}>{Cedula.length > 0 ? Cedula : "00000000"}</span>
                                                <span className={`${ NombreCedula.length > 0 ? "font-bold bg-orange-200 rounded-md" : "font-extralight text-gray-300 italic" } text-nowrap text-xs md:text-lg tracking-wide`}>{NombreCedula.length > 0 ? <span className="mx-2 my-0.5 italic">{NombreCedula}</span> : "Sin Identificar"}</span>
                                                <input 
                                                    type="text"
                                                    id="cedula"
                                                    name="cedula"
                                                    className="hidden"
                                                    value={Cedula}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("1"); }}><span className="flex justify-center items-center text-4xl"><BsFill1SquareFill/></span></button>
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("2"); }}><span className="flex justify-center items-center text-4xl"><BsFill2SquareFill/></span></button>
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("3"); }}><span className="flex justify-center items-center text-4xl"><BsFill3SquareFill/></span></button>
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("4"); }}><span className="flex justify-center items-center text-4xl"><BsFill4SquareFill/></span></button>
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("5"); }}><span className="flex justify-center items-center text-4xl"><BsFill5SquareFill/></span></button>
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("6"); }}><span className="flex justify-center items-center text-4xl"><BsFill6SquareFill/></span></button>
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("7"); }}><span className="flex justify-center items-center text-4xl"><BsFill7SquareFill/></span></button>
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("8"); }}><span className="flex justify-center items-center text-4xl"><BsFill8SquareFill/></span></button>
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("9"); }}><span className="flex justify-center items-center text-4xl"><BsFill9SquareFill/></span></button>
                                                <button type="button" className="bg-red-900 text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ BorrarUltimoCaracter(); }}>Borrar</button>
                                                <button type="button" className="bg-blue-900 text-lg text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 active:scale-95" onClick={()=>{ IngresarCedula("0"); }}><span className="flex justify-center items-center text-4xl"><BsFill0SquareFill/></span></button>
                                                <button type="submit" className={`text-white font-semibold rounded-lg py-4 shadow-md shadow-gray-50 ${Cedula.length >= 7 ? 'bg-green-900 active:scale-95' : 'bg-gray-400 cursor-not-allowed'}`} disabled={Cedula.length < 7} > Enviar </button>
                                            </div>
                                        </div>
                                    </div>
                                ):(null)}
                                {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                            </form>
                        </>
                    );
                }}

            </Formik>
        </>
    );
}