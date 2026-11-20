import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ColoresApp } from '../theme/colors';
import { BotonPrincipal } from '../components/Boton';
import { CampoTexto } from '../components/CampoTexto';
import { useStore } from '../services/useStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Genero } from '../models/Usuario';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Registro'>;

interface Props {
  navigation: NavigationProp;
}

export const PantallaRegistro: React.FC<Props> = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [estatura, setEstatura] = useState('');
  const [peso, setPeso] = useState('');
  const [fechaDate, setFechaDate] = useState(new Date(2000, 0, 1));
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [genero, setGenero] = useState<Genero>('M');

  // IA prediction state
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const [cargando, setCargando] = useState(false);
  const iniciarSesion = useStore((state) => state.iniciarSesion);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || fechaDate;
    if (Platform.OS !== 'ios') {
      setMostrarPicker(false);
    }
    setFechaDate(currentDate);
  };

  const _seleccionarYAnalizarFoto = () => {
    navigation.navigate('CamaraBiometrica', {
      onAnalisisCompletado: (pesoExtraido: number, estaturaExtraida: number) => {
        setPeso(pesoExtraido.toString());
        setEstatura(estaturaExtraida.toString());
        Alert.alert(
          "Análisis Exitoso", 
          `La IA estimó tu peso en ${pesoExtraido} kg y tu estatura en ${estaturaExtraida} cm basándose en tu entorno (A4), tu esqueleto y la malla 3D.`
        );
      }
    });
  };

  const _registrarUsuario = async () => {
    if (!nombre || !correo || !contrasena || contrasena !== confirmar || !peso || !estatura) {
      Alert.alert("Campos incompletos", "Por favor llena todos los campos para continuar.");
      return; 
    }

    const hoy = new Date();
    let edadCalculada = hoy.getFullYear() - fechaDate.getFullYear();
    const m = hoy.getMonth() - fechaDate.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaDate.getDate())) {
      edadCalculada--;
    }

    if (isNaN(edadCalculada) || edadCalculada < 10 || edadCalculada > 100) {
      Alert.alert("Edad Inválida", "Por favor selecciona una fecha de nacimiento válida.");
      return;
    }

    setCargando(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    iniciarSesion({
      nombre,
      correo,
      estatura: parseFloat(estatura),
      peso: parseFloat(peso),
      edad: edadCalculada,
      genero,
      evaluacionCompletada: true,
    });

    setCargando(false);
    navigation.replace('Dashboard');
  };

  const BotonGenero = ({ g, titulo }: { g: Genero, titulo: string }) => {
    const seleccionado = genero === g;
    return (
      <TouchableOpacity 
        onPress={() => setGenero(g)}
        style={[styles.botonGenero, seleccionado && styles.botonGeneroSeleccionado]}
      >
        <Text style={[styles.textoGenero, seleccionado && styles.textoGeneroSeleccionado]}>
          {titulo}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled" 
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.card}>
                <Image source={require('../../assets/Logo_ll_Meta_Fit.png')} style={styles.logo} resizeMode="contain" />
                <Text style={styles.titulo}>Registro</Text>

                <View style={styles.form}>
                  <CampoTexto etiqueta="Nombre de Usuario" value={nombre} onChangeText={setNombre} iconoPrefijoName="person-outline" />
                  <CampoTexto etiqueta="Correo Electrónico" value={correo} onChangeText={setCorreo} keyboardType="email-address" iconoPrefijoName="mail-outline" autoCapitalize="none" />
                  <CampoTexto etiqueta="Contraseña" value={contrasena} onChangeText={setContrasena} esContrasena iconoPrefijoName="lock-closed-outline" />
                  <CampoTexto etiqueta="Confirmar Contraseña" value={confirmar} onChangeText={setConfirmar} esContrasena iconoPrefijoName="shield-checkmark-outline" />

                  <Text style={styles.label}>Género</Text>
                  <View style={styles.row}>
                    <BotonGenero g="M" titulo="Hombre" />
                    <View style={{width: 12}} />
                    <BotonGenero g="F" titulo="Mujer" />
                  </View>

                  <View style={{marginTop: 16}}>
                    <Text style={styles.label}>Fecha de Nacimiento</Text>
                    <TouchableOpacity 
                      onPress={() => setMostrarPicker(!mostrarPicker)} 
                      style={{
                        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', 
                        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, height: 50, paddingHorizontal: 16
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#64748B" />
                      <Text style={{marginLeft: 10, fontSize: 15, color: '#000000', fontWeight: '700'}}>
                        {fechaDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {mostrarPicker && (
                    <View style={{marginTop: 8, backgroundColor: '#FAFBFC', borderRadius: 16, overflow: 'hidden', padding: 12, borderWidth: 1, borderColor: '#F1F5F9'}}>
                      <DateTimePicker
                        value={fechaDate}
                        mode="date"
                        display="spinner"
                        onChange={onChangeDate}
                        maximumDate={new Date()}
                        locale="es-ES"
                      />
                      <TouchableOpacity 
                        onPress={() => setMostrarPicker(false)} 
                        style={[styles.iaBoton, { marginTop: 10 }]}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.iaBotonTexto}>LISTO</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Sección Análisis Biométrico (Antes de Estatura y Peso) */}
                  <View style={styles.iaContainer}>
                    <View style={[styles.iaHeader, { justifyContent: 'center' }]}>
                      <Text style={[styles.iaTitulo, { marginLeft: 0 }]}>Análisis Biométrico</Text>
                    </View>
                    <Text style={styles.iaDesc}>Ubícate a 2 metros de distancia con la cámara en 1x para que el sistema escanee tu cuerpo y determine automáticamente tu estatura y peso.</Text>
                    
                    <TouchableOpacity style={styles.iaBoton} onPress={_seleccionarYAnalizarFoto} activeOpacity={0.85}>
                      <Text style={styles.iaBotonTexto}>ANALIZAR</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Campos bloqueados: solo se llenan mediante el análisis biométrico */}
                  <View style={[styles.row, {marginBottom: 10}]}>
                    <View style={{flex: 1}}>
                      <CampoTexto 
                        etiqueta="Estatura" 
                        value={estatura} 
                        onChangeText={setEstatura} 
                        textoSufijo="cm" 
                        editable={false}
                      />
                    </View>
                    <View style={{width: 12}} />
                    <View style={{flex: 1}}>
                      <CampoTexto 
                        etiqueta="Peso" 
                        value={peso} 
                        onChangeText={setPeso} 
                        textoSufijo="kg" 
                        editable={false}
                      />
                    </View>
                  </View>

                  <BotonPrincipal texto="REGISTRARSE" cargando={cargando} alPresionar={_registrarUsuario} />
                </View>
              </View>
            </TouchableWithoutFeedback>
            
            <View style={styles.footerCard}>
              <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.footerLink}>Accede</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ColoresApp.fondo },
  scrollContent: { 
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16, 
    alignItems: 'center' 
  },
  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  logo: { width: 84, height: 84, marginBottom: 20 },
  titulo: { fontSize: 20, fontWeight: '900', color: '#000000', marginBottom: 20, letterSpacing: 0.5, textTransform: 'uppercase' },
  form: { width: '100%' },
  label: { fontSize: 11, fontWeight: '900', color: '#000000', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row' },
  botonGenero: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  botonGeneroSeleccionado: { backgroundColor: '#FFFFFF', borderColor: ColoresApp.primario, borderWidth: 1.5 },
  textoGenero: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  textoGeneroSeleccionado: { fontWeight: '900', color: ColoresApp.primario },
  footerCard: { width: '100%', maxWidth: 450, flexDirection: 'row', justifyContent: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 20, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
  footerText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  footerLink: { fontSize: 12, fontWeight: '900', color: ColoresApp.primario, letterSpacing: 0.5 },
  inputHint: { fontSize: 11, color: '#64748B', marginTop: 4, marginLeft: 4 },
  iaContainer: { marginTop: 12, marginBottom: 20, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9' },
  iaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iaTitulo: { fontSize: 12, fontWeight: '900', color: '#000000', textTransform: 'uppercase', letterSpacing: 1 },
  iaDesc: { fontSize: 11, color: '#64748B', marginBottom: 12, lineHeight: 16 },
  iaBoton: { 
    flexDirection: 'row', 
    backgroundColor: ColoresApp.primario, 
    height: 46, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: ColoresApp.primario,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  iaBotonTexto: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: '900', 
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  iaResultados: { marginTop: 14, alignItems: 'center', padding: 12, backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  iaResultText: { fontSize: 11, color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  iaResultValues: { fontSize: 18, color: ColoresApp.primario, fontWeight: '900', marginTop: 3 },
});
