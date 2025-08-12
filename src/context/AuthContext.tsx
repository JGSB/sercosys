import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../util/supabaseClient'


interface AuthContextType {
  user: User | null
  session: Session | null
  dataUser: any
  idscliente: string[]
  idssucursal: string[]
  idsmenu: string[]
  idsgerencia: string[]
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [dataUser, setdataUser] = useState(null)
  const [idsCliente, setidsCliente] = useState<string[]>([])
  const [idsSucursal, setidsSucursal] = useState<string[]>([])
  const [idsMenu, setidsMenu] = useState<string[]>([])
  const [idsGerencia, setidsGerencia] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchdataUser(session.user.id)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchdataUser(session.user.id)
      } else {
        setdataUser(null)
      }
    })

    async function fetchdataUser(userId: string) {
      const { data, error } = await supabase
        .from('user')          // Nombre de tu tabla de perfiles o usuarios extendidos
        .select('*')
        .eq('id_auth', userId)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
      } else {
        if(data.V_T){
            const [clientesRes, sucursalesRes, menusRes, gerenciasRes] = await Promise.all([
              supabase.from("clientes").select('*').eq('estatus', true),
              supabase.from("sucursales").select('*').eq('estatus', true),
              supabase.from("menus").select('*').eq('estatus', true),
              supabase.from("gerencias").select('*'),
            ]);

            setidsCliente(clientesRes.data || []);
            setidsSucursal(sucursalesRes.data || []);
            setidsMenu(menusRes.data || []);
            setidsGerencia(gerenciasRes.data || []);
        }else{
            const clientesIds = Array.isArray(data.idscliente) ? data.idscliente : [];
            const sucursalesIds = Array.isArray(data.idsucursal) ? data.idsucursal : [];
            const menusIds = Array.isArray(data.idsmenu) ? data.idsmenu : [];
            const gerenciasIds = Array.isArray(data.idsgerencia) ? data.idsgerencia : [];

            const [clientesRes, sucursalesRes, menusRes, gerenciasRes] = await Promise.all([
              supabase.from("clientes").select('*').eq('estatus', true).in('id', clientesIds),
              supabase.from("sucursales").select('*').eq('estatus', true).in('id', sucursalesIds),
              supabase.from("menus").select('*').eq('estatus', true).in('id', menusIds),
              supabase.from("gerencias").select('*').in('id', gerenciasIds),
            ]);

            setidsCliente(clientesRes.data || []);
            setidsSucursal(sucursalesRes.data || []);
            setidsMenu(menusRes.data || []);
            setidsGerencia(gerenciasRes.data || []);
        }
        setdataUser(data)
      }
    }

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, dataUser, idscliente:idsCliente, idssucursal:idsSucursal, idsmenu:idsMenu, idsgerencia:idsGerencia, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
