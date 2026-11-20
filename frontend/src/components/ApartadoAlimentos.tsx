import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ColoresApp, ColoresMetricas } from '../theme/colors';
import { UsuarioLogic, CategoriaGrasa } from '../models/Usuario';

interface Props {
  usuario: UsuarioLogic;
}

interface ComidaSugerida {
  titulo: string;
  calorias: number;
  plato: string;
  ingredientes: string[];
  beneficio: string;
  proteina: string;
  carbos: string;
  grasas: string;
}

interface PlanNutricional {
  objetivo: string;
  subtitulo: string;
  caloriasMeta: number;
  colorObjetivo: string;
  macroProteina: number; // Porcentaje
  macroCarbos: number;
  macroGrasas: number;
  alimentosEstrella: string[];
  alimentosEvitar: string[];
  comidas: {
    desayuno: ComidaSugerida;
    almuerzo: ComidaSugerida;
    snack: ComidaSugerida;
    cena: ComidaSugerida;
  };
}

export const ApartadoAlimentos: React.FC<Props> = ({ usuario }) => {
  const [comidaActiva, setComidaActiva] = useState<'desayuno' | 'almuerzo' | 'snack' | 'cena'>('desayuno');

  const imc = usuario.imc;
  const grasa = usuario.porcentajeGrasa;
  const peso = usuario.peso;
  const estatura = usuario.estatura;
  const edad = usuario.edad;
  const esHombre = usuario.genero === 'M';

  // Cálculo TMB (Mifflin-St Jeor) + Factor Actividad (~1.4)
  const tmb = esHombre
    ? 10 * peso + 6.25 * estatura - 5 * edad + 5
    : 10 * peso + 6.25 * estatura - 5 * edad - 161;
  const caloriasMantenimiento = Math.round(tmb * 1.4);

  // Meta de agua diaria (35 ml / kg)
  const litrosAgua = ((peso * 35) / 1000).toFixed(1);

  // Determinar plan personalizado según IMC y % Grasa
  let plan: PlanNutricional;

  if (imc < 18.5) {
    // BAJO PESO -> SUPERÁVIT CALÓRICO SALUDABLE
    const caloriasMeta = caloriasMantenimiento + 400;
    plan = {
      objetivo: 'Superávit Calórico & Ganancia Muscular',
      subtitulo: 'Aumentar peso saludable con densidad nutricional y proteína',
      caloriasMeta,
      colorObjetivo: '#29B6F6',
      macroProteina: 25,
      macroCarbos: 55,
      macroGrasas: 20,
      alimentosEstrella: ['Avena integral', 'Plátano', 'Huevos enteros', 'Mantequilla de maní', 'Arroz integral', 'Pechuga de pollo', 'Aguacate', 'Frutos secos'],
      alimentosEvitar: ['Comida chatarra vacía', 'Gaseosas azucaradas', 'Saltarse comidas'],
      comidas: {
        desayuno: {
          titulo: 'Desayuno Energético',
          calorias: Math.round(caloriasMeta * 0.28),
          plato: 'Tazón de avena con plátano, crema de maní y 3 huevos revueltos',
          ingredientes: ['80g de avena en hojuelas', '1 plátano maduro', '2 cdas de mantequilla de maní', '3 huevos', '1 taza de leche o bebida vegetal'],
          beneficio: 'Aporte de carbohidratos complejos y grasas saludables para iniciar el día con excedente calórico.',
          proteina: '32g',
          carbos: '68g',
          grasas: '22g',
        },
        almuerzo: {
          titulo: 'Almuerzo Anabólico',
          calorias: Math.round(caloriasMeta * 0.35),
          plato: 'Pechuga de pollo a la plancha con arroz integral y aguacate',
          ingredientes: ['180g de pechuga de pollo', '1.5 tazas de arroz integral', '1/2 aguacate', 'Ensalada fresca con aceite de oliva'],
          beneficio: 'Alta proteína magra combinada con carbohidratos densos para reconstrucción y crecimiento muscular.',
          proteina: '45g',
          carbos: '75g',
          grasas: '20g',
        },
        snack: {
          titulo: 'Snack Hipercalórico',
          calorias: Math.round(caloriasMeta * 0.15),
          plato: 'Batido de proteína o yogur griego con frutos secos y miel',
          ingredientes: ['1 taza de yogur griego entero', '30g de nueces o almendras', '1 cda de miel pura', '1 manzana o frutos rojos'],
          beneficio: 'Snack rápido, denso y fácil de digerir entre comidas.',
          proteina: '22g',
          carbos: '35g',
          grasas: '14g',
        },
        cena: {
          titulo: 'Cena Nutritiva',
          calorias: Math.round(caloriasMeta * 0.22),
          plato: 'Filete de salmón o ternera magra con puré de batata y espárragos',
          ingredientes: ['160g de salmón o ternera', '200g de batata o camote al vapor', 'Espárragos y brócoli salteados'],
          beneficio: 'Omega 3 y proteína de lenta absorción para favorecer la recuperación nocturna.',
          proteina: '38g',
          carbos: '45g',
          grasas: '18g',
        },
      },
    };
  } else if (imc < 25.0 && grasa < (esHombre ? 18.0 : 25.0)) {
    // PESO NORMAL / FITNESS -> MANTENIMIENTO Y RENDIMIENTO
    const caloriasMeta = caloriasMantenimiento;
    plan = {
      objetivo: 'Mantenimiento & Definición Atlética',
      subtitulo: 'Equilibrio perfecto para rendir al máximo y preservar masa magra',
      caloriasMeta,
      colorObjetivo: '#00E676',
      macroProteina: 30,
      macroCarbos: 45,
      macroGrasas: 25,
      alimentosEstrella: ['Huevos poché', 'Pechuga de pavo', 'Quinoa', 'Salmón', 'Batata / Camote', 'Arándanos', 'Espinacas frescas', 'Aceite de oliva'],
      alimentosEvitar: ['Ultraprocesados', 'Frituras pesadas', 'Harinas hiper-refinadas'],
      comidas: {
        desayuno: {
          titulo: 'Desayuno Equilibrado',
          calorias: Math.round(caloriasMeta * 0.26),
          plato: 'Tostadas integrales con aguacate, 2 huevos poché y café/té verde',
          ingredientes: ['2 rebanadas de pan integral de masa madre', '1/3 de aguacate', '2 huevos grandes', 'Fruta fresca de temporada'],
          beneficio: 'Suministro constante de glucosa y grasas monoinsaturadas para concentración y energía limpia.',
          proteina: '22g',
          carbos: '38g',
          grasas: '16g',
        },
        almuerzo: {
          titulo: 'Almuerzo Fitness',
          calorias: Math.round(caloriasMeta * 0.36),
          plato: 'Bowl de quinoa con pechuga de pollo, garbanzos y vegetales salteados',
          ingredientes: ['150g de pechuga de pollo', '1 taza de quinoa cocida', '1/3 taza de garbanzos', 'Brócoli, pimiento y calabacín'],
          beneficio: 'Perfil completo de aminoácidos esenciales y fibra digestiva.',
          proteina: '42g',
          carbos: '55g',
          grasas: '12g',
        },
        snack: {
          titulo: 'Snack Revitalizante',
          calorias: Math.round(caloriasMeta * 0.14),
          plato: 'Yogur griego bajo en grasa con arándanos y semillas de chía',
          ingredientes: ['200g de yogur griego natural', '1/2 taza de arándanos frescos', '1 cda de semillas de chía'],
          beneficio: 'Antioxidantes y calcio con mínimo impacto glucémico.',
          proteina: '20g',
          carbos: '18g',
          grasas: '5g',
        },
        cena: {
          titulo: 'Cena Liviana y Saciativa',
          calorias: Math.round(caloriasMeta * 0.24),
          plato: 'Pescado blanco o atún con ensalada mediterránea de hojas verdes',
          ingredientes: ['180g de merluza, corvina o atún', 'Ensalada grande de espinacas, tomate cherry y pepino', '1 cdta de aceite de oliva'],
          beneficio: 'Cena ligera que no sobrecarga la digestión antes de dormir.',
          proteina: '35g',
          carbos: '15g',
          grasas: '10g',
        },
      },
    };
  } else {
    // SOBREPESO / OBESIDAD O GRASA ELEVADA -> DÉFICIT CONTROLADO
    const caloriasMeta = Math.max(1400, caloriasMantenimiento - 450);
    plan = {
      objetivo: 'Déficit Calórico & Quema de Grasa',
      subtitulo: 'Alta saciedad con proteínas magras y fibra para acelerar la pérdida grasa',
      caloriasMeta,
      colorObjetivo: '#FF9100',
      macroProteina: 38,
      macroCarbos: 35,
      macroGrasas: 27,
      alimentosEstrella: ['Claras de huevo', 'Pechuga de pavo', 'Pescados blancos', 'Brócoli y coliflor', 'Pepino', 'Frutos rojos', 'Chía', 'Té verde'],
      alimentosEvitar: ['Azúcar y jarabes', 'Bebidas alcohólicas', 'Snacks ultraprocesados', 'Pan blanco'],
      comidas: {
        desayuno: {
          titulo: 'Desayuno Saciativo',
          calorias: Math.round(caloriasMeta * 0.25),
          plato: 'Omelette de 1 huevo entero + 2 claras con espinacas y champiñones',
          ingredientes: ['1 huevo entero + 2 claras', '1 taza de espinacas frescas', 'Champiñones salteados', '1 rebanada fina de pan centeno'],
          beneficio: 'Pico mínimo de insulina y máxima sensación de saciedad para evitar antojos.',
          proteina: '24g',
          carbos: '18g',
          grasas: '9g',
        },
        almuerzo: {
          titulo: 'Almuerzo Quema-Grasa',
          calorias: Math.round(caloriasMeta * 0.38),
          plato: 'Pechuga de pollo o pavo con abundante ensalada verde y lentejas',
          ingredientes: ['170g de pechuga de pollo a la plancha', '1/2 taza de lentejas cocidas', 'Gran ensalada de lechuga, pepino, tomate y limón'],
          beneficio: 'Gran volumen con pocas calorías, alto en fibra vegetal y proteína magra.',
          proteina: '40g',
          carbos: '35g',
          grasas: '8g',
        },
        snack: {
          titulo: 'Snack Control de Apetito',
          calorias: Math.round(caloriasMeta * 0.12),
          plato: 'Manzana verde con un puñado pequeño de almendras tostadas',
          ingredientes: ['1 manzana verde en rodajas', '12 almendras naturales', 'Infusión de té verde frío o caliente'],
          beneficio: 'Polifenoles y grasas buenas que reducen el apetito de media tarde.',
          proteina: '5g',
          carbos: '22g',
          grasas: '8g',
        },
        cena: {
          titulo: 'Cena Détox y Liviana',
          calorias: Math.round(caloriasMeta * 0.25),
          plato: 'Filete de pescado blanco al vapor con crema o salteado de calabacín',
          ingredientes: ['180g de pescado blanco (merluza o tilapia)', 'Calabacín y espárragos al vapor', 'Chorro de limón y ajo en polvo'],
          beneficio: 'Proteína pura sin carbohidratos nocturnos para optimizar la lipólisis durante el sueño.',
          proteina: '36g',
          carbos: '10g',
          grasas: '5g',
        },
      },
    };
  }

  const comidaSeleccionada = plan.comidas[comidaActiva];

  return (
    <View style={styles.container}>
      {/* Header del apartado */}
      <View style={styles.sectionHeader}>
        <View style={styles.iconTitleRow}>
          <View style={[styles.iconBadge, { backgroundColor: plan.colorObjetivo + '20' }]}>
            <Ionicons name="nutrition" size={22} color={plan.colorObjetivo} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.sectionTitle}>ALIMENTACIÓN RECOMENDADA</Text>
            <Text style={styles.sectionSubtitle}>Personalizada según tu IMC ({imc.toFixed(1)}) y {grasa}% grasa</Text>
          </View>
        </View>
      </View>

      {/* Tarjeta de Resumen del Objetivo */}
      <View style={styles.planBanner}>
        <View style={styles.badgeObjetivo}>
          <View style={[styles.dotStatus, { backgroundColor: plan.colorObjetivo }]} />
          <Text style={[styles.textoObjetivo, { color: plan.colorObjetivo }]}>{plan.objetivo}</Text>
        </View>
        <Text style={styles.descObjetivo}>{plan.subtitulo}</Text>

        {/* Calorías y Macros */}
        <View style={styles.macrosContainer}>
          <View style={styles.caloriasBox}>
            <Text style={[styles.caloriasNumero, { color: ColoresMetricas.calorias }]}>{plan.caloriasMeta}</Text>
            <Text style={styles.caloriasLabel}>kcal / día sugeridas</Text>
          </View>
          <View style={styles.macroPillsRow}>
            <View style={styles.macroPill}>
              <Text style={[styles.macroPillValor, { color: ColoresMetricas.proteina }]}>{plan.macroProteina}%</Text>
              <Text style={styles.macroPillLabel}>Proteína</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={[styles.macroPillValor, { color: ColoresMetricas.carbos }]}>{plan.macroCarbos}%</Text>
              <Text style={styles.macroPillLabel}>Carbos</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={[styles.macroPillValor, { color: ColoresMetricas.grasa }]}>{plan.macroGrasas}%</Text>
              <Text style={styles.macroPillLabel}>Grasas</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Selector de Comidas (Pestañas) */}
      <View style={styles.tabsContainer}>
        {(['desayuno', 'almuerzo', 'snack', 'cena'] as const).map((c) => {
          const activa = comidaActiva === c;
          const label = c === 'desayuno' ? 'Desayuno' : c === 'almuerzo' ? 'Almuerzo' : c === 'snack' ? 'Snack' : 'Cena';
          const icon = c === 'desayuno' ? 'sunny-outline' : c === 'almuerzo' ? 'restaurant-outline' : c === 'snack' ? 'cafe-outline' : 'moon-outline';
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setComidaActiva(c)}
              style={[styles.tabButton, activa && styles.tabButtonActivo]}
              activeOpacity={0.7}
            >
              <Ionicons name={icon as any} size={16} color={activa ? '#FFFFFF' : ColoresApp.textoSecundario} />
              <Text style={[styles.tabText, activa && styles.tabTextActivo]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Detalle de la Comida Seleccionada */}
      <View style={styles.comidaCard}>
        <View style={styles.comidaCardHeader}>
          <Text style={styles.comidaTitulo}>{comidaSeleccionada.titulo}</Text>
          <View style={styles.caloriasTag}>
            <Ionicons name="flame" size={14} color={ColoresMetricas.calorias} />
            <Text style={styles.caloriasTagTexto}>~{comidaSeleccionada.calorias} kcal</Text>
          </View>
        </View>

        <Text style={styles.platoNombre}>{comidaSeleccionada.plato}</Text>

        <View style={styles.separador} />

        <Text style={styles.subseccionTitulo}>Ingredientes sugeridos:</Text>
        {comidaSeleccionada.ingredientes.map((ing, idx) => (
          <View key={idx} style={styles.ingredienteFila}>
            <Ionicons name="checkmark-circle" size={16} color={plan.colorObjetivo} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.ingredienteTexto}>{ing}</Text>
          </View>
        ))}

        {/* Macros de esta comida */}
        <View style={styles.macrosComidaRow}>
          <View style={styles.macroComidaItem}>
            <Text style={[styles.macroComidaValor, { color: ColoresMetricas.proteina }]}>{comidaSeleccionada.proteina}</Text>
            <Text style={styles.macroComidaLabel}>Proteína</Text>
          </View>
          <View style={styles.macroComidaItem}>
            <Text style={[styles.macroComidaValor, { color: ColoresMetricas.carbos }]}>{comidaSeleccionada.carbos}</Text>
            <Text style={styles.macroComidaLabel}>Carbohidratos</Text>
          </View>
          <View style={styles.macroComidaItem}>
            <Text style={[styles.macroComidaValor, { color: ColoresMetricas.grasa }]}>{comidaSeleccionada.grasas}</Text>
            <Text style={styles.macroComidaLabel}>Grasas</Text>
          </View>
        </View>

        {/* Beneficio clave */}
        <View style={styles.beneficioBox}>
          <Ionicons name="bulb-outline" size={18} color="#FF9800" style={{ marginRight: 8 }} />
          <Text style={styles.beneficioTexto}>{comidaSeleccionada.beneficio}</Text>
        </View>
      </View>

      {/* Alimentos Estrella y Qué Evitar */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitulo}>Alimentos que debes priorizar:</Text>
        <View style={styles.tagsContainer}>
          {plan.alimentosEstrella.map((alim, idx) => (
            <View key={idx} style={styles.alimentoTag}>
              <Ionicons name="leaf" size={12} color="#00E676" style={{ marginRight: 4 }} />
              <Text style={styles.alimentoTagTexto}>{alim}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.tipsTitulo, { marginTop: 16, color: '#FF3B30' }]}>Qué moderar o evitar:</Text>
        <View style={styles.tagsContainer}>
          {plan.alimentosEvitar.map((alim, idx) => (
            <View key={idx} style={[styles.alimentoTag, styles.alimentoEvitarTag]}>
              <Ionicons name="close-circle" size={12} color="#FF3B30" style={{ marginRight: 4 }} />
              <Text style={[styles.alimentoTagTexto, { color: '#FF3B30' }]}>{alim}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Meta de Hidratación */}
      <View style={styles.aguaCard}>
        <Ionicons name="water" size={32} color="#29B6F6" />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.aguaTitulo}>Meta de Hidratación Diaria</Text>
          <Text style={styles.aguaTexto}>
            Para tus {peso} kg de peso corporal, tu cuerpo necesita mínimo <Text style={{ fontWeight: '900', color: '#29B6F6' }}>{litrosAgua} litros</Text> de agua al día para optimizar tu metabolismo.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: ColoresApp.texto,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: ColoresApp.textoSecundario,
    marginTop: 2,
  },
  planBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FAFBFC',
  },
  badgeObjetivo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dotStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  textoObjetivo: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  descObjetivo: {
    fontSize: 13,
    color: ColoresApp.textoSecundario,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  macrosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  caloriasBox: {
    alignItems: 'flex-start',
  },
  caloriasNumero: {
    fontSize: 22,
    fontWeight: '900',
    color: ColoresApp.texto,
  },
  caloriasLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ColoresApp.textoSecundario,
  },
  macroPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  macroPillValor: {
    fontSize: 13,
    fontWeight: '800',
    color: ColoresApp.primario,
  },
  macroPillLabel: {
    fontSize: 10,
    color: ColoresApp.textoSecundario,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F6F8',
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabButtonActivo: {
    backgroundColor: ColoresApp.primario,
    shadowColor: ColoresApp.primario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: ColoresApp.textoSecundario,
  },
  tabTextActivo: {
    color: '#FFFFFF',
  },
  comidaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FAFBFC',
  },
  comidaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  comidaTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: ColoresApp.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  caloriasTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ColoresMetricas.caloriasFondo,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  caloriasTagTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: ColoresMetricas.calorias,
  },
  platoNombre: {
    fontSize: 18,
    fontWeight: '900',
    color: ColoresApp.texto,
    lineHeight: 24,
    marginTop: 4,
  },
  separador: {
    height: 1,
    backgroundColor: '#F4F6F8',
    marginVertical: 14,
  },
  subseccionTitulo: {
    fontSize: 13,
    fontWeight: '800',
    color: ColoresApp.texto,
    marginBottom: 10,
  },
  ingredienteFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ingredienteTexto: {
    fontSize: 13,
    color: ColoresApp.texto,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  macrosComidaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FAFBFC',
    borderRadius: 14,
    paddingVertical: 12,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  macroComidaItem: {
    alignItems: 'center',
  },
  macroComidaValor: {
    fontSize: 15,
    fontWeight: '800',
    color: ColoresApp.texto,
  },
  macroComidaLabel: {
    fontSize: 11,
    color: ColoresApp.textoSecundario,
    fontWeight: '600',
    marginTop: 2,
  },
  beneficioBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  beneficioTexto: {
    fontSize: 12,
    color: '#8A5D00',
    flex: 1,
    fontWeight: '600',
    lineHeight: 16,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FAFBFC',
  },
  tipsTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00C853',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alimentoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  alimentoEvitarTag: {
    backgroundColor: '#FFEBEE',
  },
  alimentoTagTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  aguaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  aguaTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0277BD',
    marginBottom: 4,
  },
  aguaTexto: {
    fontSize: 12,
    color: '#01579B',
    lineHeight: 17,
    fontWeight: '500',
  },
});
