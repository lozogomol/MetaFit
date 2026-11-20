import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { UsuarioLogic } from '../models/Usuario';
import { ColoresMetricas } from '../theme/colors';

interface Props {
  usuario: UsuarioLogic;
}

// Taxonomía estricta de colores por nutriente
const COLORES_MACROS = {
  proteina: ColoresMetricas.proteina, // #3B82F6
  carbos: ColoresMetricas.carbos,     // #10B981
  grasas: ColoresMetricas.grasa,      // #FF2D55 (mismo color para toda la grasa corporal)
};

export const TarjetaNutricionDashboard: React.FC<Props> = ({ usuario }) => {
  const imc = usuario.imc;
  const grasa = usuario.porcentajeGrasa;
  const peso = usuario.peso;
  const estatura = usuario.estatura;
  const edad = usuario.edad;
  const esHombre = usuario.genero === 'M';

  // Cálculo TMB + Factor de Actividad
  const tmb = esHombre
    ? 10 * peso + 6.25 * estatura - 5 * edad + 5
    : 10 * peso + 6.25 * estatura - 5 * edad - 161;
  const mantenimiento = Math.round(tmb * 1.4);

  let caloriasObjetivo = mantenimiento;
  let pctProteina = 35;
  let pctCarbos = 40;
  let pctGrasas = 25;

  if (imc < 18.5) {
    caloriasObjetivo = mantenimiento + 400;
    pctProteina = 25;
    pctCarbos = 55;
    pctGrasas = 20;
  } else if (imc >= 25.0 || grasa > (esHombre ? 22 : 30)) {
    caloriasObjetivo = Math.max(1400, mantenimiento - 450);
    pctProteina = 40;
    pctCarbos = 35;
    pctGrasas = 25;
  } else {
    caloriasObjetivo = mantenimiento;
    pctProteina = 35;
    pctCarbos = 40;
    pctGrasas = 25;
  }

  const gramosProteina = Math.round((caloriasObjetivo * (pctProteina / 100)) / 4);
  const gramosCarbos = Math.round((caloriasObjetivo * (pctCarbos / 100)) / 4);
  const gramosGrasas = Math.round((caloriasObjetivo * (pctGrasas / 100)) / 9);

  // Parámetros de la Gráfica Cuadrada Minimalista
  const size = 146;
  const radius = 58;
  const strokeWidth = 10;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Separación angular limpia entre arcos (Puntas cuadradas)
  const gap = 5;
  const arcProteina = (pctProteina / 100) * circumference - gap;
  const arcCarbos = (pctCarbos / 100) * circumference - gap;
  const arcGrasas = (pctGrasas / 100) * circumference - gap;

  // Ángulos de rotación
  const angleProteina = -90;
  const angleCarbos = -90 + (pctProteina / 100) * 360;
  const angleGrasas = -90 + ((pctProteina + pctCarbos) / 100) * 360;

  // Diagnóstico contextual de recomendación calórica
  let tipoRecomendacion = 'META DIARIA';
  if (imc >= 25.0 || grasa > (esHombre ? 22 : 30)) {
    tipoRecomendacion = 'LÍMITE DÉFICIT';
  } else if (imc < 18.5) {
    tipoRecomendacion = 'MÍNIMO SUPERÁVIT';
  }

  return (
    <View style={styles.card}>
      {/* Cabecera Centrada y en Negro */}
      <View style={styles.headerCentrado}>
        <Text style={styles.tituloNegroCentrado}>CONSUMO DE CALORÍAS</Text>
      </View>

      {/* Gráfica Donut y Desglose al Lado */}
      <View style={styles.contenidoFila}>
        {/* GRÁFICA CIRCULAR DE PUNTAS PLANAS */}
        <View style={styles.donutWrapper}>
          <Svg width={size} height={size}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Arco 1: Proteína */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={COLORES_MACROS.proteina}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arcProteina} ${circumference}`}
              strokeLinecap="butt"
              transform={`rotate(${angleProteina} ${center} ${center})`}
            />

            {/* Arco 2: Carbohidratos */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={COLORES_MACROS.carbos}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arcCarbos} ${circumference}`}
              strokeLinecap="butt"
              transform={`rotate(${angleCarbos} ${center} ${center})`}
            />

            {/* Arco 3: Grasas */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={COLORES_MACROS.grasas}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arcGrasas} ${circumference}`}
              strokeLinecap="butt"
              transform={`rotate(${angleGrasas} ${center} ${center})`}
            />
          </Svg>

          {/* Centro del Donut */}
          <View style={styles.centroDonut}>
            <Text style={styles.caloriasValor}>{caloriasObjetivo}</Text>
            <Text style={styles.caloriasUnidad}>KCAL / DÍA</Text>
          </View>
        </View>

        {/* LEYENDA: MACROS CON COLORES UNIFICADOS */}
        <View style={styles.leyendaColumna}>
          {/* Tarjetica de Meta / Consumo Ideal */}
          <View style={styles.macroCard}>
            <View style={styles.macroFilaSuperior}>
              <View style={styles.macroNombreFila}>
                <View style={[styles.macroPunto, { backgroundColor: '#000000' }]} />
                <Text style={styles.macroNombre}>CONSUMO IDEAL</Text>
              </View>
            </View>
            <Text style={styles.macroNumeroGrande}>{caloriasObjetivo.toLocaleString()} KCAL</Text>
            <View style={styles.miniBarTrack}>
              <View style={[styles.miniBarFill, { width: '100%', backgroundColor: '#000000' }]} />
            </View>
            <Text style={styles.macroGramos}>{tipoRecomendacion}</Text>
          </View>

          {/* Fila Proteína */}
          <View style={styles.macroCard}>
            <View style={styles.macroFilaSuperior}>
              <View style={styles.macroNombreFila}>
                <View style={[styles.macroPunto, { backgroundColor: COLORES_MACROS.proteina }]} />
                <Text style={styles.macroNombre}>PROTEÍNA</Text>
              </View>
            </View>
            <Text style={styles.macroNumeroGrande}>{pctProteina}%</Text>
            <View style={styles.miniBarTrack}>
              <View style={[styles.miniBarFill, { width: `${pctProteina}%`, backgroundColor: COLORES_MACROS.proteina }]} />
            </View>
            <Text style={styles.macroGramos}>~{gramosProteina} G / DÍA</Text>
          </View>

          {/* Fila Carbohidratos */}
          <View style={styles.macroCard}>
            <View style={styles.macroFilaSuperior}>
              <View style={styles.macroNombreFila}>
                <View style={[styles.macroPunto, { backgroundColor: COLORES_MACROS.carbos }]} />
                <Text style={styles.macroNombre}>CARBOHIDRATOS</Text>
              </View>
            </View>
            <Text style={styles.macroNumeroGrande}>{pctCarbos}%</Text>
            <View style={styles.miniBarTrack}>
              <View style={[styles.miniBarFill, { width: `${pctCarbos}%`, backgroundColor: COLORES_MACROS.carbos }]} />
            </View>
            <Text style={styles.macroGramos}>~{gramosCarbos} G / DÍA</Text>
          </View>

          {/* Fila Grasas */}
          <View style={styles.macroCard}>
            <View style={styles.macroFilaSuperior}>
              <View style={styles.macroNombreFila}>
                <View style={[styles.macroPunto, { backgroundColor: COLORES_MACROS.grasas }]} />
                <Text style={styles.macroNombre}>GRASAS SALUDABLES</Text>
              </View>
            </View>
            <Text style={styles.macroNumeroGrande}>{pctGrasas}%</Text>
            <View style={styles.miniBarTrack}>
              <View style={[styles.miniBarFill, { width: `${pctGrasas}%`, backgroundColor: COLORES_MACROS.grasas }]} />
            </View>
            <Text style={styles.macroGramos}>~{gramosGrasas} G / DÍA</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  headerCentrado: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tituloNegroCentrado: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Fila principal
  contenidoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },

  // Donut
  donutWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centroDonut: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriasValor: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  caloriasUnidad: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginTop: 1,
  },

  // Leyenda de Macros Minimalista
  leyendaColumna: {
    flex: 1,
    gap: 8,
  },
  macroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  macroFilaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroNombreFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroPunto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroNombre: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  macroNumeroGrande: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    marginVertical: 2,
    letterSpacing: 0.3,
  },
  macroPorcentaje: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  miniBarTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
    overflow: 'hidden',
    marginVertical: 4,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  macroGramos: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
});
