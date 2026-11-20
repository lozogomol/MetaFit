import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Rutina } from '../models/Rutina';

// Similar to PerfilUsuario in Dart
export interface PerfilUsuario {
  nombre: string;
  correo: string;
  estatura: number;
  peso: number;
  edad: number;
  genero: 'M' | 'F';
  evaluacionCompletada: boolean;
  avatarIndex: number;
  avatarUri?: string;
  actividadSemanal: number[]; // Puntos ganados de Lunes a Domingo
}

interface AppState {
  estaAutenticado: boolean;
  usuarioActual: PerfilUsuario | null;
  rutinasPersonalizadas: Rutina[];
  
  // Actions
  iniciarSesion: (perfil: Partial<PerfilUsuario> & { correo: string, nombre: string }) => void;
  cerrarSesion: () => void;
  actualizarEvaluacion: (datos: Partial<PerfilUsuario>) => void;
  agregarRutinaPersonalizada: (rutina: Rutina) => void;
  sumarPuntosActividad: (puntos: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      estaAutenticado: false,
      usuarioActual: null,
      rutinasPersonalizadas: [],

      iniciarSesion: (perfil) => {
        set((state) => {
          const prev = state.usuarioActual;
          const esMismoUsuario = prev && (!perfil.correo || prev.correo === perfil.correo || prev.nombre === perfil.nombre);

          return {
            estaAutenticado: true,
            usuarioActual: {
              nombre: perfil.nombre || prev?.nombre || 'Usuario',
              correo: perfil.correo || prev?.correo || '',
              estatura: perfil.estatura ?? (esMismoUsuario ? prev.estatura : 175.0),
              peso: perfil.peso ?? (esMismoUsuario ? prev.peso : 74.0),
              edad: perfil.edad ?? (esMismoUsuario ? prev.edad : 24),
              genero: perfil.genero ?? (esMismoUsuario ? prev.genero : 'M'),
              evaluacionCompletada: true,
              avatarIndex: perfil.avatarIndex ?? (esMismoUsuario ? prev.avatarIndex : 0),
              avatarUri: perfil.avatarUri !== undefined ? perfil.avatarUri : (esMismoUsuario ? prev.avatarUri : undefined),
              actividadSemanal: perfil.actividadSemanal ?? prev?.actividadSemanal ?? [0, 0, 0, 0, 0, 0, 0],
            },
          };
        });
      },

      cerrarSesion: () => {
        set({ estaAutenticado: false }); // Mantiene el perfil guardado en almacenamiento local
      },

      actualizarEvaluacion: (datos) => {
        set((state) => ({
          usuarioActual: state.usuarioActual
            ? { ...state.usuarioActual, ...datos, evaluacionCompletada: true }
            : null,
        }));
      },

      agregarRutinaPersonalizada: (rutina) => {
        set((state) => ({
          rutinasPersonalizadas: [rutina, ...state.rutinasPersonalizadas],
        }));
      },

      sumarPuntosActividad: (puntos) => {
        set((state) => {
          if (!state.usuarioActual) return state;
          
          const hoy = new Date().getDay(); // 0 is Sunday, 1 is Monday...
          // Map to index where 0 is Lunes and 6 is Domingo
          const index = hoy === 0 ? 6 : hoy - 1;
          
          const nuevaActividad = [...(state.usuarioActual.actividadSemanal || [0,0,0,0,0,0,0])];
          nuevaActividad[index] += puntos;

          return {
            usuarioActual: {
              ...state.usuarioActual,
              actividadSemanal: nuevaActividad
            }
          };
        });
      },
    }),
    {
      name: 'metafit-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
