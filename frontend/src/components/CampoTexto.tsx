import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps, Pressable } from 'react-native';
import { ColoresApp } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface CampoTextoProps extends TextInputProps {
  etiqueta: string;
  sugerencia?: string;
  esContrasena?: boolean;
  iconoPrefijoName?: keyof typeof Ionicons.glyphMap;
  textoSufijo?: string;
  error?: string;
}

export const CampoTexto: React.FC<CampoTextoProps> = ({
  etiqueta,
  sugerencia,
  esContrasena = false,
  iconoPrefijoName,
  textoSufijo,
  error,
  ...props
}) => {
  const [ocultarTexto, setOcultarTexto] = useState(esContrasena);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<any>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <Pressable
        onPress={() => {
          if (props.editable !== false) {
            inputRef.current?.focus();
          }
        }}
        style={[
          styles.inputContainer,
          props.editable === false ? styles.inputDisabled : null,
          isFocused ? styles.inputFocused : null,
          error ? styles.inputError : null,
        ]}
      >
        {iconoPrefijoName && (
          <Ionicons
            name={iconoPrefijoName}
            size={20}
            color={ColoresApp.textoSecundario}
            style={styles.iconoPrefijo}
          />
        )}
        <TextInput
          ref={inputRef}
          style={[styles.input, { outlineStyle: 'none' } as any]}
          secureTextEntry={ocultarTexto}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {textoSufijo && <Text style={styles.textoSufijo}>{textoSufijo}</Text>}
        {esContrasena && (
          <TouchableOpacity
            style={styles.iconoOjo}
            onPress={() => setOcultarTexto(!ocultarTexto)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={ocultarTexto ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={ColoresApp.textoSecundario}
            />
          </TouchableOpacity>
        )}
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  inputFocused: {
    borderColor: ColoresApp.primario,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: ColoresApp.error,
    borderWidth: 1.5,
  },
  iconoPrefijo: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    fontWeight: '700',
    height: '100%',
  },
  textoSufijo: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '800',
    marginLeft: 8,
  },
  iconoOjo: {
    padding: 6,
    marginLeft: 8,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: ColoresApp.error,
  },
});
