import { supabase } from '../util/supabaseClient';
import { ajustarFechaHora } from '../util/workDate';

/* General */
  export async function Now() {
    const { data, error } = await supabase.rpc('get_current_time');
    if(error) console.error(error);
    return data
  }

  export async function obtenerEstatusPuesto() {
    try {
      let query = supabase
        .from("estatuspuesto")
        .select('*')

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function obtenerTipoComensal() {
    try {
      let query = supabase
        .from("tipocomensal")
        .select('*')

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function obtenerParteMenu(){
    try {
      let query = supabase
        .from("partemenu")
        .select(`
          id,
          nombre,
          idstipologia,
          cantidad,
          tipomenu:partemenu_idtipomenu_fkey (
            id,
            nombre
          )
        `)
        .order('nivel', { ascending: true });

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching parte menu data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }
  
  export async function obtenerFichaMenu(){
    try {
      let query = supabase
        .from("fichamenu")
        .select(`
          id,
          nombre,
          idtipologia,
          tipologia: fichamenu_idtipologia_fkey (
            id,
            nombre
          )
        `)
        .eq('estatus', true);

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching parte menu data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  /* export async function obtenerGramaje() {
    try {
      let query = supabase
        .from("gramaje")
        .select(
          `
            idfichamenu,
            cantidad,
            producto: gramaje_idproductofichamenu_fkey (
              id,
              nombre,
              ingrediente,
              idfichamenu,
              merma,
              rubro: producto_idrubro_fkey (
                id,
                nombre,
                letra
              ),
              medida: producto_idmedida_fkey (
                id,
                nombre,
                letra
              )
            )
          `
        );

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching gramaje data:", error);
        return error
      }

      return {data}

    } catch (error) {
      console.log("error", error)
      return error
    }
  } */

  export async function obtenerGramaje() {
  try {
    let todosLosDatos: any[] = [];
    let limite = 1000;
    let inicio = 0;
    let fin = limite - 1;
    let fetchMas = true;

    while (fetchMas) {
      const { data, error } = await supabase
        .from("gramaje")
        .select(
          `
          idfichamenu,
          cantidad,
          producto: gramaje_idproductofichamenu_fkey (
            id,
            nombre,
            ingrediente,
            idfichamenu,
            merma,
            rubro: producto_idrubro_fkey (
              id,
              nombre,
              letra
            ),
            medida: producto_idmedida_fkey (
              id,
              nombre,
              letra
            )
          )
          `
        )
        .range(inicio, fin);

      if (error) {
        console.error("Error fetching gramaje data:", error);
        return error;
      }

      todosLosDatos = todosLosDatos.concat(data);

      if (data.length < limite) {
        // No hay más datos para traer
        fetchMas = false;
      } else {
        inicio += limite;
        fin += limite;
      }
    }

    return { data: todosLosDatos };
  } catch (error) {
    console.log("error", error);
    return error;
  }
}

/* Fin General */

/* Cobertura de Puesto*/

  export async function obtenerPersonalCobertura(cliente: number, gerencia: number) {
    try {
      let query = supabase
        .from("personal")
        .select(`
          id,
          nrocedula,
          nombres,
          apellidos,
          cargo:personal_idcargo_fkey (
            id,
            nombre
          ),
          gerencia:personal_idgerencia_fkey (
            id,
            nombre
          )
        `)
        .eq('idcliente', cliente)
        .eq('idgerencia', gerencia)
        .order('nombres', { ascending: true })
        .order('apellidos', { ascending: true });

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function obtenerEstructuraCobertura(cliente: number, gerencia: number, fecha: string, hentrada: string, hsalida: string) {
    const [year, month, day] = fecha.split('-').map(Number);
    const [hE, mE] = hentrada.split(':').map(Number);
    const [hS, mS] = hsalida.split(':').map(Number);
    const now = ajustarFechaHora(new Date(await Now()));
    const hentradaStr = ajustarFechaHora(new Date(year, month-1, day, hE, mE, 0));
    const hsalidaStr = ajustarFechaHora(new Date(year, month-1, day, hS, mS, 0));
    
    try {
      let query = supabase
        .from("estructura")
        .select(`
          id,
          nombre,
          idsucursal,
          h_entrada,
          h_salida,
          fecha_inicio,
          lun,
          mar,
          mie,
          jue,
          vie,
          sab,
          dom
        `)
        .eq('idcliente', cliente)
        .eq('idgerencia', gerencia)
        .order('h_entrada', { ascending: true })
        .order('h_salida', { ascending: true });

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      const diaSemana = hentradaStr.getDay();
      const diasMap = {
        0: 'dom',
        1: 'lun',
        2: 'mar',
        3: 'mie',
        4: 'jue',
        5: 'vie',
        6: 'sab'
      };

      function estaEnRango(eEntrada: number | Date, eSalida: number | Date, inicioRango: number | Date, finRango: number | Date) {
        if (inicioRango <= finRango) {
          return eEntrada >= inicioRango && eSalida <= finRango && eEntrada < eSalida;
        } else {
          return (eEntrada >= inicioRango || eSalida <= finRango);
        }
      }

      const estructurasFiltradas = data.filter(e => {
        let [hE, mE] = e.h_entrada.split(':').map(Number);
        let [hS, mS] = e.h_salida.split(':').map(Number);
        const eEntradaMin = ajustarFechaHora(new Date(year, month - 1, day, hE, mE));
        const eSalidaMin = ajustarFechaHora(new Date(year, month - 1, day, hS, mS));
        const fInicio = new Date(e.fecha_inicio);      

        if (now < fInicio) return false;
        if (!e[diasMap[diaSemana as keyof typeof diasMap] as keyof typeof e]) return false;
        if (!estaEnRango(eEntradaMin, eSalidaMin, hentradaStr, hsalidaStr)) return false;
        return true;
      });

      const sucursales = estructurasFiltradas.map(e => e.idsucursal);

      return {estructurasFiltradas, sucursales};

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function obtenerCobertura(cliente: number, gerencia: number, fecha: string) {
    try {
      let query = supabase
        .from("cobertura")
        .select(`
          id,
          idsucursal,
          idpersonal,
          descripcion,
          obs,
          estructura: cobertura_idestructura_fkey (
            id,
            nombre
          ),
          estatuspuesto: cobertura_idestatuspuesto_fkey (
            id,
            nombre,
            letra
          )
        `)
        .eq('idcliente', cliente)
        .eq('idgerencia', gerencia)
        .eq('fecha', fecha)

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function eliminarCobertura(id: number) {
    try {
      let query = supabase
        .from("cobertura")
        .delete()
        .eq('id', id);

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function agregarCobertura(fecha: string, cliente: number, sucursal: number, estructura: number, estatus: number, colaborador: number, observacion: string, descripcionEstatus: string, gerencia: number, usuario: number) {
    const now = ajustarFechaHora(new Date(await Now()));
    try {
      let query = supabase
        .from("cobertura")
        .insert({
              fecha: fecha,
              idcliente: cliente,
              idsucursal: sucursal,
              idgerencia: gerencia,
              idestructura: estructura,
              idestatuspuesto: estatus,
              idpersonal: colaborador,
              descripcion: descripcionEstatus,
              obs: observacion,
              idusuario: usuario,
              datetime: now
          });

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }
/* Fin Cobertura Puesto */

/* Novedades de Guardia */
  export async function obtenerNovedades(cliente: number, gerencia: number, fecha: string) {
    try {
      let query = supabase
        .from("novedad")
        .select(`
          id,
          idsucursal,
          descripcion,
          acciones,
          hora,
          usuario: novedad_idusuario_fkey (
            email,
            nombres,
            apellidos
          )
        `)
        .eq("idcliente", cliente)
        .eq("idgerencia", gerencia)
        .eq("fecha", fecha)
        .order('hora', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function agregarNovedad(fecha: string, cliente: number, hora: string, sucursal: number, descripcion: string, acciones: string, gerencia: number, usuario: number) {
    const now = ajustarFechaHora(new Date(await Now()));
    try {
      let query = supabase
        .from("novedad")
        .insert({
            fecha: fecha,
            idcliente: cliente,
            hora: hora,
            idsucursal: sucursal,
            descripcion: descripcion,
            acciones: acciones,
            idgerencia: gerencia,
            idusuario: usuario,
            datetime: now
        });

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function eliminarNovedad(id: number) {
    try {
      let query = supabase
        .from("novedad")
        .delete()
        .eq('id', id);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }
/* Fin Novedades de Guardia */

/* Solicitudes de Comensales */
  export async function obtenerPersonalComensal(cliente: number, gerencias: number[]) {
    try {
      let query = supabase
        .from("personal")
        .select(`
          id,
          nrocedula,
          nombres,
          apellidos,
          cargo:personal_idcargo_fkey (
            id,
            nombre
          ),
          tipocomensal:personal_idtipocomensal_fkey (
            id,
            nombre
          ),
          gerencia:personal_idgerencia_fkey (
            id,
            nombre
          )
        `)
        .eq('idcliente', cliente)
        .order('nombres', { ascending: true })
        .order('apellidos', { ascending: true });

      if (gerencias.length > 0) {
        query = query.in('idgerencia', gerencias);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tipo comensal data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }

  }

  export async function obtenerSolicitudComensal(cliente: number, sucursal: number, menu: number, fecha: string) {
    try {
      let query = supabase
        .from("solicitudcomensalinterno")
        .select(`
          id,
          nrocedula,
          idsucursal,
          idmenu,
          idtipocomensal,
          datetime,
          usuario: solicitudcomensalinterno_idusuario_fkey(
            id,
            email
          )
          
        `)
        .eq('fecha', fecha)
        .eq('idcliente', cliente)
        .order('datetime', { ascending: true });

      if (sucursal !== 0) {
        query = query.eq('idsucursal', sucursal);
      }

      if (menu !== 0) {
        query = query.eq('idmenu', menu);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching solicitudes data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function agregarSolicitudComensal(fecha: string, cliente: number, sucursal: number, menu: number, cedula: Array<number>, comensal: Array<number>, usuario:number) {
    const now = ajustarFechaHora(new Date(await Now()));

    let insertados: any[] = [];
    let noInsertados: any[] = [];

    for (let i = 0; i < cedula.length; i++) {
      const nrocedula = cedula[i];
      const idtipocomensal = comensal[i];

      let query = supabase
        .from("solicitudcomensalinterno")
        .select()
        .eq("fecha", fecha)
        .eq("idcliente", cliente)
        .eq("idsucursal", sucursal)
        .eq("idmenu", menu)
        .eq("nrocedula", nrocedula);

      const { data: consultData, error: consultError } = await query;

      if (consultError) {
        console.error("Error fetching solicitudes data:", consultError);
        return consultError
      }
      if (consultData && consultData.length > 0) {
          noInsertados.push(nrocedula);
      } else {
        let query = supabase
          .from("solicitudcomensalinterno")
          .insert({
            fecha: fecha,
            idcliente: cliente,
            idsucursal: sucursal,
            idmenu: menu,
            nrocedula: nrocedula,
            idtipocomensal: idtipocomensal,
            idusuario: usuario,
            datetime: now
          });
          const {  error: insertError } = await query;

          if (insertError) {
            console.error("Error inserting solicitud data:", insertError);
            return insertError
          }

          insertados.push(nrocedula);
      }
      
    }

    return { success:true, insertados, noInsertados };

  }

  export async function eliminarSolicitudComensal(id: number) {
    try {
      let query = supabase
        .from("solicitudcomensalinterno")
        .delete()
        .eq('id', id);

      const { data, error } = await query;

      if (error) {
        console.error("Error deleting solicitud data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }
/* Fin Solicitudes de Comensales */

/* Control Comensal */
  export async function agregarControlComensal( fecha: string, cliente: number, sucursal: number, menu: number, cedula: number, tipocomensal: number, usuario: number ) {
    const now = ajustarFechaHora(new Date()); // Asume que ajustarFechaHora es sincrónico

    try {
      // Consultar si existe solicitud para esa fecha, menú, cédula
      const { data: dataSolicitud, error: errorSolicitud } = await supabase
        .from("solicitudcomensalinterno")
        .select("*")
        .eq("fecha", fecha)
        .eq("idmenu", menu)
        .eq("nrocedula", cedula);

      if (errorSolicitud) {
        console.error("Error fetching solicitud:", errorSolicitud);
        return errorSolicitud;
      }

      const solicitado = (dataSolicitud && dataSolicitud.length > 0);

      // Consultar registros previos para saber cuántos duplicados hay
      const { data: dataRegistro, error: errorRegistro } = await supabase
        .from("registrocomensalinterno")
        .select("*")
        .eq("fecha", fecha)
        .eq("idmenu", menu)
        .eq("nrocedula", cedula);

      if (errorRegistro) {
        console.error("Error fetching registro:", errorRegistro);
        return errorRegistro;
      }

      const countDuplicado = dataRegistro ? dataRegistro.length : 0;

      // Insertar siempre un registro nuevo con countduplicado = cantidad previa
      const { data: insertData, error: insertError } = await supabase
        .from("registrocomensalinterno")
        .insert({
          fecha,
          idcliente: cliente,
          idsucursal: sucursal,
          idmenu: menu,
          nrocedula: cedula,
          idtipocomensal: tipocomensal,
          idusuario: usuario,
          datetime: now,
          solicitado,
          countduplicado: countDuplicado, // cantidad previa de registros iguales
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Error inserting registro:", insertError);
        return insertError;
      }

      return {
        duplicado: (insertData?.countduplicado ?? 0) > 0,
        solicitado,
        message:
          `El Nro. de Cédula\n${new Intl.NumberFormat("es-ES").format(cedula)}` +
          (solicitado ? "" : "\nNO tiene solicitud.") +
          ((insertData?.countduplicado ?? 0) > 0
            ? `\nEstá DUPLICADO (${insertData?.countduplicado ?? 0}).`
            : "") +
          "\n\nRegistro Exitoso.",
        data: insertData,
      };
    } catch (error) {
      console.error("Error en agregarControlComensal:", error);
      return error;
    }
  }
/* Fin Control Comensal */

/* Control Menú */
  export async function obtenerRegistroComensal(cliente: number, sucursal: number, menu: number, fecha: string) {
    try {
      let query = supabase
        .from("registrocomensalinterno")
        .select(`
          id,
          nrocedula,
          idtipocomensal,
          solicitado,
          countduplicado,
          datetime,
          usuario: registrocomensalinterno_idusuario_fkey(
            id,
            email
          )
        `)
        .eq('fecha', fecha)
        .eq('idcliente', cliente)
        .eq('idsucursal', sucursal)
        .eq('idmenu', menu)
        .order('datetime', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching solicitudes data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }
/* Fin Control Menú */

/* Planificacion */
  export async function obtenerPlanificacionMenu(semana: string, cliente: number, sucursal: number) {
    try {
      const { data, error } = await supabase
        .from("planificacionmenu")
        .select(
          `
            id,
            semana,
            fecha,
            idcliente,
            idsucursal,
            idtipomenu,
            idpartemenu,
            cantidad,
            fichamenu: planificacionmenu_idfichamenu_fkey (
              id,
              nombre
            ),
            usuario: planificacionmenu_idusuario_fkey(
              id,
              email
            )
          `
        )
        .eq("semana", semana)
        .eq("idcliente", cliente)
        .eq("idsucursal", sucursal);

      if (error) {
        console.error("Error fetching planificacion data:", error);
        return error;
      }

      return data;
    } catch (error) {
      console.log("error", error);
      return error;
    }
  }

  export async function agregarPlanificacionMenu(semana: string, fecha: string, cliente: number, sucursal: number, tipomenu: number, partemenu: number, fichamenu: number, cantidad: number, usuario: number) {
    const now = ajustarFechaHora(new Date(await Now()));
    try {
      const { data, error } = await supabase
        .from("planificacionmenu")
        .insert({
          semana: semana,
          fecha: fecha,
          idcliente: cliente,
          idsucursal: sucursal,
          idtipomenu: tipomenu,
          idfichamenu: fichamenu,
          idpartemenu: partemenu,
          cantidad: cantidad,
          idusuario: usuario,
          datetime: now
        });

      if (error) {
        console.error("Error inserting planificacion data:", error);
        return error;
      }

      return data;
    } catch (error) {
      console.log("error", error);
      return error;
    }
  }

  export async function eliminarPlanificacionMenu(id: number) {
    try {
      let query = supabase
        .from("planificacionmenu")
        .delete()
        .eq('id', id);

      const { data, error } = await query;

      if (error) {
        console.error("Error deleting solicitud data:", error);
        return error
      }

      return data

    } catch (error) {
      console.log("error", error)
      return error
    }
  }

  export async function obtenerPlanificacionMenuSemana(semana: string[], cliente: number) {
    
    try {
      let query = supabase
        .from("planificacionmenu")
        .select(`
          id,
          cantidad,
          fecha,
          sucursal:planificacionmenu_idsucursal_fkey (
            id,
            nombre
          ),
          partemenu:planificacionmenu_idpartemenu_fkey (
            cantidad
          ),
          fichamenu:planificacionmenu_idfichamenu_fkey (
            id
          )
        `)
        .eq('idcliente', cliente)
        .in('semana', semana);

      const { data: dataConsulta, error: errorConsulta } = await query;

      //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        let sucursales: any[]=[]
        let fechas: any[]=[]

        dataConsulta?.forEach(element => {
          const sucursal: any = element.sucursal;
          const fecha: any = element.fecha;
          if (sucursal && !sucursales.some(s => s.id === sucursal.id)) {
            sucursales.push(sucursal);
          }
          if (fecha && !fechas.some(f => f === fecha)) {
            fechas.push(fecha);
          }
        });
      //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

      if (errorConsulta) {
        console.error("Error fetching planificacion data:", errorConsulta);
        return errorConsulta;
      }

      //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
      const resultadoAgrupado:any = [];
      const mapaAgrupado = new Map(); // Usamos un mapa para agrupar eficientemente

      dataConsulta.forEach((item:any) => {
        const sucursalId = item.sucursal.id;
        const sucursalNombre = item.sucursal.nombre;
        const fecha = item.fecha;

        // Crear una clave única para el agrupamiento por sucursal y fecha
        const claveGrupo = `${sucursalId}-${fecha}`;

        if (!mapaAgrupado.has(claveGrupo)) {
          // Si el grupo no existe, inicializarlo
          mapaAgrupado.set(claveGrupo, {
            sucursal: {
              id: sucursalId,
              nombre: sucursalNombre,
            },
            fecha: fecha,
            cantidadTotal: 0, // Inicializar la cantidad total para esta fecha/sucursal
            fichas: new Set(), // Usar un Set para evitar fichas duplicadas
            detalles: [], // Para guardar detalles individuales si es necesario
          });
        }

        const grupoActual = mapaAgrupado.get(claveGrupo);

        // Sumar la cantidad
        grupoActual.cantidadTotal += item.cantidad;

        // Agregar la ficha (si existe y no es nula)
        if (item.fichamenu && item.fichamenu.id) {
          grupoActual.fichas.add(item.fichamenu.id);
        }

        // Opcional: Si quieres guardar los detalles originales que contribuyeron a este grupo
        grupoActual.detalles.push({
          //id: item.id,
          cantidadIndividual: item.cantidad, // Usar la cantidad total si es 0
          //idParteMenu: item.partemenu ? item.partemenu.cantidad : null,
          idFichaMenu: item.fichamenu ? item.fichamenu.id : null,
        });
      });

      mapaAgrupado.forEach((value) => {
        value.fichas = Array.from(value.fichas);
        resultadoAgrupado.push(value);
      });
      //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

      return {sucursales: sucursales, planificacion: resultadoAgrupado};

  } catch (error) {
    console.log("error", error);
    return error;
  }
}
/* Fin Planificacion */