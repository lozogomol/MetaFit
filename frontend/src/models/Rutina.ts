export interface Rutina {
  id: string;
  titulo: string;
  objetivo: string;
  duracion: string;
  diasSemana: string;
  cantidadEjercicios: number;
  nivel: string;
}

export const listaRutinasEjemplo: Rutina[] = [
  {
    id: '1',
    titulo: 'Quema de Grasa & Definición (HIIT)',
    objetivo: 'Pérdida de Grasa',
    duracion: '40 min',
    diasSemana: '4 días / sem',
    cantidadEjercicios: 7,
    nivel: 'Intermedio',
  },
  {
    id: '2',
    titulo: 'Fuerza e Hipertrofia Push-Pull-Legs',
    objetivo: 'Ganancia Muscular',
    duracion: '60 min',
    diasSemana: '5 días / sem',
    cantidadEjercicios: 8,
    nivel: 'Avanzado',
  },
  {
    id: '3',
    titulo: 'Acondicionamiento Físico Total (Full Body)',
    objetivo: 'Salud & Resistencia',
    duracion: '45 min',
    diasSemana: '3 días / sem',
    cantidadEjercicios: 6,
    nivel: 'Principiante',
  },
  {
    id: '4',
    titulo: 'Core Fuerte & Abdomen Esculpido',
    objetivo: 'Tonificación Core',
    duracion: '25 min',
    diasSemana: '3 días / sem',
    cantidadEjercicios: 5,
    nivel: 'Todos',
  },
];
