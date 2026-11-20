import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PantallaCarga } from '../screens/PantallaCarga';
import { PantallaAcceso } from '../screens/PantallaAcceso';
import { PantallaRegistro } from '../screens/PantallaRegistro';
import { PantallaDashboard } from '../screens/PantallaDashboard';
import { PantallaCamaraPose } from '../screens/PantallaCamaraPose';
import { PantallaCamaraBiometrica } from '../screens/PantallaCamaraBiometrica';

export type RootStackParamList = {
  Carga: undefined;
  Acceso: undefined;
  Registro: undefined;
  Dashboard: undefined;
  CamaraPose: { nombreEjercicio: string };
  CamaraBiometrica: { onAnalisisCompletado: (peso: number, estatura: number) => void };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Carga"
        screenOptions={{
          headerShown: false, // Default is no header, similar to standard mobile apps
          animation: 'fade', // To mimic the fade transition in Dart
        }}
      >
        <Stack.Screen name="Carga" component={PantallaCarga} />
        <Stack.Screen name="Acceso" component={PantallaAcceso} />
        <Stack.Screen name="Dashboard" component={PantallaDashboard} />
        <Stack.Screen name="Registro" component={PantallaRegistro} />
        <Stack.Screen name="CamaraPose" component={PantallaCamaraPose} />
        <Stack.Screen name="CamaraBiometrica" component={PantallaCamaraBiometrica} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
