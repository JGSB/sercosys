import { BsFillCpuFill } from 'react-icons/bs'

export const modulos = [
    { name: "configuracion", label: "Configuración", icon: BsFillCpuFill, des:"Administra roles, permisos y perfiles de usuarios", permissions: ["V_T", "M_1"] },
    { name: "recursoshumanos", label: "Recursos Humanos", icon: BsFillCpuFill, des:"Gestión de roles para controlar acceso a información sensible, como datos personales y documentos laborales", permissions: ["V_T", "M_2"] },
    { name: "operaciones", label: "Operaciones", icon: BsFillCpuFill, des:"Gestionar inventarios, órdenes de despacho y logística de productos terminados (Línea o Catering)", permissions: ["V_T", "M_3"] },
    { name: "distribucion", label: "Distribución", icon: BsFillCpuFill, des:"Gestionar inventarios, órdenes de despacho y logística de materia prima (Víveres)", permissions: ["V_T", "M_4"] },
    { name: "frigorifico", label: "Frigorífico", icon: BsFillCpuFill, des:"Gestionar inventarios, órdenes de despacho y logística de materia prima (Proteína, Charcutería, Pulpas)", permissions: ["V_T", "M_6"] },
    { name: "panaderia", label: "Panadería", icon: BsFillCpuFill, des:"Gestionar inventarios, órdenes de despacho y logística de productos terminados (Panadería y Pastelería)", permissions: ["V_T", "M_7"] },
    { name: "mayorista", label: "Mayorista", icon: BsFillCpuFill, des:"Gestionar inventarios, órdenes de despacho y logística de materia prima (Verduras, Legumbres, Hortalizas y Frutas)", permissions: ["V_T", "M_8"] },
    { name: "seguridadpatrimonial", label: "Seguridad Patrimonial", icon: BsFillCpuFill, des:"Gestión de sistemas de vigilancia, control de accesos y reportes de seguridad,", permissions: ["V_T", "M_5"] },
  ];

  export const funciones = [
    {location:"/home/configuracion", label: "Usuario", value: "usuario", permissions: ["V_T", "F_21", "F_22"] },    
    {location:"/home/configuracion", label: "Estructura", value: "estructura", permissions: ["V_T", "F_36", "F_37"] },
    {location:"/home/configuracion", label: "Menú", value: "menu", permissions: ["V_T", "F_40", "F_41"] },

    {location:"/home/recursoshumanos", label: "Personal", value: "personal", permissions: ["V_T", "F_38", "F_39" ] },
    {location:"/home/recursoshumanos", label: "Solicitud Comensal (Interno)", value: "solicitudcomensalinterno", permissions: ["V_T", "F_33", "F_34" ] },

    {location:"/home/operaciones", label: "Solicitud de Insumo (Foráneo)", value: "solicituddeinsumoforaneo", permissions: ["V_T", "F_27", "F_28"] },
    {location:"/home/operaciones", label: "Relación Solicitud Comensal (Interno)", value: "relacionsolicitudcomensalinterno", permissions: ["V_T", "F_35"] },
    {location:"/home/operaciones", label: "Planificación Menú", value: "planificacionmenu", permissions: ["V_T", "F_42", "F_43"] },
    {location:"/home/operaciones", label: "Relación Insumo (Planificación Menú)", value: "relacioninsumoplanificacionmenu", permissions: ["V_T"] },

    {location:"/home/distribucion", label: "Relación Solicitud de Insumo (Foráneo)", value: "relacionsolicituddeinsumoforaneo", permissions: ["V_T", "F_29"] },

    {location:"/home/frigorifico", label: "Relación Solicitud de Insumo (Foráneo)", value: "relacionsolicituddeinsumoforaneo", permissions: ["V_T", "F_30"] },

    {location:"/home/panaderia", label: "Relación Solicitud de Insumo (Foráneo)", value: "relacionsolicituddeinsumoforaneo", permissions: ["V_T", "F_31"] },

    {location:"/home/mayorista", label: "Relación Solicitud de Insumo (Foráneo)", value: "relacionsolicituddeinsumoforaneo", permissions: ["V_T", "F_32"] },

    {location:"/home/seguridadpatrimonial", label: "Cobertura de Puesto", value: "coberturadepuesto", permissions: ["V_T", "F_23", "F_24"] },
    {location:"/home/seguridadpatrimonial", label: "Novedades de Guardia", value: "novedadesdeguardia", permissions: ["V_T", "F_25", "F_26"] },

  ];

  export const funcionindependiente = [
    { name: "controlcomensal", label: "Control Comensal", icon: BsFillCpuFill, des:"", permissions: ["V_T", "F_1"] },
    { name: "controlmenu", label: "Control Menú", icon: BsFillCpuFill, des:"", permissions: ["V_T", "F_2"] },
  ];