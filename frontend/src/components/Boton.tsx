import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { ColoresApp } from '../theme/colors';

interface BotonPrincipalProps {
  texto: string;
  alPresionar?: () => void;
  cargando?: boolean;
  estilo?: ViewStyle;
  estiloTexto?: TextStyle;
}

export const BotonPrincipal: React.FC<BotonPrincipalProps> = ({
  texto,
  alPresionar,
  cargando = false,
  estilo,
  estiloTexto,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.boton,
        cargando || !alPresionar ? styles.botonDeshabilitado : null,
        estilo,
      ]}
      onPress={alPresionar}
      disabled={cargando || !alPresionar}
      activeOpacity={0.8}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={ColoresApp.blanco} />
      ) : (
        <Text style={[styles.texto, estiloTexto]}>{texto}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  boton: {
    width: '100%',
    height: 52,
    backgroundColor: ColoresApp.primario,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.6,
    backgroundColor: '#9AA5B1',
  },
  texto: {
    color: ColoresApp.blanco,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
