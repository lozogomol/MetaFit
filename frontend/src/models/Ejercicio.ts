import { ExerciseType } from '../services/exerciseEngine';

export interface Ejercicio {
  id: string;
  engineType: ExerciseType;
  nombre: string;
  grupoMuscular: string;
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Todos';
  equipo: string;
  seriesReps: string;
  articulacionClave: string;
  musculoPrincipal: string;
  ventajas: string[];
  icono: string;
  instruccionIA: string;
}

export const listaEjerciciosEjemplo: Ejercicio[] = [
  {
    id: 'squat',
    engineType: 'squat',
    nombre: 'Sentadilla Clásica',
    grupoMuscular: 'Piernas',
    nivel: 'Principiante',
    equipo: 'Peso Corporal / Barra',
    seriesReps: '4 series x 12 - 15 reps',
    articulacionClave: 'Rodilla / Paralelo de cadera',
    musculoPrincipal: 'Cuádriceps, Glúteos e Isquiosurales',
    icono: 'body-outline',
    instruccionIA: 'Coloca la cámara de perfil para que la IA detecte tu cadera, rodilla y tobillo.',
    ventajas: [
      'IA monitorea el rompimiento del paralelo',
      'Detecta y corrige la inclinación excesiva del torso',
      'Aumenta la fuerza en cuádriceps y glúteos',
    ],
  },
  {
    id: 'bicepCurl',
    engineType: 'bicepCurl',
    nombre: 'Curl de Bíceps',
    grupoMuscular: 'Brazos',
    nivel: 'Principiante',
    equipo: 'Mancuernas / Barra',
    seriesReps: '3 series x 10 - 12 reps',
    articulacionClave: 'Codo / Contracción',
    musculoPrincipal: 'Bíceps Braquial y Braquiorradial',
    icono: 'barbell-outline',
    instruccionIA: 'Ponte de frente o perfil lateral para que la IA siga el ángulo de tu codo.',
    ventajas: [
      'IA penaliza el balanceo compensatorio del torso',
      'Asegura la contracción completa en la subida',
      'Desarrolla el pico y grosor del bíceps',
    ],
  },
  {
    id: 'shoulderPress',
    engineType: 'shoulderPress',
    nombre: 'Press de Hombro',
    grupoMuscular: 'Hombros',
    nivel: 'Intermedio',
    equipo: 'Mancuernas / Barra',
    seriesReps: '4 series x 8 - 10 reps',
    articulacionClave: 'Hombro / Extensión completa',
    musculoPrincipal: 'Deltoides Anterior, Lateral y Tríceps',
    icono: 'arrow-up-circle-outline',
    instruccionIA: 'Coloca la cámara a la altura del pecho para ver ambos hombros y brazos.',
    ventajas: [
      'IA verifica la extensión vertical completa arriba',
      'Evita que bajes los codos más de la cuenta',
      'Desarrolla hombros redondos y fuerza de empuje',
    ],
  },
  {
    id: 'abdominals',
    engineType: 'abdominals',
    nombre: 'Abdominales / Crunches',
    grupoMuscular: 'Abdomen',
    nivel: 'Todos',
    equipo: 'Esterilla',
    seriesReps: '3 series x 15 - 20 reps',
    articulacionClave: 'Flexión de tronco',
    musculoPrincipal: 'Recto Abdominal y Core',
    icono: 'fitness-outline',
    instruccionIA: 'Ubica la cámara en el suelo a unos 2 metros de perfil lateral.',
    ventajas: [
      'IA mide la elevación exacta del tronco',
      'Protege las cervicales exigiendo contracción abdominal',
      'Tonifica y endurece la pared abdominal',
    ],
  },
  {
    id: 'gluteKickback',
    engineType: 'gluteKickback',
    nombre: 'Patada de Glúteo',
    grupoMuscular: 'Glúteos',
    nivel: 'Todos',
    equipo: 'Peso Corporal / Tobillera',
    seriesReps: '3 series x 12 - 15 por pierna',
    articulacionClave: 'Extensión de cadera',
    musculoPrincipal: 'Glúteo Mayor e Isquiotibiales',
    icono: 'walk-outline',
    instruccionIA: 'Coloca la cámara de perfil para que la IA observe la extensión de tu pierna.',
    ventajas: [
      'IA verifica que la pierna alcance la extensión máxima',
      'Aísla y levanta el glúteo mayor de forma focalizada',
      'Mejora la estabilidad de la pelvis y cadera',
    ],
  },
  {
    id: 'bulgarianSquat',
    engineType: 'bulgarianSquat',
    nombre: 'Sentadilla Búlgara',
    grupoMuscular: 'Piernas',
    nivel: 'Intermedio',
    equipo: 'Banco / Peso Corporal',
    seriesReps: '3 series x 10 por pierna',
    articulacionClave: 'Rodilla delantera',
    musculoPrincipal: 'Cuádriceps, Glúteo Mayor y Estabilizadores',
    icono: 'trending-down-outline',
    instruccionIA: 'Ponte de perfil para que la IA analice la rodilla delantera y el muslo paralelo.',
    ventajas: [
      'IA comprueba el descenso hasta el muslo paralelo',
      'Elimina desbalances de fuerza entre piernas',
      'Intensidad máxima en glúteo y cuádriceps',
    ],
  },
  {
    id: 'tricepExtension',
    engineType: 'tricepExtension',
    nombre: 'Extensión de Tríceps',
    grupoMuscular: 'Brazos',
    nivel: 'Principiante',
    equipo: 'Mancuerna / Polea',
    seriesReps: '3 series x 12 reps',
    articulacionClave: 'Codo tras nuca',
    musculoPrincipal: 'Tríceps Braquial (Cabeza Larga)',
    icono: 'repeat-outline',
    instruccionIA: 'Cámara a media altura enfocando el brazo y la flexión del codo.',
    ventajas: [
      'IA supervisa la flexión profunda y extensión completa',
      'Previene que muevas el codo hacia los costados',
      'Desarrolla brazos definidos y fuertes',
    ],
  },
  {
    id: 'singleArmRow',
    engineType: 'singleArmRow',
    nombre: 'Remo Unilateral',
    grupoMuscular: 'Espalda',
    nivel: 'Intermedio',
    equipo: 'Mancuerna / Banco',
    seriesReps: '4 series x 10 - 12 por lado',
    articulacionClave: 'Tracción hacia cadera',
    musculoPrincipal: 'Dorsal Ancho, Trapecio y Espalda Media',
    icono: 'reorder-three-outline',
    instruccionIA: 'Cámara en ángulo diagonal o lateral para registrar el codo subiendo hacia la cadera.',
    ventajas: [
      'IA verifica que el codo suba pegado al torso',
      'Corrige asimetrías en la espalda',
      'Mejora la postura escapular erguida',
    ],
  },
];
