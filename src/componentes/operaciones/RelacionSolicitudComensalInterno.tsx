import React from "react";
import type { TypeTipoComensal, TypeArrayCliente, TypeArrayMenu, TypeArraySucursal, TypeCargo, TypeGerencia, TypeSolicitudComensal } from "../../util/types";
import Spinner from "../modal/Spinner";
import { useEffect, useRef, useState } from "react";
import { Formik, type FormikProps } from "formik";
import { useAuth } from "../../context/AuthContext";
import { Now, obtenerPersonalComensal, obtenerSolicitudComensal, obtenerTipoComensal } from "../../consultasDB/apiSupabase";
import { ajustarFechaHora } from "../../util/workDate";


export default function RelacionSolicitudComensalInterno() {
    const { dataUser, idscliente, idssucursal, idsmenu } = useAuth();
    const arrayClientes = (idscliente || []) as unknown as TypeArrayCliente[];
    const arraySucursales = (idssucursal || []) as unknown as TypeArraySucursal[];
    const arrayMenus = (idsmenu || []) as unknown as TypeArrayMenu[];

    const [ShowSpinner, setShowSpinner] = useState(false)
    const [TableCoincidencia, setTableCoincidencia] = useState(false);

    const formikRef = useRef<FormikProps<{
        fecha: string;
        cliente: string | number;
        sucursal: string | number;
        menu: string | number;
        cedula: string[];
        comensal: string[];
        usuario: number | undefined;
    }> | null>(null);
    
    const [ArraySucursales, setArraySucursales] = useState<any[]>([]);
    
    interface Personal {
        nrocedula: number | string;
        nombres_personal: string;
        apellidos_personal: string;
        tipocomensal: TypeTipoComensal;
        cargo: TypeCargo;
        gerencia: TypeGerencia;
    }
    const [ArrayPersonal, setArrayPersonal] = useState<Personal[]>([]);
    const [ArrayMenus, setArrayMenus] = useState<any[]>([]);
    const [horaActual, setHoraActual] = useState<{ fechaSisA: Date; fechaSisB: Date; dSis: string; mSis: string; ySis: string; hSis: string; iSis: string }>({
        fechaSisA: new Date(),
        fechaSisB: new Date(),
        dSis: "",
        mSis: "",
        ySis: "",
        hSis: "",
        iSis: ""
    });
    const [ArraySolicitud, setArraySolicitud] = useState<any[]>([]);
    const [ArrayTipoComensal, setArrayTipoComensal] = useState<any[]>([]);
    const [Volcado, setVolcado] = useState(false);

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
    
    useEffect( () => {

        if(Volcado){
            let fecha=formikRef?.current?.values.fecha
            let cliente=formikRef?.current?.values.cliente
            let sucursal=formikRef?.current?.values.sucursal
            let menu=formikRef?.current?.values.menu
            let gerencias= dataUser?.V_T ? []: dataUser?.idsgerencia
            if(fecha!="" && cliente!="" /* && sucursal!="" && menu!="" */){                
                
                async function main() {
                    try {
                        setShowSpinner(true);
                        const [personalData, tipocomensalData, solicitudData, nowData] = await Promise.all([
                            obtenerPersonalComensal(Number(cliente), gerencias),
                            obtenerTipoComensal(),
                            obtenerSolicitudComensal(Number(cliente), Number(sucursal), Number(menu), String(fecha)),
                            Now()
                        ]);
                        setArrayPersonal(personalData as Personal[]);
                        setArrayTipoComensal(tipocomensalData as TypeTipoComensal[]);
                        setArraySolicitud(solicitudData as TypeSolicitudComensal[]);
                        const now = ajustarFechaHora(new Date(nowData));
                        let ySis= now.getFullYear();
                        let mSis= now.getMonth() + 1;
                        let dSis= now.getDate();
                        let hSis= now.getHours();
                        let iSis= now.getMinutes();
                        const fechaSisA = new Date(Number(ySis), Number(mSis) - 1, Number(dSis));
                        const fechaSisB = new Date(Number(ySis), Number(mSis) - 1, Number(dSis), Number(hSis), Number(iSis));
                        setHoraActual({
                            fechaSisA: fechaSisA,
                            fechaSisB: fechaSisB,
                            dSis: String(dSis > 9 ? dSis : `0${dSis}`),
                            mSis: String(mSis > 9 ? mSis : `0${mSis}`),
                            ySis: String(ySis),
                            hSis: String(hSis > 9 ? hSis : `0${hSis}`),
                            iSis: String(iSis > 9 ? iSis : `0${iSis}`)
                        })
                        
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

    const [ViewMenuSolicitud, setViewMenuSolicitud] = useState<any[]>([]);
    const [ViewSucursalSolicitud, setViewSucursalSolicitud] = useState<any[]>([]);
    const [ViewTipoComensal, setViewTipoComensal] = useState<any[]>([]);
    const [ViewSucursalAgrupado, setViewSucursalAgrupado] = useState<any[]>([]);
    const [ViewGerenciaAgrupado, setViewGerenciaAgrupado] = useState<any[]>([]);
    const [SelSucursal, setSelSucursal] = useState<string[]>([]);
    const [SelMenu, setSelMenu] = useState<string | null>(null);
    const [ViewFinalSucursal, setViewFinalSucursal] = useState<any[]>([]);
    const [ViewFinalGerencia, setViewFinalGerencia] = useState<any[]>([]);

    const handleCheckboxChange = (id:any) => {
        setSelSucursal((prev:any) => {
            if (prev.includes(id)) {
                return prev.filter((item:any) => item !== id);
            } else {
                return [...prev, id];
            }
        });    
    };

    useEffect(() => {
      if (ArraySolicitud.length > 0 && ArrayTipoComensal.length > 0) {
        const nombreSucursales: Set<string> = new Set();
        const nombresMenus: Set<string> = new Set();
        const nombresTipoComensales: Set<string> = new Set();
        const sucursalesAgrupadas: { [nombreSucursal: string]: any } = {};
        const gerenciasAgrupadas: { [nombreGerencia: string]: any } = {};

        ArraySolicitud.forEach(solicitud => {
            const nombreSucursal = obtenerNombreSucursal(solicitud.idsucursal);
            if (nombreSucursal) {
                nombreSucursales.add(nombreSucursal);
            }

            const nombreMenu = obtenerNombreMenu(solicitud.idmenu);
            if (nombreMenu) {
                nombresMenus.add(nombreMenu);
            }

            const nombreTipoComensal = obtenerNombreTipoMenu(solicitud.idtipocomensal);
            if (nombreTipoComensal) {
                nombresTipoComensales.add(nombreTipoComensal);
            }

            const personal = ArrayPersonal.find(p => p.nrocedula === solicitud.nrocedula);
            const gerencia = personal?.gerencia?.nombre || "Sin Gerencia";

            if (nombreSucursal && nombreMenu && nombreTipoComensal) {
                // --- Agrupación por Sucursal → Menú → Tipo Comensal ---
                if (!sucursalesAgrupadas[nombreSucursal]) {
                    sucursalesAgrupadas[nombreSucursal] = {
                        nombre: nombreSucursal,
                        menus: {},
                        tipo_comensales_totales: {}  // <-- Para sumatoria total por tipo comensal en sucursal
                    };
                }

                if (!sucursalesAgrupadas[nombreSucursal].menus[nombreMenu]) {
                    sucursalesAgrupadas[nombreSucursal].menus[nombreMenu] = {
                        tipo_comensales: {}
                    };
                }

                if (!sucursalesAgrupadas[nombreSucursal].menus[nombreMenu].tipo_comensales[nombreTipoComensal]) {
                    sucursalesAgrupadas[nombreSucursal].menus[nombreMenu].tipo_comensales[nombreTipoComensal] = 0;
                }

                sucursalesAgrupadas[nombreSucursal].menus[nombreMenu].tipo_comensales[nombreTipoComensal]++;

                // --- Sumar total por tipo comensal en la sucursal (independiente del menú) ---
                if (!sucursalesAgrupadas[nombreSucursal].tipo_comensales_totales[nombreTipoComensal]) {
                    sucursalesAgrupadas[nombreSucursal].tipo_comensales_totales[nombreTipoComensal] = 0;
                }
                sucursalesAgrupadas[nombreSucursal].tipo_comensales_totales[nombreTipoComensal]++;
            }

            if (gerencia && nombreSucursal && nombreMenu && nombreTipoComensal) {
                if (!gerenciasAgrupadas[gerencia]) {
                    gerenciasAgrupadas[gerencia] = {
                        nombre: gerencia,
                        sucursales: {}
                    };
                }

                if (!gerenciasAgrupadas[gerencia].sucursales[nombreSucursal]) {
                    gerenciasAgrupadas[gerencia].sucursales[nombreSucursal] = {
                        nombre: nombreSucursal,
                        menus: {}
                    };
                }

                if (!gerenciasAgrupadas[gerencia].sucursales[nombreSucursal].menus[nombreMenu]) {
                    gerenciasAgrupadas[gerencia].sucursales[nombreSucursal].menus[nombreMenu] = {
                        tipo_comensales: {}
                    };
                }

                if (!gerenciasAgrupadas[gerencia].sucursales[nombreSucursal].menus[nombreMenu].tipo_comensales[nombreTipoComensal]) {
                    gerenciasAgrupadas[gerencia].sucursales[nombreSucursal].menus[nombreMenu].tipo_comensales[nombreTipoComensal] = 0;
                }

                gerenciasAgrupadas[gerencia].sucursales[nombreSucursal].menus[nombreMenu].tipo_comensales[nombreTipoComensal]++;
            }
        });
        //console.log("sucursalesAgrupadas", sucursalesAgrupadas)
        //console.log("gerenciasAgrupadas", gerenciasAgrupadas)
        setViewMenuSolicitud(Array.from(nombresMenus));
        setViewSucursalSolicitud(Array.from(nombreSucursales));
        setViewTipoComensal(Array.from(nombresTipoComensales));
        setViewSucursalAgrupado(Object.values(sucursalesAgrupadas));
        setViewGerenciaAgrupado(Object.values(gerenciasAgrupadas));
      }
    }, [ArraySolicitud, ArrayTipoComensal, ArrayPersonal]);

    useEffect(() => {
        if(SelSucursal.length > 0 && SelMenu) {
            const fetchHoraActual = async () => {
                try {
                    const now = ajustarFechaHora(new Date(await Now()));
                    let ySis= now.getFullYear();
                    let mSis= now.getMonth() + 1;
                    let dSis= now.getDate();
                    let hSis= now.getHours();
                    let iSis= now.getMinutes();
                    const fechaSisA=new Date(Number(ySis),Number(mSis)-1,Number(dSis))
                    const fechaSisB=new Date(Number(ySis),Number(mSis)-1,Number(dSis), Number(hSis), Number(iSis))

                    setHoraActual({
                        fechaSisA,
                        fechaSisB,
                        dSis: String(dSis > 9 ? dSis : `0${dSis}`),
                        mSis: String(mSis > 9 ? mSis : `0${mSis}`),
                        ySis: String(ySis),
                        hSis: String(hSis > 9 ? hSis : `0${hSis}`),
                        iSis: String(iSis > 9 ? iSis : `0${iSis}`),
                    });
                } catch (error) {
                    console.error("Failed to fetch hora actual:", error);
                }
            };

            fetchHoraActual();
            const filteredData = ViewSucursalAgrupado.filter(sucursal => 
                SelSucursal.includes(sucursal.nombre) && 
                Object.keys(sucursal.menus).includes(SelMenu)
            );
            const filteredGerencias = ViewGerenciaAgrupado.filter(gerencia =>
                Object.keys(gerencia.sucursales).some(sucursal =>
                    SelSucursal.includes(sucursal) &&
                    Object.keys(gerencia.sucursales[sucursal].menus).includes(SelMenu)
                )
            );
            //console.log("filteredData", filteredData)
            //console.log("filteredGerencias", filteredGerencias)
            setViewFinalSucursal(filteredData);
            setViewFinalGerencia(filteredGerencias);
        } else {
            setViewFinalSucursal([]);
        }
    }, [SelSucursal, SelMenu]);
    
    
    function obtenerNombreSucursal(idSucursal: number): string | undefined {
        const sucursal = arraySucursales.find(s => s.id === idSucursal);
        return sucursal ? sucursal.nombre : undefined;
    }
    function obtenerNombreMenu(idMenu: number): string | undefined {
        const menu = arrayMenus.find(m => m.id === idMenu);
        return menu ? menu.nombre : undefined;
    }
    function obtenerNombreTipoMenu(idMenu: number): string | undefined {
        const menu = ArrayTipoComensal.find(m => m.id === idMenu);
        return menu ? menu.nombre : undefined;
    }
    function capitalizarCadaPalabra(texto: string) {
        if (!texto) return "";
        return texto.toLowerCase().split(' ').map(palabra => {
            return palabra.charAt(0).toUpperCase() + palabra.slice(1);
        }).join(' ');
    }

    const ViewPorSucursal = () => {

        const fechaSe:any=formikRef.current?.values.fecha
        const clienteSe:any=formikRef.current?.values.cliente
        const [ySel, mSel, dSel]=fechaSe.split('-')
        const textfecha = dSel+"-"+mSel+"-"+ySel;
        let textcliente = "";
        const clienteYes = arrayClientes.find(element => element.id === parseInt(clienteSe, 10));
        if (clienteYes) { textcliente = clienteYes.nombre; }

        const filas: { gerencia: any; sucursal: string; menu: string; tipoComensales: any; }[] = [];

        SelSucursal.forEach((sucursal) => {
            ViewFinalGerencia.forEach((gerencia) => {
                const sucursalData = gerencia.sucursales[sucursal];
                if (!sucursalData || SelMenu === null || !sucursalData.menus[SelMenu]) return;
                filas.push({
                    gerencia: gerencia.nombre,
                    sucursal,
                    menu: SelMenu,
                    tipoComensales: sucursalData.menus[SelMenu].tipo_comensales,
                });
            });
        });
        // Agrupar filas por sucursal
        const filasPorSucursal = filas.reduce((acc: { [key: string]: typeof filas }, fila) => {
            if (!acc[fila.sucursal]) acc[fila.sucursal] = [];
            acc[fila.sucursal].push(fila);
            return acc;
        }, {} as { [key: string]: typeof filas });        

        return(            
            <>            
                {ArraySolicitud.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <>
                                {ViewSucursalSolicitud && ViewSucursalSolicitud.length > 0 ? (
                                    <fieldset className="min-w-full border-2 border-solid rounded-md">
                                        <legend className="py-2 px-2 bg-blue-900 rounded-lg text-sm font-bold text-white">Sucursal</legend>
                                        <div className='flex flex-row justify-between items-center p-1 flex-wrap'>
                                            {ViewSucursalSolicitud.map((d, i) => (
                                                <div key={"suc_sol_" + i} className='flex flex-row justify-start items-center p-1 text-sm font-bold'>
                                                    <div className="flex justify-center items-center border-2 p-2 bg-blue-900 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg text-nowrap">
                                                        <input 
                                                            type="checkbox" 
                                                            className='mr-1'
                                                            id={`sucsol_${d}`}
                                                            checked={SelSucursal.includes(d)} 
                                                            onChange={() => handleCheckboxChange(d)}
                                                        />
                                                        <label htmlFor={`sucsol_${d}`} className='font-bold text-sm hover:cursor-pointer text-nowrap'>{capitalizarCadaPalabra(d)}</label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </fieldset>
                                ) : (
                                    <span>No hay registros</span>
                                )}
                                {ViewMenuSolicitud && ViewMenuSolicitud.length > 0 ? (
                                    <fieldset className="min-w-full border-2 border-solid rounded-md">
                                        <legend className="py-2 px-2 bg-blue-900 rounded-lg text-sm font-bold text-white">Menú</legend>
                                        <div className='flex flex-row justify-between items-center p-1 flex-wrap'>
                                            {ViewMenuSolicitud.map((d, i) => (
                                                <div key={"suc_sol_" + i} className='flex flex-row justify-start items-center p-1 text-sm font-bold'>
                                                    <div className="flex justify-center items-center border-2 p-2 bg-blue-900 hover:bg-blue-700 hover:cursor-pointer text-white rounded-lg text-nowrap">
                                                        <input 
                                                            type="radio" 
                                                            className='mr-1' 
                                                            id={`mensol_${d}`} 
                                                            name='menu'
                                                            value={d} 
                                                            checked={SelMenu === d}
                                                            onChange={() => setSelMenu(d)}
                                                        />
                                                        <label htmlFor={`mensol_${d}`} className='font-bold text-sm hover:cursor-pointer text-nowrap'>{capitalizarCadaPalabra(d)}</label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </fieldset>
                                ) : (
                                    <span>No hay registros</span>
                                )}
                            </>
                        </div>
                        <div className="flex justify-center items-center mt-4">
                            {ViewFinalSucursal.length > 0 ? (
                                <table className="min-w-auto divide-y divide-gray-200 mt-4">
                                    <thead className="bg-blue-900">
                                        <tr>
                                            <td colSpan={10} className="p-3 text-xs border border-slate-300 text-center text-white">
                                                <div className="grid grid-rows-[auto_auto_auto] gap-1">
                                                    <div className="font-bold">RELACIÓN DE SOLICITUD</div>
                                                    <div className="grid grid-cols-2 gap-1 items-center mt-4">
                                                        <span className="flex flex-col justify-center items-center justify-self-start">
                                                            <span className="font-bold">FECHA</span>
                                                            <span>{textfecha}</span>
                                                        </span>
                                                        <span className="flex flex-col justify-center items-center justify-self-end">
                                                            <span className="font-bold">CLIENTE</span>
                                                            <span>{textcliente}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-center items-center mt-4">
                                                        <span className="flex flex-col justify-center items-center">
                                                            <span className="font-bold">FECHA EMISIÓN</span>
                                                            <span>{horaActual.dSis}-{horaActual.mSis}-{horaActual.ySis} {horaActual.hSis}:{horaActual.iSis}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="p-3 text-xs border border-slate-300 font-bold text-center text-white">SUCURSAL</th>
                                            <th className="p-3 text-xs border border-slate-300 font-bold text-center text-white">MENÚ</th>
                                            {ViewTipoComensal.map((tipoComensal, index) => (
                                                <th key={index} className="p-3 text-xs border border-slate-300 font-bold text-center text-white">
                                                    {tipoComensal}
                                                </th>
                                            ))}
                                            <th className="p-3 text-xs border border-slate-300 font-bold text-center text-white">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ViewFinalSucursal.map((sucursal, index) => (
                                            <tr key={index}>
                                                <td className="p-2 text-xs text-left border border-slate-300">{sucursal.nombre}</td>
                                                <td className="p-2 text-xs text-left border border-slate-300">{SelMenu}</td>
                                                {ViewTipoComensal.map((tipoComensal, tipoIndex) => (
                                                    <td key={tipoIndex} className="p-2 text-xs text-center border border-slate-300">
                                                        {SelMenu ? (sucursal.menus[SelMenu]?.tipo_comensales[tipoComensal] || "-") : "-"}
                                                    </td>
                                                ))}
                                                <td className="p-2 text-xs text-center border border-slate-300 font-bold">
                                                    {SelMenu ? Number(Object.values(sucursal.menus[SelMenu]?.tipo_comensales || {}).reduce((acc: number, val: any) => acc + Number(val), 0)) : 0}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>    
                            ) : (
                                null
                            )}
                        </div>
                        <div className="grid grid-cols-1 justify-center items-center gap-4 mt-4">
                            {ViewFinalGerencia.length > 0 ? (
                                Object.entries(filasPorSucursal).map(([sucursal, filasSucursal]) => {
                                    // Calcular totales por columna para esta sucursal
                                    const totalesPorColumna: Record<string, number> = {};
                                    ViewTipoComensal.forEach(tipo => {
                                        totalesPorColumna[tipo] = filasSucursal.reduce(
                                            (acc, fila) => acc + (Number(fila.tipoComensales[tipo]) || 0),
                                            0
                                        );
                                    });

                                    // Total general por sucursal (suma de todos los totales fila)
                                    const totalGeneral = filasSucursal.reduce((acc, fila) => {
                                        const totalFila = Object.values(fila.tipoComensales).reduce(
                                            (a: number, v) => a + Number(v),
                                            0
                                        );
                                        return acc + totalFila;
                                    }, 0);

                                    return (
                                        <div key={sucursal} className="flex justify-center items-center mb-4">
                                            <table className="min-w-auto divide-y divide-gray-200 mt-4 border border-gray-300">
                                                <thead className="bg-blue-900">
                                                    <tr>
                                                        <td colSpan={10} className="p-3 text-xs border border-slate-300 text-center text-white">
                                                            <div className="grid grid-rows-[auto_auto_auto] gap-1">
                                                                <div className="font-bold">RELACIÓN DE SOLICITUD</div>
                                                                <div className="grid grid-cols-3 gap-1 items-center mt-4">
                                                                    <span className="flex flex-col justify-center items-center justify-self-start">
                                                                        <span className="font-bold">FECHA</span>
                                                                        <span>{textfecha}</span>
                                                                    </span>
                                                                    <span className="flex flex-col justify-center items-center justify-self-center">
                                                                        <span className="font-bold">CLIENTE</span>
                                                                        <span>{textcliente}</span>
                                                                    </span>
                                                                    <span className="flex flex-col justify-center items-center justify-self-end">
                                                                        <span className="font-bold">SUCURSAL</span>
                                                                        <span>{sucursal}</span>
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-center items-center mt-4">
                                                                    <span className="flex flex-col justify-center items-center">
                                                                        <span className="font-bold">FECHA EMISIÓN</span>
                                                                        <span>{horaActual.dSis}-{horaActual.mSis}-{horaActual.ySis} {horaActual.hSis}:{horaActual.iSis}</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                    <th className="p-3 text-xs border border-slate-300 font-bold text-center text-white">GERENCIA</th>
                                                    <th className="p-3 text-xs border border-slate-300 font-bold text-center text-white">MENÚ</th>
                                                    {ViewTipoComensal.map((tipoComensal, index) => (
                                                        <th key={index} className="p-3 text-xs border border-slate-300 font-bold text-center text-white">
                                                        {tipoComensal}
                                                        </th>
                                                    ))}
                                                    <th className="p-3 text-xs border border-slate-300 font-bold text-center text-white">TOTAL</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filasSucursal.map((fila, idx) => {
                                                        const totalFila = Object.values(fila.tipoComensales).reduce(
                                                            (acc: number, val) => acc + Number(val),
                                                            0
                                                        );
                                                        return (
                                                            <tr key={`${sucursal}_${idx}`}>
                                                                <td className="p-2 text-xs text-left border border-slate-300">{fila.gerencia}</td>
                                                                <td className="p-2 text-xs text-left border border-slate-300">{fila.menu}</td>
                                                                {ViewTipoComensal.map((tipo, i) => (
                                                                    <td key={i} className="p-2 text-xs text-center border border-slate-300">
                                                                    {fila.tipoComensales[tipo] || "-"}
                                                                    </td>
                                                                ))}
                                                                <td className="p-2 text-xs text-center border border-slate-300 font-bold">{totalFila}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {/* Fila de totales */}
                                                    <tr className="bg-blue-900 font-bold">
                                                        <td className="p-2 text-xs text-right border border-slate-300 text-white" colSpan={2}>TOTALES</td>
                                                        {ViewTipoComensal.map((tipo, i) => (
                                                            <td key={i} className="p-2 text-xs text-center border border-slate-300 text-white font-bold">
                                                                {totalesPorColumna[tipo]}
                                                            </td>
                                                        ))}
                                                        <td className="p-2 text-xs text-center border border-slate-300 text-white font-bold">{totalGeneral}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })
                            ) : (
                            null
                            )}
                        </div>
                    </>
                ) : (
                    <div>No hay coincidencias</div>
                )}            
            </>
        )
    }


    return (
        <>
            <Spinner show={ShowSpinner} />
            <Formik
                innerRef={formikRef} 
                initialValues={{
                    fecha: "",
                    cliente: "",
                    sucursal: "",
                    menu:'',
                    cedula:[],
                    comensal:[],
                    usuario: dataUser?.id_usuario
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
                    return null
                }}
            >
                {({ isSubmitting, values, touched, errors, handleChange, handleBlur, handleSubmit }) => { 

                    return(
                        isSubmitting ? (
                            <Spinner show={true} />                            
                        ) : (
                            <> 
                                <form method="post" className="space-y-5" onSubmit={handleSubmit}>
                                    <div className="flex justify-around items-center">
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
                                                    setSelMenu("")
                                                    setSelSucursal([])
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
                                                    onClick={(e) => {
                                                        values.sucursal=""
                                                        values.menu=""
                                                        setArrayMenus([])
                                                        setSelMenu("")
                                                        setSelSucursal([])
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
                                    </div>
                                    {TableCoincidencia ? (
                                        <>
                                            <ViewPorSucursal/>                                            
                                        </>
                                    ) : null}                            
                                    
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