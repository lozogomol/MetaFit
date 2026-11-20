import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, StatusBar, Animated, Easing } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ColoresApp } from '../theme/colors';
import { useStore } from '../services/useStore';
import { RootStackParamList } from '../navigation/AppNavigator';

type PantallaCargaNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Carga'>;

interface Props {
  navigation: PantallaCargaNavigationProp;
}

export const PantallaCarga: React.FC<Props> = ({ navigation }) => {
  const estaAutenticado = useStore((state) => state.estaAutenticado);
  const usuarioActual = useStore((state) => state.usuarioActual);
  const rotacion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotacion, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const timer = setTimeout(() => {
      if (estaAutenticado && usuarioActual?.evaluacionCompletada) {
        navigation.replace('Dashboard');
      } else {
        navigation.replace('Acceso');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [estaAutenticado, usuarioActual, navigation]);

  const spin = rotacion.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image 
        source={require('../../assets/Logo_Meta_Fit.png')} 
        style={styles.logo} 
        resizeMode="contain" 
      />
      <Text style={styles.titulo}>META FIT</Text>
      <Animated.View style={[styles.loaderCircular, { transform: [{ rotate: spin }] }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColoresApp.primario,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  titulo: {
    marginTop: 20,
    fontSize: 36,
    fontWeight: '900',
    color: ColoresApp.blanco,
    letterSpacing: 4.0,
  },
  loaderCircular: {
    marginTop: 40,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderTopColor: '#FFFFFF',
  },
});
