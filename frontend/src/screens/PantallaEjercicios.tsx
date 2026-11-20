import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ColoresApp } from '../theme/colors';
import { listaEjerciciosEjemplo, Ejercicio } from '../models/Ejercicio';
import { ModalCamaraBiomecanica } from '../components/ModalCamaraBiomecanica';
import { useStore } from '../services/useStore';

export const PantallaEjercicios = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
  const [ejercicioActivo, setEjercicioActivo] = useState<Ejercicio | null>(null);
  const [modalCamaraVisible, setModalCamaraVisible] = useState(false);
  const sumarPuntosActividad = useStore((state) => state.sumarPuntosActividad);

  const categorias = ['Todos', 'Piernas', 'Brazos', 'Hombros', 'Abdomen', 'Glúteos', 'Espalda'];

  const ejerciciosFiltrados = listaEjerciciosEjemplo.filter(
    (ej) => categoriaSeleccionada === 'Todos' || ej.grupoMuscular === categoriaSeleccionada
  );

  const iniciarEntrenamiento = (ejercicio: Ejercicio) => {
    setEjercicioActivo(ejercicio);
    setModalCamaraVisible(true);
  };

  const handleCompletarSerie = (reps: number) => {
    if (reps > 0) {
      sumarPuntosActividad(reps * 5);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera Centrada Minimalista */}
      <View style={styles.headerCentrado}>
        <Text style={styles.subtituloCentrado}>MODELOS BIOMECÁNICOS</Text>
        <Text style={styles.tituloNegroCentrado}>EJERCICIOS CON IA</Text>
      </View>

      {/* Selector Horizontal de Categorías (Chips Minimalistas) */}
      <View style={styles.filtrosWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {categorias.map((cat) => {
            const activa = categoriaSeleccionada === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, activa && styles.chipActivo]}
                onPress={() => setCategoriaSeleccionada(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipTexto, activa && styles.chipTextoActivo]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Listado de las 8 Tarjetas Biomecánicas */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {ejerciciosFiltrados.map((ejercicio) => (
          <TouchableOpacity
            key={ejercicio.id}
            style={styles.card}
            activeOpacity={0.92}
            onPress={() => iniciarEntrenamiento(ejercicio)}
          >
            {/* Cabecera de la Tarjeta */}
            <View style={styles.cardHeader}>
              <View style={styles.badgeMediaPipe}>
                <View style={styles.puntoVerde} />
                <Text style={styles.badgeMediaPipeTexto}>MEDIAPIPE IA</Text>
              </View>
              <Text style={styles.nivelTexto}>{ejercicio.nivel}</Text>
            </View>

            <Text style={styles.cardTitulo}>{ejercicio.nombre}</Text>

            {/* Articulación Clave y Grupo Muscular */}
            <View style={styles.metaRow}>
              <Text style={styles.metaGrupo}>{ejercicio.grupoMuscular.toUpperCase()}</Text>
              <Text style={styles.metaSeparador}>•</Text>
              <Text style={styles.metaArticulacion}>{ejercicio.articulacionClave}</Text>
            </View>

            <Text style={styles.seriesRepsTexto}>{ejercicio.seriesReps}</Text>

            <View style={styles.lineaDivisoria} />

            {/* Banner de Instrucción para la Cámara */}
            <View style={styles.instruccionBox}>
              <Ionicons name="camera" size={16} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.instruccionTexto}>{ejercicio.instruccionIA}</Text>
            </View>

            {/* Lista de Ventajas y Correcciones del Motor */}
            <View style={styles.ventajasList}>
              {ejercicio.ventajas.map((ventaja, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={ColoresApp.primario}
                    style={styles.bulletIcon}
                  />
                  <Text style={styles.ventajaText}>{ventaja}</Text>
                </View>
              ))}
            </View>

            {/* Botón de Acción Principal */}
            <TouchableOpacity
              style={styles.botonIniciar}
              onPress={() => iniciarEntrenamiento(ejercicio)}
              activeOpacity={0.85}
            >
              <Ionicons name="videocam" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.botonIniciarTexto}>EMPEZAR CON CÁMARA IA</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Modal de Entrenamiento con Cámara e IA */}
      <ModalCamaraBiomecanica
        visible={modalCamaraVisible}
        ejercicio={ejercicioActivo}
        onCerrar={() => setModalCamaraVisible(false)}
        onCompletarSerie={handleCompletarSerie}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerCentrado: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 10,
  },
  subtituloCentrado: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  tituloNegroCentrado: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // Filtros Chips
  filtrosWrapper: {
    marginBottom: 10,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActivo: {
    backgroundColor: ColoresApp.primario,
    borderColor: ColoresApp.primario,
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  chipTextoActivo: {
    color: '#FFFFFF',
  },

  // Lista
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Tarjeta de Ejercicio
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeMediaPipe: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  puntoVerde: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  badgeMediaPipeTexto: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.6,
  },
  nivelTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  metaGrupo: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  metaSeparador: {
    fontSize: 10,
    color: '#94A3B8',
  },
  metaArticulacion: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  seriesRepsTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  lineaDivisoria: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  instruccionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  instruccionTexto: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 15,
  },
  ventajasList: {
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bulletIcon: {
    marginRight: 8,
  },
  ventajaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    flex: 1,
  },
  botonIniciar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ColoresApp.primario,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: ColoresApp.primario,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  botonIniciarTexto: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});
