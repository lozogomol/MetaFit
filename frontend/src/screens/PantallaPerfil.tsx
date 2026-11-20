import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ColoresApp } from '../theme/colors';
import { useStore } from '../services/useStore';
import { BotonPrincipal } from '../components/Boton';
import { CampoTexto } from '../components/CampoTexto';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

export const PantallaPerfil = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const usuarioActual = useStore((state) => state.usuarioActual);
  const cerrarSesion = useStore((state) => state.cerrarSesion);
  const actualizarEvaluacion = useStore((state) => state.actualizarEvaluacion);

  const [peso, setPeso] = React.useState(usuarioActual?.peso?.toString() || '');
  const [estatura, setEstatura] = React.useState(usuarioActual?.estatura?.toString() || '');
  const [edad, setEdad] = React.useState(usuarioActual?.edad?.toString() || '');

  React.useEffect(() => {
    if (usuarioActual) {
      setPeso(usuarioActual.peso?.toString() || '');
      setEstatura(usuarioActual.estatura?.toString() || '');
      setEdad(usuarioActual.edad?.toString() || '');
    }
  }, [usuarioActual?.peso, usuarioActual?.estatura, usuarioActual?.edad]);

  const _guardarNuevasMedidas = () => {
    const nuevoPeso = parseFloat(peso);
    const nuevaEstatura = parseFloat(estatura);
    const nuevaEdad = parseInt(edad, 10);

    actualizarEvaluacion({
      peso: isNaN(nuevoPeso) ? (usuarioActual?.peso ?? 70) : nuevoPeso,
      estatura: isNaN(nuevaEstatura) ? (usuarioActual?.estatura ?? 170) : nuevaEstatura,
      edad: isNaN(nuevaEdad) ? (usuarioActual?.edad ?? 24) : nuevaEdad,
    });
    Alert.alert("Éxito", "¡Medidas guardadas y actualizadas correctamente!");
  };

  const _pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      // Si tenemos base64, guardamos como data URI permanente para evitar que se borre de la cache temporal
      const fotoUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      actualizarEvaluacion({ avatarUri: fotoUri });
    }
  };

  const _handleAvatarPress = () => {
    if (usuarioActual?.avatarUri) {
      Alert.alert('Foto de Perfil', '¿Qué deseas hacer?', [
        { text: 'Cambiar foto', onPress: _pickImage },
        { text: 'Eliminar foto', onPress: () => actualizarEvaluacion({ avatarUri: undefined }), style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' }
      ]);
    } else {
      _pickImage();
    }
  };

  const _cerrarSesion = () => {
    Alert.alert('Cerrar Sesión', '¿Deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => {
          cerrarSesion();
          navigation.replace('Acceso');
        } 
      },
    ]);
  };

  if (!usuarioActual) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera Sobria Minimalista */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextCol}>
          <Text style={styles.saludoNegro}>PERFIL</Text>
        </View>
        <View style={styles.headerAcciones}>
          <View style={styles.avatarMiniContenedor}>
            {usuarioActual?.avatarUri ? (
              <Image source={{ uri: usuarioActual.avatarUri }} style={styles.avatarMiniFoto} />
            ) : (
              <Ionicons name="person" size={20} color="#000000" />
            )}
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.perfilContainer}>
          <TouchableOpacity style={styles.avatarContainer} onPress={_handleAvatarPress} activeOpacity={0.85}>
            {usuarioActual.avatarUri ? (
              <Image source={{ uri: usuarioActual.avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="camera-outline" size={36} color="#000000" />
            )}
          </TouchableOpacity>
          <Text style={styles.nombre}>{usuarioActual.nombre.toUpperCase()}</Text>
          <Text style={styles.correo}>{usuarioActual.correo}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACTUALIZAR MEDIDAS</Text>
          
          <View style={styles.row}>
            <View style={styles.half}>
              <CampoTexto etiqueta="Peso" value={peso} onChangeText={setPeso} textoSufijo="kg" keyboardType="numeric" />
            </View>
            <View style={styles.half}>
              <CampoTexto etiqueta="Estatura" value={estatura} onChangeText={setEstatura} textoSufijo="cm" keyboardType="numeric" />
            </View>
          </View>
          <CampoTexto etiqueta="Edad" value={edad} onChangeText={setEdad} textoSufijo="años" keyboardType="numeric" />
          
          <BotonPrincipal texto="GUARDAR MEDIDAS" alPresionar={_guardarNuevasMedidas} estilo={{height: 50, borderRadius: 12}} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={_cerrarSesion} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={ColoresApp.primario} />
          <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  saludoNegro: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  headerAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMiniContenedor: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarMiniFoto: {
    width: '100%',
    height: '100%',
  },
  scrollContent: { padding: 16, paddingBottom: 120 },
  perfilContainer: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#000000', marginBottom: 12, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  nombre: { fontSize: 18, fontWeight: '900', color: '#000000', marginBottom: 2, letterSpacing: 0.5 },
  correo: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 12, fontWeight: '900', color: '#000000', marginBottom: 18, textAlign: 'center', letterSpacing: 1.2, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { flex: 0.48 },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 14, gap: 8 },
  logoutText: { fontSize: 13, fontWeight: '900', color: ColoresApp.primario, letterSpacing: 0.8 },
});
