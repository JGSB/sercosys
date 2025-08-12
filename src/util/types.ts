export type TypeLayoutModuloProps = {
    pathname: string;
};

export type TypeArrayCliente = {
    id: number;
    nombre: string;
    estatus:boolean;
}

export type TypeArraySucursal ={
    id: number;
    nombre: string;
    estatus:boolean;
    idcliente:number;
}

export type TypeArrayGerencia = {
    id: number;
    nombre: string;
    estatus:boolean;
    idcliente:number;
}

export type TypeArrayMenu = {
    id: number;
    nombre: string;
    estatus:boolean;
    idsucursal:number;
}

export type TypeCargo = {
    id: number;
    nombre: string;
}

export type TypeEstatusPuesto = {
    id: number;
    nombre: string;
    letra: string;
}

export type TypeDataUser = {
  id?: number;
  id_auth?: number;
  email?: string;
  nombres?: string;
  apellidos?: string;
  idscliente: string[];
  idssucursale: string[];
  idsgerencia: string[];
  idsmenu: string[];
  estatus?: boolean;
  V_T?: boolean;
  M_1?: boolean;
  M_2?: boolean;
  M_3?: boolean;
  M_4?: boolean;
  M_5?: boolean;
  M_6?: boolean;
  M_7?: boolean;
  M_8?: boolean;
  M_9?: boolean;
  M_10?: boolean;
  M_11?: boolean;
  M_12?: boolean;
  M_13?: boolean;
  M_14?: boolean;
  M_15?: boolean;
  M_16?: boolean;
  M_17?: boolean;
  M_18?: boolean;
  M_19?: boolean;
  M_20?: boolean;
  F_1?: boolean;
  F_2?: boolean;
  F_3?: boolean;
  F_4?: boolean;
  F_5?: boolean;
  F_6?: boolean;
  F_7?: boolean;
  F_8?: boolean;
  F_9?: boolean;
  F_10?: boolean;
  F_11?: boolean;
  F_12?: boolean;
  F_13?: boolean;
  F_14?: boolean;
  F_15?: boolean;
  F_16?: boolean;
  F_17?: boolean;
  F_18?: boolean;
  F_19?: boolean;
  F_20?: boolean;
  F_21?: boolean;
  F_22?: boolean;
  F_23?: boolean;
  F_24?: boolean;
  F_25?: boolean;
  F_26?: boolean;
  F_27?: boolean;
  F_28?: boolean;
  F_29?: boolean;
  F_30?: boolean;
  F_31?: boolean;
  F_32?: boolean;
  F_33?: boolean;
  F_34?: boolean;
  F_35?: boolean;
  F_36?: boolean;
  F_37?: boolean;
  F_38?: boolean;
  F_39?: boolean;
  F_49?: boolean;
  clientes: {
      id_cliente: number;
      nombre_cliente: string;
  }[];
  sucursales: {
      id_cliente: number;
      id_sucursal: number;
      nombre_sucursal: string;
  }[];
  gerencias: {
      id_cliente: number;
      id_gerencia: number;
      nombre_gerencia: string;
  }[];
  menus: {
      id_sucursal: number;
      id_menu: number;
      nombre_menu: string;
      hora_tope:string,
      hora_inicio:string,
      hora_fin:string,
      antelacion:number,
  }[];
};

export type TypeTipoComensal = {
    id: number;
    nombre: string;
}
export type TypeGerencia = {
    id: number;
    nombre: string;
}
export type TypeUsuario ={
    id: number;
    email: string;
}

export type TypeSolicitudComensal = {
    id: number;
    nrocedula: number
    idtipocomensal: number;
    datetime: string;
    usuario: TypeUsuario
}

export type TypePersonalComensal = {
    nrocedula: number | string;
    nombres: string;
    apellidos: string;
    tipocomensal: TypeTipoComensal;
    cargo: TypeCargo;
    gerencia: TypeGerencia;
}

export type TypeFichaMenu = {
    id: number;
    nombre: string;
    idtipologia: number;
    tipologia: {
        id: number;
        nombre: string;
    };
}

export type TypePlanificacionMenu ={
    id: number;
    semana: string;
    fecha: string;
}