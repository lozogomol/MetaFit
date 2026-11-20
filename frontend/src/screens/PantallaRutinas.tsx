import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ColoresApp } from '../theme/colors';
import { useStore } from '../services/useStore';
import { listaEjerciciosEjemplo } from '../models/Ejercicio';
import { Rutina } from '../models/Rutina';

export const PantallaRutinas = () => {
  const rutinas = useStore((state) => state.rutinasPersonalizadas);
  const agregarRutina = useStore((state) => state.agregarRutinaPersonalizada);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState<string[]>([]);

  const _toggleEjercicio = (id: string) => {
    if (ejerciciosSeleccionados.includes(id)) {
      setEjerciciosSeleccionados(ejerciciosSeleccionados.filter((e) => e !== id));
    } else {
      setEjerciciosSeleccionados([...ejerciciosSeleccionados, id]);
    }
  };

  const _guardarRutina = () => {
    if (!nuevoTitulo.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para tu rutina.');
      return;
    }
    if (ejerciciosSeleccionados.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un ejercicio.');
      return;
    }

    const nuevaRutina: Rutina = {
      id: Date.now().toString(),
      titulo: nuevoTitulo,
      objetivo: 'Personalizado',
      duracion: `${ejerciciosSeleccionados.length * 10} min`,
      diasSemana: 'Personalizado',
      cantidadEjercicios: ejerciciosSeleccionados.length,
      nivel: 'Todos',
      // We could add ejercicios to Rutina interface if needed, but for now we rely on cantidadEjercicios
    };

    agregarRutina(nuevaRutina);
    setModalVisible(false);
    setNuevoTitulo('');
    setEjerciciosSeleccionados([]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera Centrada Minimalista */}
      <View style={styles.headerCentrado}>
        <Text style={styles.subtituloCentrado}>PLANES DE ENTRENAMIENTO</Text>
        <Text style={styles.tituloNegroCentrado}>MIS RUTINAS</Text>
      </View>
      
      {rutinas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="barbell-outline" size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Aún no tienes rutinas</Text>
          <Text style={styles.emptySubtitle}>Agrega ejercicios para armar tu rutina personalizada.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {rutinas.map((rutina) => (
            <TouchableOpacity key={rutina.id} style={styles.card} activeOpacity={0.88}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{rutina.titulo}</Text>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
              <View style={styles.tagContainer}>
                <Text style={styles.tagText}>{rutina.cantidadEjercicios} ejercicios</Text>
                <Text style={styles.tagSeparador}>•</Text>
                <Text style={styles.tagText}>{rutina.duracion}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal para agregar Rutina */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>NUEVA RUTINA</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Nombre de la rutina..." 
              value={nuevoTitulo} 
              onChangeText={setNuevoTitulo}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.sectionTitle}>SELECCIONA LOS EJERCICIOS</Text>
            <ScrollView style={styles.ejerciciosList} showsVerticalScrollIndicator={false}>
              {listaEjerciciosEjemplo.map((ej) => {
                const seleccionado = ejerciciosSeleccionados.includes(ej.id);
                return (
                  <TouchableOpacity key={ej.id} style={[styles.ejercicioItem, seleccionado && styles.ejercicioItemActivo]} onPress={() => _toggleEjercicio(ej.id)} activeOpacity={0.8}>
                    <View style={styles.ejercicioItemTextCont}>
                      <Text style={[styles.ejercicioNombre, seleccionado && styles.ejercicioNombreActivo]}>{ej.nombre}</Text>
                      <Text style={styles.ejercicioDesc}>{ej.grupoMuscular} • {ej.articulacionClave}</Text>
                    </View>
                    <Ionicons name={seleccionado ? "checkbox" : "square-outline"} size={22} color={seleccionado ? ColoresApp.primario : "#CBD5E1"} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={_guardarRutina} activeOpacity={0.88}>
              <Text style={styles.saveButtonText}>GUARDAR RUTINA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  headerCentrado: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
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
  scrollContent: { padding: 16, paddingBottom: 120 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: '#000000', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, fontWeight: '500', color: '#64748B', textAlign: 'center', lineHeight: 18 },
  fab: { position: 'absolute', bottom: 95, right: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: ColoresApp.primario, justifyContent: 'center', alignItems: 'center', shadowColor: ColoresApp.primario, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  
  card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#000000', flex: 1, letterSpacing: 0.3 },
  tagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  tagSeparador: { color: '#CBD5E1', fontSize: 10 },

  modalBackground: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, height: '82%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, fontWeight: '700', color: '#000000', marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#000000', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  ejerciciosList: { flex: 1, marginBottom: 18 },
  ejercicioItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 14, marginBottom: 8, backgroundColor: '#FFFFFF' },
  ejercicioItemActivo: { borderColor: ColoresApp.primario, borderWidth: 1.5 },
  ejercicioItemTextCont: { flex: 1 },
  ejercicioNombre: { fontSize: 14, fontWeight: '800', color: '#000000', marginBottom: 2 },
  ejercicioNombreActivo: { color: ColoresApp.primario },
  ejercicioDesc: { fontSize: 12, color: '#64748B' },
  saveButton: { backgroundColor: ColoresApp.primario, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.8 },
});
