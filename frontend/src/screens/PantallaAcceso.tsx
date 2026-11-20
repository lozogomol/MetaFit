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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ColoresApp } from '../theme/colors';
import { BotonPrincipal } from '../components/Boton';
import { CampoTexto } from '../components/CampoTexto';
import { useStore } from '../services/useStore';
import { RootStackParamList } from '../navigation/AppNavigator';

type PantallaAccesoNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Acceso'>;

interface Props {
  navigation: PantallaAccesoNavigationProp;
}

export const PantallaAcceso: React.FC<Props> = ({ navigation }) => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorContrasena, setErrorContrasena] = useState('');
  
  const iniciarSesion = useStore((state) => state.iniciarSesion);

  const _ingresar = async () => {
    let hasError = false;
    if (!correo.trim()) {
      setErrorCorreo('Ingresa tu correo electrónico');
      hasError = true;
    } else if (!correo.includes('@')) {
      setErrorCorreo('Ingresa un correo válido');
      hasError = true;
    } else {
      setErrorCorreo('');
    }

    if (!contrasena.trim()) {
      setErrorContrasena('Ingresa tu contraseña');
      hasError = true;
    } else {
      setErrorContrasena('');
    }

    if (hasError) return;

    setCargando(true);

    const nombre = correo.includes('@') ? correo.split('@')[0] : correo;
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    iniciarSesion({ nombre, correo });
    
    setCargando(false);
    navigation.replace('Dashboard');
  };

  const _irARegistro = () => {
    navigation.navigate('Registro');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled" 
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.card}>
                <Image 
                  source={require('../../assets/Logo_ll_Meta_Fit.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.titulo}>Acceso</Text>
                <Text style={styles.subtitulo}>Ingresa a tu cuenta para continuar.</Text>

                <View style={styles.form}>
                  <CampoTexto
                    etiqueta="Correo Electrónico"
                    value={correo}
                    onChangeText={setCorreo}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    iconoPrefijoName="mail-outline"
                    error={errorCorreo}
                  />

                  <CampoTexto
                    etiqueta="Contraseña"
                    value={contrasena}
                    onChangeText={setContrasena}
                    esContrasena
                    iconoPrefijoName="lock-closed-outline"
                    onSubmitEditing={_ingresar}
                    error={errorContrasena}
                  />

                  <View style={styles.botonContainer}>
                    <BotonPrincipal
                      texto="INGRESAR"
                      alPresionar={_ingresar}
                      cargando={cargando}
                    />
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>

            <View style={styles.registroCard}>
              <Text style={styles.textoRegistro}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={_irARegistro}>
                <Text style={styles.linkRegistro}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ColoresApp.fondo,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
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
  logo: {
    width: 84,
    height: 84,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitulo: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  form: {
    width: '100%',
  },
  botonContainer: {
    marginTop: 16,
  },
  registroCard: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  textoRegistro: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  linkRegistro: {
    fontSize: 12,
    fontWeight: '900',
    color: ColoresApp.primario,
    letterSpacing: 0.5,
  },
});
