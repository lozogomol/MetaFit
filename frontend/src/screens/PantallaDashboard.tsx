import React from 'react';
import { Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ColoresApp } from '../theme/colors';

import { PantallaEjercicios } from './PantallaEjercicios';
import { PantallaRutinas } from './PantallaRutinas';
import { PantallaEstado } from './PantallaEstado';
import { PantallaNutricion } from './PantallaNutricion';
import { PantallaPerfil } from './PantallaPerfil';

export type DashboardTabParamList = {
  Ejercicios: undefined;
  Rutinas: undefined;
  Estado: undefined;
  Nutricion: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();

const NavbarFlotante = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          let iconName: any = 'grid';
          if (route.name === 'Ejercicios') iconName = isFocused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Rutinas') iconName = isFocused ? 'layers' : 'layers-outline';
          else if (route.name === 'Estado') iconName = isFocused ? 'grid' : 'grid-outline';
          else if (route.name === 'Nutricion') iconName = isFocused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Perfil') iconName = isFocused ? 'person' : 'person-outline';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              activeOpacity={0.85}
              style={[
                styles.tabCirculo,
                isFocused && styles.tabCirculoActivo,
              ]}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={isFocused ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const PantallaDashboard = () => {
  return (
    <Tab.Navigator
      initialRouteName="Estado"
      tabBar={(props) => <NavbarFlotante {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* 1. IZQUIERDA: EJERCICIOS */}
      <Tab.Screen
        name="Ejercicios"
        component={PantallaEjercicios}
        options={{ tabBarLabel: 'Ejercicios' }}
      />

      {/* 2. RUTINAS */}
      <Tab.Screen
        name="Rutinas"
        component={PantallaRutinas}
        options={{ tabBarLabel: 'Rutinas' }}
      />

      {/* 3. CENTRO: ESTADO */}
      <Tab.Screen
        name="Estado"
        component={PantallaEstado}
        options={{ tabBarLabel: 'Estado' }}
      />

      {/* 4. NUTRICIÓN */}
      <Tab.Screen
        name="Nutricion"
        component={PantallaNutricion}
        options={{ tabBarLabel: 'Nutrición' }}
      />

      {/* 5. DERECHA: PERFIL */}
      <Tab.Screen
        name="Perfil"
        component={PantallaPerfil}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 14,
    right: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
    elevation: 10,
    zIndex: 999,
  },
  floatingBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 60,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabCirculoActivo: {
    backgroundColor: ColoresApp.primario, // Rojo al estar seleccionado
    shadowColor: ColoresApp.primario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
});
