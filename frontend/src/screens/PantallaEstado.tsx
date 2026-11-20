import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../services/useStore';
import { UsuarioLogic } from '../models/Usuario';
import Svg, { Circle } from 'react-native-svg';
import { TarjetaNutricionDashboard } from '../components/TarjetaNutricionDashboard';
import { ColoresMetricas } from '../theme/colors';

// Diagnósticos clínicos objetivos (Sin emojis ni texto de relleno)
function getDiagnosticoIMC(imc: number) {
  if (imc < 18.5) {
    return {
      estado: 'BAJO PESO',
      color: '#0284C7',
      explicacion: 'Inferior al rango estándar',
    };
  } else if (imc < 25.0) {
    return {
      estado: 'RANGO ÓPTIMO',
      color: '#10B981',
      explicacion: 'Rango médico recomendado',
    };
  } else if (imc < 27.0) {
    return {
      estado: 'SOBREPESO LEVE',
      color: '#F59E0B',
      explicacion: 'Leve aumento sobre el estándar',
    };
  } else if (imc < 30.0) {
    return {
      estado: 'SOBREPESO',
      color: '#F59E0B',
      explicacion: 'Por encima del rango estándar',
    };
  } else {
    return {
      estado: 'OBESIDAD',
      color: '#EF4444',
      explicacion: 'Exceso ponderal clínico',
    };
  }
}

function getDiagnosticoGrasa(grasaPct: number, esHombre: boolean) {
  const limiteBajo = esHombre ? 10 : 18;
  const limiteSaludable = esHombre ? 20 : 28;
  const limiteModerado = esHombre ? 25 : 33;

  if (grasaPct < limiteBajo) {
    return {
      estado: 'NIVEL ATLETA',
      color: '#0284C7',
      explicacion: 'Grasa esencial o atlética',
    };
  } else if (grasaPct <= limiteSaludable) {
    return {
      estado: 'RANGO ÓPTIMO',
      color: '#10B981',
      explicacion: 'Composición corporal saludable',
    };
  } else if (grasaPct <= limiteModerado) {
    return {
      estado: 'NIVEL MODERADO',
      color: '#F59E0B',
      explicacion: 'Leve exceso sobre la media',
    };
  } else {
    return {
      estado: 'GRASA ELEVADA',
      color: '#EF4444',
      explicacion: 'Requiere reducción de tejido graso',
    };
  }
}

export const PantallaEstado = () => {
  const usuarioState = useStore((state) => state.usuarioActual);
  if (!usuarioState) return null;

  const usuario = new UsuarioLogic(usuarioState);

  // Registro de actividad semanal
  const actividad = usuarioState.actividadSemanal || [0, 0, 0, 0, 0, 0, 0];
  const maxPoints = Math.max(...actividad, 100);
  const totalPuntos = actividad.reduce((acc, curr) => acc + curr, 0);

  // Día de la semana actual
  const hoyRaw = new Date().getDay();
  const indexHoy = hoyRaw === 0 ? 6 : hoyRaw - 1;

  const diasSemana = [
    { label: 'LUN', value: actividad[0] || 0 },
    { label: 'MAR', value: actividad[1] || 0 },
    { label: 'MIÉ', value: actividad[2] || 0 },
    { label: 'JUE', value: actividad[3] || 0 },
    { label: 'VIE', value: actividad[4] || 0 },
    { label: 'SÁB', value: actividad[5] || 0 },
    { label: 'DOM', value: actividad[6] || 0 },
  ];

  // Geometría de medidores circulares de alta precisión
  const size = 114;
  const strokeWidth = 8;
  const radius = 45;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Grasa Corporal (Color estricto y unificado: #FF2D55)
  const grasaPorcentaje = usuario.porcentajeGrasa;
  const grasaRatio = Math.min(Math.max(grasaPorcentaje / 50, 0), 1);
  const grasaOffset = circumference - grasaRatio * circumference;

  // IMC (Escala técnica 0 a 40)
  const imcValor = Number(usuario.imc.toFixed(1));
  const imcRatio = Math.min(Math.max(imcValor / 40, 0), 1);
  const imcOffset = circumference - imcRatio * circumference;

  const infoIMC = getDiagnosticoIMC(imcValor);
  const infoGrasa = getDiagnosticoGrasa(grasaPorcentaje, usuario.genero === 'M');

  // Cálculos de peso saludable por estatura
  const estaturaMetros = usuario.estatura / 100;
  const pesoIdealMin = Math.round(18.5 * estaturaMetros * estaturaMetros);
  const pesoIdealMax = Math.round(24.9 * estaturaMetros * estaturaMetros);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cabecera Sobria con Nombre y Foto */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.saludoNegro}>
              {usuarioState.nombre ? usuarioState.nombre.toUpperCase() : 'GATITO'}
            </Text>
          </View>
          <View style={styles.avatarMiniContenedor}>
            {usuarioState.avatarUri ? (
              <Image source={{ uri: usuarioState.avatarUri }} style={styles.avatarMiniFoto} />
            ) : (
              <Ionicons name="person" size={20} color="#000000" />
            )}
          </View>
        </View>

        {/* 2 MÉTRICAS CLÍNICAS: MASA CORPORAL Y GRASA */}
        <View style={styles.metricsRow}>
          {/* Card Izquierda: MASA CORPORAL */}
          <View style={styles.metricCard}>
            <Text style={styles.cardTituloNegro}>MASA CORPORAL</Text>

            <View style={styles.gaugeWrapper}>
              <Svg width={size} height={size}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#F1F5F9"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={infoIMC.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={imcOffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              </Svg>
              <View style={styles.gaugeCenter}>
                <Text style={styles.gaugeValueIMC}>{imcValor}</Text>
                <Text style={styles.gaugeSubEtiqueta}>KG / M²</Text>
              </View>
            </View>

            {/* Tarjetica unificada de Estado */}
            <View style={styles.miniCard}>
              <View style={styles.miniCardFilaSuperior}>
                <View style={styles.miniCardNombreFila}>
                  <View style={[styles.miniCardPunto, { backgroundColor: infoIMC.color }]} />
                  <Text style={styles.miniCardTitulo}>{infoIMC.estado.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.kpiNumeroGrande}>{imcValor}</Text>
              <View style={styles.miniCardBarTrack}>
                <View
                  style={[
                    styles.miniCardBarFill,
                    {
                      width: `${Math.min(Math.max(((imcValor - 15) / 20) * 100, 15), 100)}%`,
                      backgroundColor: infoIMC.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.miniCardSubtexto}>RANGO IDEAL: 18.5 - 24.9</Text>
            </View>
          </View>

          {/* Card Derecha: GRASA CORPORAL */}
          <View style={styles.metricCard}>
            <Text style={styles.cardTituloNegro}>GRASA CORPORAL</Text>

            <View style={styles.gaugeWrapper}>
              <Svg width={size} height={size}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#F1F5F9"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={infoGrasa.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={grasaOffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              </Svg>
              <View style={styles.gaugeCenter}>
                <Text style={styles.gaugeValueGrasa}>
                  {grasaPorcentaje}
                  <Text style={styles.gaugeUnidadPct}>%</Text>
                </Text>
                <Text style={styles.gaugeSubEtiqueta}>DEL TOTAL</Text>
              </View>
            </View>

            {/* Tarjetica unificada de Grasa */}
            <View style={styles.miniCard}>
              <View style={styles.miniCardFilaSuperior}>
                <View style={styles.miniCardNombreFila}>
                  <View style={[styles.miniCardPunto, { backgroundColor: infoGrasa.color }]} />
                  <Text style={styles.miniCardTitulo}>{infoGrasa.estado.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.kpiNumeroGrande}>{grasaPorcentaje}%</Text>
              <View style={styles.miniCardBarTrack}>
                <View
                  style={[
                    styles.miniCardBarFill,
                    {
                      width: `${Math.min(Math.max((grasaPorcentaje / 35) * 100, 15), 100)}%`,
                      backgroundColor: infoGrasa.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.miniCardSubtexto}>
                RANGO IDEAL: {usuario.genero === 'M' ? '14% - 20%' : '18% - 28%'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2 TARJETAS: DESGLOSE DE PESO Y ESTATURA */}
        <View style={styles.metricsRow}>
          {/* Card Peso */}
          <View style={styles.kpiCard}>
            <Text style={styles.cardTituloNegro}>PESO ACTUAL</Text>
            <Text style={styles.kpiValorCentrado}>
              {usuario.peso} <Text style={styles.kpiUnidad}>KG</Text>
            </Text>

            <View style={styles.miniCard}>
              <View style={styles.miniCardFilaSuperior}>
                <View style={styles.miniCardNombreFila}>
                  <View style={[styles.miniCardPunto, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.miniCardTitulo}>MASA MAGRA</Text>
                </View>
              </View>
              <Text style={styles.kpiNumeroGrande}>{usuario.masaMagraKg.toFixed(1)} KG</Text>
              <View style={styles.miniCardBarTrack}>
                <View
                  style={[
                    styles.miniCardBarFill,
                    {
                      width: `${Math.round((usuario.masaMagraKg / usuario.peso) * 100)}%`,
                      backgroundColor: '#3B82F6',
                    },
                  ]}
                />
              </View>
              <Text style={styles.miniCardSubtexto}>
                MASA GRASA: {usuario.masaGrasaKg.toFixed(1)} KG
              </Text>
            </View>
          </View>

          {/* Card Estatura */}
          <View style={styles.kpiCard}>
            <Text style={styles.cardTituloNegro}>ESTATURA</Text>
            <Text style={styles.kpiValorCentrado}>
              {usuario.estatura} <Text style={styles.kpiUnidad}>CM</Text>
            </Text>

            <View style={styles.miniCard}>
              <View style={styles.miniCardFilaSuperior}>
                <View style={styles.miniCardNombreFila}>
                  <View style={[styles.miniCardPunto, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.miniCardTitulo}>RANGO IDEAL</Text>
                </View>
              </View>
              <Text style={styles.kpiNumeroGrande}>{pesoIdealMin} - {pesoIdealMax} KG</Text>
              <View style={styles.miniCardBarTrack}>
                <View
                  style={[
                    styles.miniCardBarFill,
                    { width: '100%', backgroundColor: '#10B981' },
                  ]}
                />
              </View>
              <Text style={styles.miniCardSubtexto}>
                ALTURA NETA: {estaturaMetros.toFixed(2)} M
              </Text>
            </View>
          </View>
        </View>

        {/* TARJETA DE DISTRIBUCIÓN DE CALORÍAS */}
        <TarjetaNutricionDashboard usuario={usuario} />

        {/* ACTIVIDAD SEMANAL TÉCNICA Y SOBRIA */}
        <View style={styles.graphCard}>
          <View style={styles.graphHeaderCentrado}>
            <Text style={styles.cardTituloNegro}>ACTIVIDAD SEMANAL</Text>
          </View>

          {/* Barras Monocromáticas y Planas con Puntas Cuadradas */}
          <View style={styles.graphContainer}>
            {diasSemana.map((dia, index) => {
              const esHoy = index === indexHoy;
              const porcentajeAltura = Math.max((dia.value / maxPoints) * 100, 8);

              return (
                <View key={index} style={styles.barColumna}>
                  <Text style={[styles.puntosFlotantes, esHoy && styles.puntosFlotantesHoy]}>
                    {dia.value > 0 ? dia.value : ''}
                  </Text>

                  {/* Pista de barra cuadrada sobria */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${porcentajeAltura}%`,
                          backgroundColor: esHoy ? '#000000' : '#E2E8F0',
                        },
                      ]}
                    />
                  </View>

                  <Text style={[styles.diaLabel, esHoy && styles.diaLabelHoy]}>{dia.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Tarjetica unificada de Puntos */}
          <View style={styles.miniCard}>
            <View style={styles.miniCardFilaSuperior}>
              <View style={styles.miniCardNombreFila}>
                <View style={[styles.miniCardPunto, { backgroundColor: '#000000' }]} />
                <Text style={styles.miniCardTitulo}>PUNTOS ACUMULADOS</Text>
              </View>
            </View>
            <Text style={styles.kpiNumeroGrande}>{totalPuntos} PUNTOS</Text>
            <View style={styles.miniCardBarTrack}>
              <View
                style={[
                  styles.miniCardBarFill,
                  {
                    width: `${Math.min(Math.max((totalPuntos / 300) * 100, 8), 100)}%`,
                    backgroundColor: '#000000',
                  },
                ]}
              />
            </View>
            <Text style={styles.miniCardSubtexto}>RANGO IDEAL: 300+ PTS</Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },

  // Cabecera Minimalista con Saludo y Foto
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerTextCol: {
    flex: 1,
  },
  saludoPequeno: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  saludoNegro: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
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
  subtituloCentrado: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },

  // Fila de Métricas
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },

  // Tarjeta de Métrica Minimalista
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTituloNegro: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  gaugeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValueIMC: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  gaugeValueGrasa: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  gaugeUnidadPct: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  gaugeSubEtiqueta: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginTop: 2,
    textAlign: 'center',
  },

  // Tarjetitas de Estado Unificadas (Mismo formato que macroCard)
  tarjetitasColumna: {
    width: '100%',
    gap: 6,
    marginTop: 10,
  },
  miniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: '100%',
    marginTop: 8,
  },
  miniCardFilaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniCardNombreFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniCardPunto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniCardTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  miniCardValor: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  miniBarTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 1.5,
    marginVertical: 4,
    overflow: 'hidden',
  },
  miniCardBarTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 1.5,
    marginVertical: 4,
    overflow: 'hidden',
  },
  miniCardBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  miniCardSubtexto: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },

  // Tarjeta KPI Minimalista
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiValorCentrado: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginVertical: 2,
    letterSpacing: -0.5,
  },
  kpiUnidad: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  kpiNumeroGrande: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    marginVertical: 3,
    letterSpacing: 0.3,
  },

  // Gráfica de Actividad Semanal
  graphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  graphHeaderCentrado: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barColumna: {
    alignItems: 'center',
    flex: 1,
  },
  puntosFlotantes: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
    height: 14,
  },
  puntosFlotantesHoy: {
    color: '#000000',
    fontWeight: '900',
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 0,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 0,
  },
  diaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  diaLabelHoy: {
    color: '#000000',
    fontWeight: '900',
  },
});
