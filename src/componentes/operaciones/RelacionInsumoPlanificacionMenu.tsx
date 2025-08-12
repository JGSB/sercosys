import { Formik, type FormikProps } from "formik";
import { useState, useRef, type ChangeEvent, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import type { TypeArrayCliente, TypeArraySucursal } from "../../util/types";
import Spinner from "../modal/Spinner";
import { obtenerGramaje, obtenerPlanificacionMenuSemana } from "../../consultasDB/apiSupabase";
import { BsFillClipboard2CheckFill } from "react-icons/bs";

export default function RelacionInsumoPlanificacionMenu() {
    const { dataUser, idscliente} = useAuth();
    const arrayClientes = (idscliente || []) as unknown as TypeArrayCliente[];

    const [ShowSpinner, setShowSpinner] = useState(false)
    const [TableCoincidencia, setTableCoincidencia] = useState(false);

    const formikRef = useRef<FormikProps<{
        semanaA: string;
        semanaB: string;
        cliente: string | number;
        usuario: number | undefined;
    }> | null>(null);

    const [ArraySucursales, setArraySucursales] = useState<any[]>([]);
    const [ArraySemana, setArraySemana] = useState<any[]>([]);
    const [ArrayGramaje, setArrayGramaje] = useState<any[]>([]);
    const [PlanificacionMenu, setPlanificacionMenu] = useState<any[]>([]);
    const [Volcado, setVolcado] = useState(false);
    const [VolcadoFecha, setVolcadoFecha] = useState(false);
    const [selectedSucursales, setSelectedSucursales] = useState<any[]>([]);
    const [CallSeletIDSuc, setCallSeletIDSuc] = useState(false);

    const ChangeCliente = (e: ChangeEvent<HTMLSelectElement>) => {
        formikRef?.current?.setFieldValue('cliente', e.target.value);

        /* const selectedClienteId = e.target.value;
        let filteredSucursales: any[] = [];

        if (selectedClienteId !== "") {
            const clienteIdNum = parseInt(selectedClienteId, 10);
            filteredSucursales = arraySucursales.filter(element => element.idcliente === clienteIdNum);
        }
        setArraySucursales(filteredSucursales); */
        setVolcado(true)
    }

    const isoWeekToDate = (year:number, week:number) => {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dayOfWeek = simple.getDay();
        const isoMonday = new Date(simple);
        const day = dayOfWeek === 0 ? 7 : dayOfWeek;
        isoMonday.setDate(simple.getDate() - day + 1);
        return isoMonday;
    }

    const parseWeek = (week:string) => {
        const [year, ws] = week.split('-W');
        //return parseInt(year) * 100 + parseInt(ws);
        return({
            full: parseInt(year) * 100 + parseInt(ws),
            nro: parseInt(ws)
        })
    }

    const parseWeekString = (weekStr:string) => {
        const [yearStr, weekNumStr] = weekStr.split('-W');
        return {year: parseInt(yearStr), week: parseInt(weekNumStr)};
    }

    const dateToIsoWeekString = (date: Date) => {
        const year = date.getFullYear();

        // Cálculo semana ISO del año para una fecha (lunes)
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7; // lunes=0,... domingo=6
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = new Date(target.getFullYear(),0,4);
        const week = 1 + 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3)/7);

        const weekString = week < 10 ? '0' + week : week;
        return `${year}-W${weekString}`;
    }

    const generarRangoSemanas =(startStr:string, endStr:string) => {
        let {year: startYear, week: startWeek} = parseWeekString(startStr);
        let {year: endYear, week: endWeek} = parseWeekString(endStr);

        let semanas = [];

        // Convertimos cada semana a Date para iterar
        let fechaActual = isoWeekToDate(startYear, startWeek);
        const fechaFin = isoWeekToDate(endYear, endWeek);

        while(fechaActual <= fechaFin) {
            semanas.push(dateToIsoWeekString(fechaActual));
            fechaActual.setDate(fechaActual.getDate() + 7);
        }

        return semanas;
    }

    useEffect(() => {
        if(!dataUser?.V_T && arrayClientes.length === 1) {
            formikRef?.current?.setFieldValue('cliente', arrayClientes[0].id);
            ChangeCliente({ target: { value: arrayClientes[0].id } } as unknown as React.ChangeEvent<HTMLSelectElement>);
        }
    }, [dataUser, arrayClientes]);

    useEffect(() => {
        let semanaA = formikRef?.current?.values.semanaA
        let semanaB = formikRef?.current?.values.semanaB
        let cliente = formikRef?.current?.values.cliente

        if (Volcado) {
            if (semanaA !== "" && semanaB !== "" && cliente !== "") {
                async function main() {
                    try {
                        setShowSpinner(true);
                        const [planificacionData, gramajeData] = await Promise.all([
                            obtenerPlanificacionMenuSemana(ArraySemana, Number(cliente)),
                            obtenerGramaje()
                        ]);
                        //console.log("planificacionData", planificacionData);
                        const gramaje = gramajeData as { data: any };
                        setArraySucursales((planificacionData as { sucursales: any[] })?.sucursales);
                        setPlanificacionMenu((planificacionData as { planificacion: any[] })?.planificacion);
                        setArrayGramaje(gramaje.data);
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
            setVolcado(false);
        }
    }, [Volcado])    

    useEffect(() => {
    
        if(VolcadoFecha) {
            let semanaA = formikRef?.current?.values.semanaA;
            let semanaB = formikRef?.current?.values.semanaB;

            if ((typeof semanaA === "string" && semanaA !== "") && (typeof semanaB === "string" && semanaB !== "")) {

                if (parseWeek(semanaB).full < parseWeek(semanaA).full) {
                    return
                }
                const resultado = generarRangoSemanas(semanaA, semanaB);
                setArraySemana(resultado);
            }

            return () => {
                setVolcadoFecha(false)
            }

        }
        return () => {
            setVolcadoFecha(false)
        }
    }, [VolcadoFecha]);

    const handleCheckboxChange = (id:any) => {
        setSelectedSucursales((prev:any) => {
            if (prev.includes(id)) {
                return prev.filter((item:any) => item !== id);
            } else {
                return [...prev, id];
            }
        });
        setCallSeletIDSuc(true);        
    };

    const handleSelectAll = (e:any) => {
        if (e.target.checked) {
        const allIds:any = ArraySucursales?.map(s => s.id);
        setSelectedSucursales(allIds);
        } else {
            setSelectedSucursales([]);
        }
        setCallSeletIDSuc(true);
    };

    interface CantdSucursal {
        id_sucursal: number;
        nombre_sucursal: string;
        cantidad: number
    }
    interface ProductoSolicitud{
        id_producto?: number,
        nombre_producto?: string,
        rubro?: string,
        letrarubro?: string,
        medida?: string,
        letramedida?: string,
        merma?: number,
        cantidades_por_sucursal?:CantdSucursal[],
        cantidad_total?: number
    }

    interface ViewResultados {
        sucursales?: TypeArraySucursal[],
        solicitud?: ProductoSolicitud[]
    }

    const [viewResultados, setviewResultados] = useState<ViewResultados>({});

    useEffect(() => {
        if(CallSeletIDSuc){

            //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
                function Extrae_gramaje(ficha:number) {
                    return ArrayGramaje.filter(item => item.idfichamenu === ficha);
                }

                function procesarGramaje(ficha: { nroficha: any; nombresucursal: any; xglobal: any; xficha: any; }, sucursal: any, agrupado: any[], multiplicador = null) {
                    const gramajes = Extrae_gramaje(ficha.nroficha);
                    const mult = multiplicador ?? (ficha.xficha === 0 ? ficha.xglobal : ficha.xficha);

                    gramajes.forEach(item => {
                        if (item.producto.ingrediente) {
                            const cantidad = Number(item.cantidad);
                            const gramajeCalc = Number(mult) * cantidad;
                            const gramajeTotal = gramajeCalc + (gramajeCalc * item.producto.merma / 100);
                            
                            agrupado.push({
                                sucursal: sucursal,
                                nombresucursal: ficha.nombresucursal,
                                ficha: ficha.nroficha,
                                multiplicador: mult,
                                gramajeIndicidual: cantidad,
                                gramajesinmerma: gramajeCalc,
                                gramajeTotal: gramajeTotal,
                                merma: item.producto.merma,
                                idProducto: item.producto.id,
                                nombreProducto: item.producto.nombre,
                                rubro: item.producto.rubro.nombre,
                                letrarubro: item.producto.rubro.letra,
                                medida: item.producto.medida.nombre,
                                letramedida: item.producto.medida.letra,
                            });
                        } else {
                            const subFicha = {
                                nroficha: item.producto.idfichamenu,
                                nombresucursal: ficha.nombresucursal,
                                xglobal: ficha.xglobal,
                                xficha: ficha.xficha
                            };
                            procesarGramaje(subFicha, sucursal, agrupado, mult);
                        }
                    });
                }
            //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
            
            if(selectedSucursales.length > 0){
                //console.log("selectedSucursales", selectedSucursales);
                //console.log("PlanificacionMenu", PlanificacionMenu);
                //console.log("ArrayGramaje", ArrayGramaje);
                let agrupado:any[]= [];
                
                selectedSucursales.forEach(suc => {
                    const planificacionItems = PlanificacionMenu.filter(item => item.sucursal.id === suc);
                    //console.log("planificacionItem", planificacionItems);
                    let fichas: any[] = [];
                    planificacionItems.forEach((planificacionItem: any) => {

                        if (planificacionItem && planificacionItem.fichas) {
                            planificacionItem.fichas.forEach((pla: any) => {
                                fichas.push({
                                    nombresucursal: planificacionItem.sucursal.nombre,
                                    nroficha: pla,
                                    xglobal: planificacionItem.cantidadTotal,
                                });
                                planificacionItem.detalles.forEach((det: any) => {
                                    if (det.idFichaMenu === pla) {
                                        fichas[fichas.length - 1].xficha = det.cantidadIndividual;
                                    }
                                });
                            });
                        }
                    });
                    //console.log("fichas", fichas);
                    

                    fichas.forEach((f:any) => {
                        /* ArrayGramaje.forEach(gra => {
                            if (gra.idfichamenu === f.nroficha) {
                                if(gra.producto.ingrediente){
                                    let gramaje= f.xficha===0 ? Number(f.xglobal) * Number(gra.cantidad): Number(f.xficha) * Number(gra.cantidad)
                                    let gramajeTotal = gramaje + ((gramaje * gra.producto.merma) / 100);
                                    agrupado.push({
                                        sucursal: suc,
                                        nombresucursal: f.nombresucursal,
                                        ficha: f.nroficha,
                                        multiplicador: f.xficha === 0 ? f.xglobal : f.xficha,
                                        gramajeIndicidual: gra.cantidad,
                                        gramajesinmerma: gramaje,
                                        gramajeTotal: gramajeTotal,
                                        merma: gra.producto.merma,
                                        nombreProducto: gra.producto.nombre,
                                        rubro: gra.producto.rubro.nombre,
                                        letrarubro: gra.producto.rubro.letra,
                                        medida: gra.producto.medida.nombre,
                                        letramedida: gra.producto.medida.letra,                                        
                                    });
                                }else{
                                    ArrayGramaje.forEach((ing:any) => {
                                        if (ing.idfichamenu === gra.producto.idfichamenu) {
                                            let gramaje= f.xficha===0 ? Number(f.xglobal) * Number(ing.cantidad): Number(f.xficha) * Number(ing.cantidad)
                                            let gramajeTotal = gramaje + ((gramaje * ing.producto.merma) / 100);
                                            agrupado.push({
                                                sucursal: suc,
                                                nombresucursal: f.nombresucursal,
                                                ficha: gra.producto.idfichamenu,
                                                multiplicador: f.xficha === 0 ? f.xglobal : f.xficha,
                                                gramajeIndicidual: ing.cantidad,
                                                gramajesinmerma: gramaje,
                                                gramajeTotal: gramajeTotal,
                                                merma: ing.producto.merma,
                                                nombreProducto: ing.producto.nombre,
                                                rubro: ing.producto.rubro.nombre,
                                                letrarubro: ing.producto.rubro.letra,
                                                medida: ing.producto.medida.nombre,
                                                letramedida: ing.producto.medida.letra
                                            });
                                        }
                                    });
                                }
                            }
                        }); */

                        
                        procesarGramaje(f, suc, agrupado);
                        /* function Extrae_gramaje(ficha:number) {
                            return ArrayGramaje.filter(item => item.idfichamenu === ficha);
                        }

                        const Fgramaje = Extrae_gramaje(f.nroficha);

                        Fgramaje.forEach(gra => {
                            if (gra.producto.ingrediente) {
                                console.log("gramaje1")
                                if(gra.producto.id === 69){
                                    console.log("f1", gra.producto.nombre)
                                }
                                let gramaje= f.xficha===0 ? Number(f.xglobal) * Number(gra.cantidad): Number(f.xficha) * Number(gra.cantidad)
                                let gramajeTotal = gramaje + ((gramaje * gra.producto.merma) / 100);
                                agrupado.push({
                                    sucursal: suc,
                                    nombresucursal: f.nombresucursal,
                                    ficha: f.nroficha,
                                    multiplicador: f.xficha === 0 ? f.xglobal : f.xficha,
                                    gramajeIndicidual: gra.cantidad,
                                    gramajesinmerma: gramaje,
                                    gramajeTotal: gramajeTotal,
                                    merma: gra.producto.merma,
                                    nombreProducto: gra.producto.nombre,
                                    rubro: gra.producto.rubro.nombre,
                                    letrarubro: gra.producto.rubro.letra,
                                    medida: gra.producto.medida.nombre,
                                    letramedida: gra.producto.medida.letra,                                        
                                });
                            }else{
                                console.log("gramaje2")
                                if(gra.producto.id === 69){
                                    console.log("f2", gra.producto.nombre)
                                }
                                const Fgramaje2 = Extrae_gramaje(gra.producto.idfichamenu);
                                Fgramaje2.forEach((gra2:any) => {
                                    if (gra2.producto.ingrediente) {
                                        let gramaje= f.xficha===0 ? Number(f.xglobal) * Number(gra2.cantidad): Number(f.xficha) * Number(gra2.cantidad)
                                        let gramajeTotal = gramaje + ((gramaje * gra2.producto.merma) / 100);
                                        agrupado.push({
                                            sucursal: suc,
                                            nombresucursal: f.nombresucursal,
                                            ficha: gra2.producto.idfichamenu,
                                            multiplicador: f.xficha === 0 ? f.xglobal : f.xficha,
                                            gramajeIndicidual: gra2.cantidad,
                                            gramajesinmerma: gramaje,
                                            gramajeTotal: gramajeTotal,
                                            merma: gra2.producto.merma,
                                            nombreProducto: gra2.producto.nombre,
                                            rubro: gra2.producto.rubro.nombre,
                                            letrarubro: gra2.producto.rubro.letra,
                                            medida: gra2.producto.medida.nombre,
                                            letramedida: gra2.producto.medida.letra
                                        });
                                    }else{
                                        console.log("gramaje3")
                                        if(gra.producto.id === 69){
                                            console.log("f3", gra2.producto.nombre)
                                        }
                                        const Fgramaje3 = Extrae_gramaje(gra2.producto.idfichamenu);
                                        Fgramaje3.forEach((gra3:any) => {
                                            if (gra3.producto.ingrediente) {
                                                let gramaje= f.xficha===0 ? Number(f.xglobal) * Number(gra3.cantidad): Number(f.xficha) * Number(gra3.cantidad)
                                                let gramajeTotal = gramaje + ((gramaje * gra3.producto.merma) / 100);
                                                agrupado.push({
                                                    sucursal: suc,
                                                    nombresucursal: f.nombresucursal,
                                                    ficha: gra3.producto.idfichamenu,
                                                    multiplicador: f.xficha === 0 ? f.xglobal : f.xficha,
                                                    gramajeIndicidual: gra3.cantidad,
                                                    gramajesinmerma: gramaje,
                                                    gramajeTotal: gramajeTotal,
                                                    merma: gra3.producto.merma,
                                                    nombreProducto: gra3.producto.nombre,
                                                    rubro: gra3.producto.rubro.nombre,
                                                    letrarubro: gra3.producto.rubro.letra,
                                                    medida: gra3.producto.medida.nombre,
                                                    letramedida: gra3.producto.medida.letra
                                                });
                                            }else{
                                                console.log("gramaje4")
                                                if(gra3.producto.id === 69){
                                                    console.log("f4", gra3.producto.nombre)
                                                }
                                                const Fgramaje4 = Extrae_gramaje(gra3.producto.idfichamenu);
                                                Fgramaje4.forEach((gra4:any) => {
                                                    if (gra4.producto.ingrediente) {
                                                        let gramaje= f.xficha===0 ? Number(f.xglobal) * Number(gra4.cantidad): Number(f.xficha) * Number(gra4.cantidad)
                                                        let gramajeTotal = gramaje + ((gramaje * gra4.producto.merma) / 100);
                                                        agrupado.push({
                                                            sucursal: suc,
                                                            nombresucursal: f.nombresucursal,
                                                            ficha: gra4.producto.idfichamenu,
                                                            multiplicador: f.xficha === 0 ? f.xglobal : f.xficha,
                                                            gramajeIndicidual: gra4.cantidad,
                                                            gramajesinmerma: gramaje,
                                                            gramajeTotal: gramajeTotal,
                                                            merma: gra4.producto.merma,
                                                            nombreProducto: gra4.producto.nombre,
                                                            rubro: gra4.producto.rubro.nombre,
                                                            letrarubro: gra4.producto.rubro.letra,
                                                            medida: gra4.producto.medida.nombre,
                                                            letramedida: gra4.producto.medida.letra
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }); */
                    });
                });

                //console.log("agrupado", agrupado);

                //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                const agrupado2 = agrupado.reduce((acc, item) => {
                    const key = `${item.sucursal}-${item.idProducto}`;
                    if (!acc[key]) {
                        acc[key] = {
                            sucursal: item.sucursal,
                            nombresucursal: item.nombresucursal,
                            nombreProducto: item.nombreProducto,
                            rubro: item.rubro,
                            letrarubro: item.letrarubro,
                            medida: item.medida,
                            letramedida: item.letramedida,
                            merma: item.merma,
                            sumaGramajesinmerma: 0,
                            sumaGramajeTotal: 0
                        };
                    }
                    acc[key].sumaGramajeTotal += item.gramajeTotal;
                    acc[key].sumaGramajesinmerma += item.gramajesinmerma;
                    return acc;
                }, {});

                    // Para obtener un array con los resultados:
                    const resultado = Object.values(agrupado2);

                    //console.log("Resultado Agrupado2",resultado);
                //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                    let array_productos:any[] = [];
                    let array_sucursales:any[] = [];
                    resultado.forEach((item: any) => {
                        const existeP = array_productos.some(producto => producto.nombreProducto === item.nombreProducto);
                        const existeS = array_sucursales.some(sucursal => sucursal.id === item.sucursal);

                        if (!existeP) {
                            array_productos.push({
                                nombreProducto: item.nombreProducto,
                                rubro: item.rubro,
                                letrarubro: item.letrarubro,
                                medida: item.medida,
                                letramedida: item.letramedida,
                                merma: item.merma,
                            });
                        }
                        if (!existeS) {
                            array_sucursales.push({
                                id: item.sucursal,
                                nombre: item.nombresucursal
                            });
                        }
                    });
                    //console.log("array_productos", array_productos);
                    //console.log("array_sucursales", array_sucursales);
                //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                    
                    let array_solicitud:ProductoSolicitud[]= [];

                    array_productos.forEach(prod => {
                        const { nombreProducto, rubro, letrarubro, medida, letramedida, merma } = prod;
                        let ProductoSolicitud = {
                            nombre_producto: nombreProducto,
                            rubro,
                            letrarubro,
                            medida,
                            letramedida,
                            merma,
                            cantidades_por_sucursal:[] as CantdSucursal[],
                            cantidad_total: 0
                        };
                        let cantidad=false
                        selectedSucursales.forEach(suc => {
                            const id_sucursal = suc
                            let cantidad_total = 0;
                            let nombre_sucursal = "";
                            resultado.forEach((element:any) => {
                                if(element.nombreProducto === nombreProducto && element.sucursal === id_sucursal){
                                    cantidad_total=cantidad_total+element.sumaGramajeTotal
                                    nombre_sucursal = element.nombresucursal;
                                }
                            });
                            ProductoSolicitud.cantidades_por_sucursal.push({
                                id_sucursal,
                                nombre_sucursal,
                                cantidad: cantidad_total
                            });
                            ProductoSolicitud.cantidad_total += cantidad_total;
                            
                            if(cantidad_total > 0){
                                cantidad = true
                            }
                        });
                        if(cantidad){
                            array_solicitud.push(ProductoSolicitud);
                        }
                    });
                    //console.log("array_solicitud", array_solicitud);
                //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                    setviewResultados({
                        sucursales: array_sucursales,
                        solicitud: array_solicitud
                    })
                setTableCoincidencia(true);
            }else{
                setviewResultados({});
            }
        }
        return () => {
            setCallSeletIDSuc(false)
        }
    }, [CallSeletIDSuc])  

    if (!dataUser) {
        return <Spinner show={true} />
    }

    return (
        <>
            <Spinner show={ShowSpinner} />
            <Formik
                innerRef={formikRef}
                initialValues={{
                    semanaA: "",
                    semanaB:"",
                    cliente: "",
                    usuario: dataUser?.id || undefined,
                }}
                validate={(values) => {
                    const errors: { semanaA?: string; semanaB?: string; cliente?: string; } = {};
                    if (!values.semanaA) {
                        errors.semanaA = "Por favor, seleccione una semana";
                    }
                    if (!values.semanaB) {
                        errors.semanaB = "Por favor, seleccione una semana";
                    }
                    if (values.semanaB && values.semanaA && parseWeek(values.semanaB) < parseWeek(values.semanaA)) {
                        errors.semanaB = "No puede ser menor'";
                    }
                    if (!values.cliente) {
                        errors.cliente = "Por favor, seleccione un item";
                    }
                    return errors;
                }}
                onSubmit={() => { }}
            >
                {({isSubmitting, values, touched, errors, handleChange, handleBlur, handleSubmit }) => {
                    
                    return (
                        <>
                            {isSubmitting ? <Spinner show={true} /> : (null)}
                            <form onSubmit={handleSubmit}>
                                <div className="w-full flex justify-around items-center flex-wrap">
                                    <div className="w-auto m-1 p-4 bg-blue-900 flex flex-col justify-center items-center rounded-md">
                                        <div className="flex flex-row justify-center items-center">
                                            <div className="flex flex-col justify-center items-center mr-4">
                                                <label htmlFor="semanaA" className="font-bold text-white mb-2">Desde</label>
                                                <input 
                                                    type="week"
                                                    id="semanaA" 
                                                    name="semanaA"
                                                    className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                    aria-invalid={(touched.semanaA && errors.semanaA) ? "true" : undefined}
                                                    aria-describedby={(touched.semanaA && errors.semanaA) ? "nombre-error" : undefined}
                                                    value={values.semanaA}
                                                    onChange={(e)=>{handleChange(e); setVolcadoFecha(true); setCallSeletIDSuc(true); setviewResultados({}), setSelectedSucursales([])}}
                                                    onBlur={(e)=>{handleBlur(e)}}
                                                    onClick={() => {
                                                        values.semanaB = "";
                                                        !dataUser?.V_T && arrayClientes.length === 1 ? values.cliente: values.cliente=""
                                                        setviewResultados({});
                                                        setTableCoincidencia(false)
                                                    }}

                                                />
                                                {(touched.semanaA && errors.semanaA) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.semanaA}</div>)}
                                            </div>
                                            <div className="flex flex-col justify-center items-center">
                                                <label htmlFor="semanaB" className="font-bold text-white mb-2">Hasta</label>
                                                <input 
                                                    type="week"
                                                    id="semanaB" 
                                                    name="semanaB"
                                                    className="form-select block w-full px-3 py-1.5 text-base font-normal text-black bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out mb-1 focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none"
                                                    aria-invalid={(touched.semanaB && errors.semanaB) ? "true" : undefined}
                                                    aria-describedby={(touched.semanaB && errors.semanaB) ? "nombre-error" : undefined}
                                                    value={values.semanaB}
                                                    onChange={(e)=>{handleChange(e); setVolcadoFecha(true); setCallSeletIDSuc(true); setviewResultados({}); setSelectedSucursales([])}}
                                                    onBlur={(e)=>{handleBlur(e)}}
                                                    onClick={() => {
                                                        !dataUser?.V_T && arrayClientes.length === 1 ? values.cliente: values.cliente=""
                                                        setviewResultados({});
                                                        setTableCoincidencia(false)
                                                    }}

                                                />
                                                {(touched.semanaB && errors.semanaB) && (<div id="nombre-error" className="w-full text-xs bg-orange-100 border-l-4 border-red-900 text-red-900 px-2 py-0.5 mt-1 rounded">{errors.semanaB}</div>)}
                                            </div>
                                        </div>
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
                                                onChange={(e) => { handleChange(e); ChangeCliente(e); setSelectedSucursales([]); setviewResultados({}); setArraySucursales([]); }}
                                                onBlur={(e)=>{handleBlur(e)}}
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
                                {TableCoincidencia ?(
                                    <>
                                        <div className="w-auto flex flex-col justify-center items-center">
                                            {ArraySucursales.length > 0 ? (
                                                ArraySucursales.length > 1 ? (
                                                    <fieldset className="min-w-full border-2 border-solid">
                                                        <legend>
                                                            <div className='flex flex-row justify-center items-center py-1 px-2 text-sm font-bold'>
                                                                <div className="border-2 p-2 bg-blue-900 hover:bg-blue-500 hover:cursor-pointer text-white rounded-lg">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className='mr-1' 
                                                                        onChange={handleSelectAll} 
                                                                        checked={selectedSucursales.length === ArraySucursales.length}
                                                                        id="select_all" 
                                                                    />
                                                                    <label htmlFor="select_all" className='font-bold text-sm hover:cursor-pointer text-nowrap'>{selectedSucursales.length === ArraySucursales.length ? "Deseleccionar Todo":"Seleccionar Todo"}</label>
                                                                </div>
                                                            </div>
                                                        </legend>
                                                            <div className='grid gap-0 p-1' style={{gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))"}}>
                                                                {ArraySucursales?.map(function(d,i) {
                                                                    return (                                             
                                                                        <div key={"suc_sol_"+i} className='flex flex-row justify-center items-center p-1 text-sm font-bold w-full'>
                                                                            <div className="border-2 p-2 bg-blue-900 hover:bg-blue-500 hover:cursor-pointer text-white rounded-lg text-nowrap">
                                                                                <input type="checkbox" className='mr-1' id={`sucsol_${d.id}`} name='sucursal[]' value={d.id} checked={selectedSucursales.includes(d.id)} onChange={() => handleCheckboxChange(d.id)}/>
                                                                                <label htmlFor={`sucsol_${d.id}`} className='font-bold text-sm hover:cursor-pointer text-nowrap'>{d.nombre}</label>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                    </fieldset>

                                                ):(
                                                    ArraySucursales.map(function(d,i) {
                                                        return (                                             
                                                            <div key={"suc_sol_"+i} className='flex flex-row justify-center items-center p-1 text-sm font-bold'>
                                                                <div className="border-2 p-2 bg-blue-900 hover:bg-blue-500 hover:cursor-pointer text-white rounded-lg">
                                                                    <input type="checkbox" className='mr-1' id={`sucsol_${d.id}`} name='sucursal[]' value={d.id} checked={selectedSucursales.includes(d.id)} onChange={() => handleCheckboxChange(d.id)}/>
                                                                    <label htmlFor={`sucsol_${d.id}`} className='font-bold text-sm hover:cursor-pointer text-nowrap'>{d.nombre}</label>
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                )

                                            ):(
                                                <span>No hay registros</span>
                                            )}
                                            {viewResultados && (viewResultados?.sucursales?.length ?? 0) > 0 &&
                                                <div className="min-w-full mt-4">
                                                    <>
                                                        <fieldset className="max-w-full border-2 border-solid border-blue-900 rounded-lg p-3 mb-2">
                                                            <legend className="py-0.5 px-2 rounded-lg text-xs sm:text-md md:text-7xl font-bold text-blue-900 text-center"><BsFillClipboard2CheckFill /></legend>
                                                            
                                                            {viewResultados?.solicitud?.some(pro => pro.letrarubro === "D") && (
                                                                <fieldset className="max-w-full border-double border-2 border-blue-900 rounded-lg p-3 mb-2">
                                                                    <legend className="py-2 px-2 bg-blue-900 rounded-lg text-sm font-bold text-white hover:bg-blue-700">Distribución</legend>

                                                                        <table className="min-w-full divide-y divide-gray-200">
                                                                            <thead className="bg-blue-900">
                                                                                <tr>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">ITEM</th>
                                                                                    <th style={{ width: "12%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">RUBRO</th>
                                                                                    <th style={{ width: "30%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">PRODUCTO</th>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">MEDIDA</th>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">% MERMA</th>
                                                                                    {viewResultados?.sucursales?.map(function(d,i) {
                                                                                        return (
                                                                                            <th style={{ width: (viewResultados?.sucursales?.length ?? 0) > 4 ? "3%" : "auto%" }} key={"suc_resultado_"+i} className={`${(viewResultados?.sucursales?.length ?? 0) > 4 ? "[writing-mode:sideways-lr] [text-orientation:mixed] text-left" : "text-center text-nowrap"} text-white py-4 px-2 text-xs border border-slate-300 font-bold`} title={d.nombre}>{d.nombre}</th>
                                                                                        )
                                                                                    })}
                                                                                    {(viewResultados?.sucursales?.length ?? 0) > 1 && (
                                                                                        <th style={{ width: "10%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">TOTAL</th>
                                                                                    )}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                            {viewResultados?.solicitud ?.filter(pro => pro.letrarubro === "D")
                                                                                .sort((a, b) => { const rubroA = a.rubro ?? ""; const rubroB = b.rubro ?? ""; if (rubroA < rubroB) return -1; if (rubroA > rubroB) return 1; const nameA = a.nombre_producto ?? ""; const nameB = b.nombre_producto ?? ""; return nameA.localeCompare(nameB); })
                                                                                .map((pro, ipro) => (
                                                                                <tr key={ipro}>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{ipro + 1}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.rubro}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.nombre_producto}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.medida}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.merma===0 ? "-" : pro.merma + "%"}</td>
                                                                                    {pro.cantidades_por_sucursal?.map((pcantd, ipcantd) => (
                                                                                        viewResultados?.sucursales?.map(function(d) {
                                                                                            if(pcantd.id_sucursal == d.id){
                                                                                                return (
                                                                                                    <td key={"solicitud_" + ipro + "_sucursal_" + ipcantd} className={`${(viewResultados?.sucursales?.length ?? 0) === 1 ? "font-extrabold" : ""} p-1 text-xs border border-slate-300 text-center`} > {pcantd.cantidad === 0 ? "--" : Number(pcantd.cantidad).toFixed(2) + " " + pro.letramedida} </td>
                                                                                                );
                                                                                            }
                                                                                        })
                                                                                    ))}
                                                                                    {(viewResultados?.sucursales?.length ?? 0) > 1 && (
                                                                                        <td className="p-1 text-sm border border-slate-300 text-center font-extrabold">{Number(pro.cantidad_total).toFixed(2)+ " " + pro.letramedida}</td>
                                                                                    )}
                                                                                </tr>
                                                                            ))}

                                                                            </tbody>
                                                                        </table>

                                                                </fieldset>                                                   
                                                            )}
                                                            
                                                            {viewResultados?.solicitud?.some(pro => pro.letrarubro === "F") && (
                                                                <fieldset className="max-w-full border-double border-2 border-blue-900 rounded-lg p-3 mb-2">
                                                                    <legend className="py-2 px-2 bg-blue-900 rounded-lg text-sm font-bold text-white hover:bg-blue-700">Frigorífico</legend>

                                                                        <table className="min-w-full divide-y divide-gray-200">
                                                                            <thead className="bg-blue-900">
                                                                                <tr>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">ITEM</th>
                                                                                    <th style={{ width: "12%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">RUBRO</th>
                                                                                    <th style={{ width: "30%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">PRODUCTO</th>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">MEDIDA</th>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">% MERMA</th>
                                                                                    {viewResultados?.sucursales?.map(function(d,i) {
                                                                                        return (
                                                                                            <th style={{ width: (viewResultados?.sucursales?.length ?? 0) > 4 ? "3%" : "auto%" }} key={"suc_resultado_"+i} className={`${(viewResultados?.sucursales?.length ?? 0) > 4 ? "[writing-mode:sideways-lr] [text-orientation:mixed] text-left" : "text-center text-nowrap"} text-white py-4 px-2 text-xs border border-slate-300 font-bold`} title={d.nombre}>{d.nombre}</th>
                                                                                        )
                                                                                    })}
                                                                                    {(viewResultados?.sucursales?.length ?? 0) > 1 && (
                                                                                        <th style={{ width: "10%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">TOTAL</th>
                                                                                    )}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                            {viewResultados?.solicitud ?.filter(pro => pro.letrarubro === "F")
                                                                                .sort((a, b) => { const rubroA = a.rubro ?? ""; const rubroB = b.rubro ?? ""; if (rubroA < rubroB) return -1; if (rubroA > rubroB) return 1; const nameA = a.nombre_producto ?? ""; const nameB = b.nombre_producto ?? ""; return nameA.localeCompare(nameB); })
                                                                                .map((pro, ipro) => (
                                                                                <tr key={ipro}>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{ipro + 1}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.rubro}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.nombre_producto}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.medida}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.merma===0 ? "-" : pro.merma + "%"}</td>
                                                                                    {pro.cantidades_por_sucursal?.map((pcantd, ipcantd) => (
                                                                                        viewResultados?.sucursales?.map(function(d) {
                                                                                            if(pcantd.id_sucursal == d.id){
                                                                                                return (
                                                                                                    <td key={"solicitud_" + ipro + "_sucursal_" + ipcantd} className={`${(viewResultados?.sucursales?.length ?? 0) === 1 ? "font-extrabold" : ""} p-1 text-xs border border-slate-300 text-center`} > {pcantd.cantidad === 0 ? "--" : Number(pcantd.cantidad).toFixed(2) + " " + pro.letramedida} </td>
                                                                                                )
                                                                                            }
                                                                                        })
                                                                                    ))}
                                                                                    {(viewResultados?.sucursales?.length ?? 0) > 1 && (
                                                                                        <td className="p-1 text-sm border border-slate-300 text-center font-extrabold">{Number(pro.cantidad_total).toFixed(2)+ " " + pro.letramedida}</td>
                                                                                    )}
                                                                                </tr>
                                                                            ))}
                                                                            </tbody>
                                                                        </table>

                                                                </fieldset>                                                   
                                                            )}
                                                            
                                                            {viewResultados?.solicitud?.some(pro => pro.letrarubro === "M") && (
                                                                <fieldset className="max-w-full border-double border-2 border-blue-900 rounded-lg p-3 mb-2">
                                                                    <legend className="py-2 px-2 bg-blue-900 rounded-lg text-sm font-bold text-white hover:bg-blue-700">Mayorista</legend>

                                                                        <table className="min-w-full divide-y divide-gray-200">
                                                                            <thead className="bg-blue-900">
                                                                                <tr>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">ITEM</th>
                                                                                    <th style={{ width: "12%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">RUBRO</th>
                                                                                    <th style={{ width: "30%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">PRODUCTO</th>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">MEDIDA</th>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">% MERMA</th>
                                                                                    {viewResultados?.sucursales?.map(function(d,i) {
                                                                                        return (
                                                                                            <th style={{ width: (viewResultados?.sucursales?.length ?? 0) > 4 ? "3%" : "auto%" }} key={"suc_resultado_"+i} className={`${(viewResultados?.sucursales?.length ?? 0) > 4 ? "[writing-mode:sideways-lr] [text-orientation:mixed] text-left" : "text-center text-nowrap"} text-white py-4 px-2 text-xs border border-slate-300 font-bold`} title={d.nombre}>{d.nombre}</th>
                                                                                        )
                                                                                    })}
                                                                                    {(viewResultados?.sucursales?.length ?? 0) > 1 && (
                                                                                        <th style={{ width: "10%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">TOTAL</th>
                                                                                    )}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                            {viewResultados?.solicitud ?.filter(pro => pro.letrarubro === "M")
                                                                                .sort((a, b) => { const rubroA = a.rubro ?? ""; const rubroB = b.rubro ?? ""; if (rubroA < rubroB) return -1; if (rubroA > rubroB) return 1; const nameA = a.nombre_producto ?? ""; const nameB = b.nombre_producto ?? ""; return nameA.localeCompare(nameB); })
                                                                                .map((pro, ipro) => (
                                                                                <tr key={ipro}>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{ipro + 1}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.rubro}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.nombre_producto}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.medida}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.merma===0 ? "-" : pro.merma + "%"}</td>
                                                                                    {pro.cantidades_por_sucursal?.map((pcantd, ipcantd) => (
                                                                                        viewResultados?.sucursales?.map(function(d) {
                                                                                            if(pcantd.id_sucursal == d.id){
                                                                                                return (
                                                                                                    <td key={"solicitud_" + ipro + "_sucursal_" + ipcantd} className={`${(viewResultados?.sucursales?.length ?? 0) === 1 ? "font-extrabold" : ""} p-1 text-xs border border-slate-300 text-center`} > {pcantd.cantidad === 0 ? "--" : Number(pcantd.cantidad).toFixed(2) + " " + pro.letramedida} </td>
                                                                                                )
                                                                                            }
                                                                                        })
                                                                                    ))}
                                                                                    {(viewResultados?.sucursales?.length ?? 0) > 1 && (
                                                                                        <td className="p-1 text-sm border border-slate-300 text-center font-extrabold">{Number(pro.cantidad_total).toFixed(2)+ " " + pro.letramedida}</td>
                                                                                    )}
                                                                                </tr>
                                                                            ))}
                                                                            </tbody>
                                                                        </table>

                                                                </fieldset>                                                   
                                                            )}
                                                            
                                                            {viewResultados?.solicitud?.some(pro => pro.letrarubro === "P") && (
                                                                <fieldset className="max-w-full border-double border-2 border-blue-900 rounded-lg p-3 mb-2">
                                                                    <legend className="py-2 px-2 bg-blue-900 rounded-lg text-sm font-bold text-white hover:bg-blue-700">Panadería</legend>

                                                                        <table className="min-w-full divide-y divide-gray-200">
                                                                            <thead className="bg-blue-900">
                                                                                <tr>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">ITEM</th>
                                                                                    <th style={{ width: "12%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">RUBRO</th>
                                                                                    <th style={{ width: "30%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">PRODUCTO</th>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">MEDIDA</th>
                                                                                    <th style={{ width: "5%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">% MERMA</th>
                                                                                    {viewResultados?.sucursales?.map(function(d,i) {
                                                                                        return (
                                                                                            <th style={{ width: (viewResultados?.sucursales?.length ?? 0) > 4 ? "3%" : "auto%" }} key={"suc_resultado_"+i} className={`${(viewResultados?.sucursales?.length ?? 0) > 4 ? "[writing-mode:sideways-lr] [text-orientation:mixed] text-left" : "text-center text-nowrap"} text-white py-4 px-2 text-xs border border-slate-300 font-bold`} title={d.nombre}>{d.nombre}</th>
                                                                                        )
                                                                                    })}
                                                                                    {(viewResultados?.sucursales?.length ?? 0) > 1 && (
                                                                                        <th style={{ width: "10%" }} scope="col" className="p-3 text-sm border border-slate-300 font-bold text-center text-white">TOTAL</th>
                                                                                    )}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                            {viewResultados?.solicitud ?.filter(pro => pro.letrarubro === "P")
                                                                                .sort((a, b) => { const rubroA = a.rubro ?? ""; const rubroB = b.rubro ?? ""; if (rubroA < rubroB) return -1; if (rubroA > rubroB) return 1; const nameA = a.nombre_producto ?? ""; const nameB = b.nombre_producto ?? ""; return nameA.localeCompare(nameB); })
                                                                                .map((pro, ipro) => (
                                                                                <tr key={ipro}>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{ipro + 1}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.rubro}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.nombre_producto}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.medida}</td>
                                                                                    <td className="p-3 text-sm border border-slate-300 text-center">{pro.merma===0 ? "-" : pro.merma + "%"}</td>
                                                                                    {pro.cantidades_por_sucursal?.map((pcantd, ipcantd) => (
                                                                                        viewResultados?.sucursales?.map(function(d) {
                                                                                            if(pcantd.id_sucursal == d.id){
                                                                                                return (
                                                                                                    <td key={"solicitud_" + ipro + "_sucursal_" + ipcantd} className={`${(viewResultados?.sucursales?.length ?? 0) === 1 ? "font-extrabold" : ""} p-1 text-xs border border-slate-300 text-center`} > {pcantd.cantidad === 0 ? "--" : Number(pcantd.cantidad).toFixed(2) + " " + pro.letramedida} </td>
                                                                                                )
                                                                                            }
                                                                                        })
                                                                                    ))}
                                                                                    {(viewResultados?.sucursales?.length ?? 0) > 1 && (
                                                                                        <td className="p-1 text-sm border border-slate-300 text-center font-extrabold">{Number(pro.cantidad_total).toFixed(2)+ " " + pro.letramedida}</td>
                                                                                    )}
                                                                                </tr>
                                                                            ))}
                                                                            </tbody>
                                                                        </table>

                                                                </fieldset>                                                   
                                                            )}

                                                        </fieldset>
                                                    </>
                                                </div>
                                            }
                                        </div>
                                    </>
                                ):(null)}
                            </form>
                        </>
                    );
                }}
            </Formik>
        </>
    );
}