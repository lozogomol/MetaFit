import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ColoresApp, ColoresMetricas } from '../theme/colors';
import { useStore } from '../services/useStore';

interface AlimentoItem {
  id: string;
  nombre: string;
  categoriaTipo: 'proteina' | 'carbo' | 'grasa' | 'verdura' | 'fruta';
  categoria: string;
  calorias: string;
  beneficio: string;
  imagen: string;
}

interface ResultadoEscaneo {
  plato: string;
  calorias: number;
  proteina: string;
  carbos: string;
  grasas: string;
  calidad: string;
  micronutrientes: string;
  veredicto: string;
}

export const PantallaNutricion = ({ route }: any) => {
  const usuarioActual = useStore((state) => state.usuarioActual);

  const [modalMenuVisible, setModalMenuVisible] = useState(false);
  const [modalCamaraVisible, setModalCamaraVisible] = useState(false);
  const [analizandoFoto, setAnalizandoFoto] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [resultadoEscaneo, setResultadoEscaneo] = useState<ResultadoEscaneo | null>(null);
  const [alimentoDetalle, setAlimentoDetalle] = useState<AlimentoItem | null>(null);

  // Si viene del Dashboard con la orden de abrir cámara
  useEffect(() => {
    if (route?.params?.abrirCamara) {
      setModalCamaraVisible(true);
    }
  }, [route?.params?.abrirCamara]);

  // Alimentos recomendados: organizados por categorías con frutas y verduras por separado
  const alimentos: AlimentoItem[] = [
    // 1. PROTEÍNAS
    {
      id: '1',
      nombre: 'Pechuga de Pollo',
      categoriaTipo: 'proteina',
      categoria: 'Proteína Magra',
      calorias: '~165 kcal / 100g',
      beneficio: '31g de proteína pura para construir y reparar masa muscular.',
      imagen: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
    },
    {
      id: '2',
      nombre: 'Salmón a la Plancha',
      categoriaTipo: 'proteina',
      categoria: 'Proteína & Omega 3',
      calorias: '~206 kcal / 100g',
      beneficio: 'Omega-3 EPA y DHA con proteína de máxima asimilación biológica.',
      imagen: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
    },

    // 2. CARBOHIDRATOS
    {
      id: '3',
      nombre: 'Puré de Batata / Papa',
      categoriaTipo: 'carbo',
      categoria: 'Carbohidrato Complejo',
      calorias: '~90 kcal / 100g',
      beneficio: 'Recarga glucógeno muscular rápidamente sin pesadez estomacal.',
      imagen: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&q=80',
    },
    {
      id: '4',
      nombre: 'Avena Integral',
      categoriaTipo: 'carbo',
      categoria: 'Fibra & Saciedad',
      calorias: '~120 kcal / taza',
      beneficio: 'Energía sostenida y betaglucanos para regular el apetito diurno.',
      // Foto fidedigna de avena natural en tazón
      imagen: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=400&q=80',
    },

    // 3. GRASAS SALUDABLES
    {
      id: '5',
      nombre: 'Aguacate',
      categoriaTipo: 'grasa',
      categoria: 'Grasas Saludables',
      calorias: '~160 kcal / 100g',
      beneficio: 'Ácidos grasos monoinsaturados esenciales para el balance hormonal.',
      imagen: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80',
    },
    {
      id: '6',
      nombre: 'Nueces & Almendras',
      categoriaTipo: 'grasa',
      categoria: 'Grasas Saludables',
      calorias: '~180 kcal / 30g',
      beneficio: 'Vitamina E, magnesio y grasas cardiosaludables protectoras.',
      imagen: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=400&q=80',
    },

    // 4. VERDURAS (Por separado)
    {
      id: '7',
      nombre: 'Espinacas Crudas',
      categoriaTipo: 'verdura',
      categoria: 'Verduras Verdes',
      calorias: '~23 kcal / 100g',
      beneficio: 'Hierro vegetal, clorofila y magnesio alcalinizante.',
      imagen: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
    },
    {
      id: '8',
      nombre: 'Brócoli al Vapor',
      categoriaTipo: 'verdura',
      categoria: 'Verduras Crucíferas',
      calorias: '~35 kcal / 100g',
      beneficio: 'Sulforafano antioxidante y fibra prebiótica digestiva.',
      imagen: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
    },

    // 5. FRUTAS (Por separado)
    {
      id: '9',
      nombre: 'Manzana Fresca',
      categoriaTipo: 'fruta',
      categoria: 'Frutas Frescas',
      calorias: '~52 kcal / 100g',
      beneficio: 'Pectina reguladora y quercetina antioxidante para saciedad.',
      imagen: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
    },
    {
      id: '10',
      nombre: 'Naranja / Cítricos',
      categoriaTipo: 'fruta',
      categoria: 'Frutas Cítricas',
      calorias: '~47 kcal / 100g',
      beneficio: 'Vitamina C que estimula colágeno en articulaciones e inmunidad.',
      imagen: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&q=80',
    },
  ];

  const alimentosProteina = alimentos.filter((a) => a.categoriaTipo === 'proteina');
  const alimentosCarbos = alimentos.filter((a) => a.categoriaTipo === 'carbo');
  const alimentosGrasas = alimentos.filter((a) => a.categoriaTipo === 'grasa');
  const alimentosVerduras = alimentos.filter((a) => a.categoriaTipo === 'verdura');
  const alimentosFrutas = alimentos.filter((a) => a.categoriaTipo === 'fruta');

  // Acciones de Cámara e Imagen
  const _abrirCamara = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se requiere acceso a la cámara para analizar alimentos.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets[0]?.uri) {
      _procesarAnalisisIA(resultado.assets[0].uri);
    }
  };

  const _elegirGaleria = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets[0]?.uri) {
      _procesarAnalisisIA(resultado.assets[0].uri);
    }
  };

  const _probarPlatoDemo = () => {
    _procesarAnalisisIA('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80');
  };

  const _procesarAnalisisIA = async (uri: string) => {
    setFotoCapturada(uri);
    setAnalizandoFoto(true);
    setResultadoEscaneo(null);

    setTimeout(() => {
      setAnalizandoFoto(false);
      setResultadoEscaneo({
        plato: 'Pechuga de Pollo con Batata y Ensalada Mixta',
        calorias: 485,
        proteina: '42g (35%)',
        carbos: '48g (40%)',
        grasas: '13g (25%)',
        calidad: 'A+ (Densidad Óptima)',
        micronutrientes: 'Alto en Vitamina C, Hierro, Potasio y Betacarotenos',
        veredicto:
          'Plato balanceado ideal. Provee suficiente proteína magra para reconstrucción de fibras y carbohidratos complejos para restauración de glucógeno.',
      });
    }, 1600);
  };

  // Renderizador de tarjeta de alimento horizontal (una abajo de otra)
  const renderTarjetaAlimento = (item: AlimentoItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.tarjetaAlimentoFila}
      activeOpacity={0.88}
      onPress={() => setAlimentoDetalle(item)}
    >
      <Image source={{ uri: item.imagen }} style={styles.imagenAlimentoFila} resizeMode="cover" />

      <View style={styles.infoAlimentoFila}>
        <View style={styles.filaSuperiorAlimento}>
          <Text style={styles.nombreAlimento} numberOfLines={1}>
            {item.nombre.toUpperCase()}
          </Text>
          <Text style={styles.caloriasAlimento}>
            {item.calorias.toUpperCase()}
          </Text>
        </View>
        <View style={styles.miniBarraTrack}>
          <View style={styles.miniBarraFill} />
        </View>
        <Text style={styles.beneficioAlimento} numberOfLines={2}>
          {item.beneficio}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CABECERA MINIMALISTA: NUTRICIÓN + ÍCONO 3 LÍNEAS + AVATAR */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.saludoNegro}>NUTRICIÓN</Text>
          </View>
          <View style={styles.headerAcciones}>
            {/* Ícono circular de 3 líneas (44x44) */}
            <TouchableOpacity
              style={styles.botonMenuLineas}
              activeOpacity={0.8}
              onPress={() => setModalMenuVisible(true)}
              accessibilityLabel="Opciones de nutrición"
            >
              <Ionicons name="reorder-three-outline" size={26} color="#000000" />
            </TouchableOpacity>

            {/* Avatar circular (44x44) idéntico a PantallaEstado */}
            <View style={styles.avatarMiniContenedor}>
              {usuarioActual?.avatarUri ? (
                <Image source={{ uri: usuarioActual.avatarUri }} style={styles.avatarMiniFoto} />
              ) : (
                <Ionicons name="person" size={20} color="#000000" />
              )}
            </View>
          </View>
        </View>

        {/* SECCIÓN 1: ALIMENTOS RECOMENDADOS (TÍTULO CENTRADO Y TARJETAS APILADAS UNA ABAJO DE OTRA) */}
        <View style={styles.seccionCard}>
          <Text style={styles.cardTituloNegroCentrado}>ALIMENTOS RECOMENDADOS</Text>

          {/* 1. PROTEÍNAS */}
          <Text style={styles.categoriaSubtituloCentrado}>PROTEÍNAS</Text>
          <View style={styles.listaAlimentosColumna}>
            {alimentosProteina.map(renderTarjetaAlimento)}
          </View>

          {/* 2. CARBOHIDRATOS */}
          <Text style={styles.categoriaSubtituloCentrado}>CARBOHIDRATOS</Text>
          <View style={styles.listaAlimentosColumna}>
            {alimentosCarbos.map(renderTarjetaAlimento)}
          </View>

          {/* 3. GRASAS SALUDABLES */}
          <Text style={styles.categoriaSubtituloCentrado}>GRASAS SALUDABLES</Text>
          <View style={styles.listaAlimentosColumna}>
            {alimentosGrasas.map(renderTarjetaAlimento)}
          </View>

          {/* 4. VERDURAS (POR SEPARADO) */}
          <Text style={styles.categoriaSubtituloCentrado}>VERDURAS</Text>
          <View style={styles.listaAlimentosColumna}>
            {alimentosVerduras.map(renderTarjetaAlimento)}
          </View>

          {/* 5. FRUTAS (POR SEPARADO) */}
          <Text style={styles.categoriaSubtituloCentrado}>FRUTAS</Text>
          <View style={styles.listaAlimentosColumna}>
            {alimentosFrutas.map(renderTarjetaAlimento)}
          </View>
        </View>

        {/* SECCIÓN 2: APORTE NUTRICIONAL (EXACTO MISMO ESTILO QUE CONSUMO DE CALORÍAS) */}
        <View style={styles.seccionCard}>
          <Text style={styles.cardTituloNegroCentrado}>APORTE NUTRICIONAL</Text>

          <View style={styles.aporteListaMacros}>
            {/* 1. PROTEÍNA */}
            <View style={styles.macroCardAporte}>
              <View style={styles.macroFilaSuperior}>
                <View style={styles.macroNombreFila}>
                  <View style={[styles.macroPunto, { backgroundColor: ColoresMetricas.proteina }]} />
                  <Text style={styles.macroNombre}>PROTEÍNA</Text>
                </View>
                <Text style={styles.macroPorcentaje}>35%</Text>
              </View>
              <Text style={styles.macroNumeroGrande}>~175 G / DÍA (4 KCAL/G)</Text>
              <View style={styles.miniBarTrack}>
                <View style={[styles.miniBarFill, { width: '35%', backgroundColor: ColoresMetricas.proteina }]} />
              </View>
              <Text style={styles.macroGramos}>
                DEBE CONSUMIR: PECHUGA DE POLLO • SALMÓN • HUEVOS • PESCADO
              </Text>
            </View>

            {/* 2. CARBOHIDRATOS */}
            <View style={styles.macroCardAporte}>
              <View style={styles.macroFilaSuperior}>
                <View style={styles.macroNombreFila}>
                  <View style={[styles.macroPunto, { backgroundColor: ColoresMetricas.carbos }]} />
                  <Text style={styles.macroNombre}>CARBOHIDRATOS</Text>
                </View>
                <Text style={styles.macroPorcentaje}>40%</Text>
              </View>
              <Text style={styles.macroNumeroGrande}>~200 G / DÍA (4 KCAL/G)</Text>
              <View style={styles.miniBarTrack}>
                <View style={[styles.miniBarFill, { width: '40%', backgroundColor: ColoresMetricas.carbos }]} />
              </View>
              <Text style={styles.macroGramos}>
                DEBE CONSUMIR: PURÉ DE BATATA/PAPA • AVENA INTEGRAL • ARROZ
              </Text>
            </View>

            {/* 3. GRASAS SALUDABLES */}
            <View style={styles.macroCardAporte}>
              <View style={styles.macroFilaSuperior}>
                <View style={styles.macroNombreFila}>
                  <View style={[styles.macroPunto, { backgroundColor: ColoresMetricas.grasa }]} />
                  <Text style={styles.macroNombre}>GRASAS SALUDABLES</Text>
                </View>
                <Text style={styles.macroPorcentaje}>25%</Text>
              </View>
              <Text style={styles.macroNumeroGrande}>~55 G / DÍA (9 KCAL/G)</Text>
              <View style={styles.miniBarTrack}>
                <View style={[styles.miniBarFill, { width: '25%', backgroundColor: ColoresMetricas.grasa }]} />
              </View>
              <Text style={styles.macroGramos}>
                DEBE CONSUMIR: AGUACATE MADURO • NUECES & ALMENDRAS • ACEITE DE OLIVA
              </Text>
            </View>

            {/* 4. VERDURAS */}
            <View style={styles.macroCardAporte}>
              <View style={styles.macroFilaSuperior}>
                <View style={styles.macroNombreFila}>
                  <View style={[styles.macroPunto, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.macroNombre}>VERDURAS</Text>
                </View>
                <Text style={styles.macroPorcentaje}>FIBRA</Text>
              </View>
              <Text style={styles.macroNumeroGrande}>2 A 3 PORCIONES / DÍA</Text>
              <View style={styles.miniBarTrack}>
                <View style={[styles.miniBarFill, { width: '100%', backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.macroGramos}>
                DEBE CONSUMIR: ESPINACAS CRUDAS • BRÓCOLI AL VAPOR • ESPÁRRAGOS
              </Text>
            </View>

            {/* 5. FRUTAS */}
            <View style={styles.macroCardAporte}>
              <View style={styles.macroFilaSuperior}>
                <View style={styles.macroNombreFila}>
                  <View style={[styles.macroPunto, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.macroNombre}>FRUTAS</Text>
                </View>
                <Text style={styles.macroPorcentaje}>ANTIOXIDANTES</Text>
              </View>
              <Text style={styles.macroNumeroGrande}>2 PORCIONES / DÍA</Text>
              <View style={styles.miniBarTrack}>
                <View style={[styles.miniBarFill, { width: '100%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={styles.macroGramos}>
                DEBE CONSUMIR: MANZANA FRESCA • NARANJA / CÍTRICOS • FRUTOS ROJOS
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* MODAL DEL MENÚ DE OPCIONES (SOLO ANALIZAR COMIDA CENTRADO CON ÍCONO A LA IZQUIERDA) */}
      <Modal
        visible={modalMenuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalMenuVisible(false)}
      >
        <View style={styles.modalFondoOscuro}>
          <View style={styles.modalSheetBlanco}>
            {/* Header del modal con Título Centrado y X en círculo exacto de 44x44 */}
            <View style={styles.modalSheetHeader}>
              <View style={styles.balanceadorEspacio} />
              <Text style={styles.modalSheetTituloCentrado}>OPCIONES DE NUTRICIÓN</Text>
              <TouchableOpacity
                onPress={() => setModalMenuVisible(false)}
                style={styles.botonCerrarCircular}
                activeOpacity={0.8}
                accessibilityLabel="Cerrar modal"
              >
                <Ionicons name="close" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* ÚNICA OPCIÓN: Tarjeta con ícono de comida a la izquierda, título centrado e indicación bien puntual */}
            <TouchableOpacity
              style={styles.tarjetaAnalizarComida}
              activeOpacity={0.88}
              onPress={() => {
                setModalMenuVisible(false);
                setModalCamaraVisible(true);
              }}
            >
              <View style={styles.filaAnalizarComidaHeader}>
                <View style={styles.iconoComidaCaja}>
                  <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.tituloAnalizarComidaCentrado}>ANALIZAR COMIDA</Text>
                <View style={{ width: 40 }} />
              </View>
              <Text style={styles.indicacionPuntual}>
                Toma una foto clara a tu plato o sube una imagen de la galería para calcular las calorías y macronutrientes al instante.
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ESCÁNER DE CALORÍAS CON CÁMARA */}
      <Modal
        visible={modalCamaraVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalCamaraVisible(false)}
      >
        <View style={styles.modalFondoOscuro}>
          <View style={[styles.modalSheetBlanco, { maxHeight: '90%' }]}>
            <View style={styles.modalSheetHeader}>
              <View style={styles.balanceadorEspacio} />
              <Text style={styles.modalSheetTituloCentrado}>ESCÁNER DE CALORÍAS IA</Text>
              <TouchableOpacity
                onPress={() => setModalCamaraVisible(false)}
                style={styles.botonCerrarCircular}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {!fotoCapturada ? (
              <View style={styles.seleccionFotoCaja}>
                <Ionicons name="restaurant-outline" size={56} color="#000000" style={{ marginBottom: 12 }} />
                <Text style={styles.seleccionFotoTitulo}>APUNTA A TU PLATO</Text>
                <Text style={styles.seleccionFotoSubtitulo}>
                  Toma una foto clara a tu comida para que la IA identifique los macronutrientes y calorías estimadas.
                </Text>

                <View style={styles.botonesFotoRow}>
                  <TouchableOpacity style={styles.botonFotoAccion} onPress={_abrirCamara} activeOpacity={0.85}>
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                    <Text style={styles.botonFotoAccionTexto}>CÁMARA</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.botonFotoSecundario} onPress={_elegirGaleria} activeOpacity={0.85}>
                    <Ionicons name="images-outline" size={18} color="#000000" />
                    <Text style={styles.botonFotoSecundarioTexto}>GALERÍA</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.botonDemo} onPress={_probarPlatoDemo} activeOpacity={0.8}>
                  <Ionicons name="flash-outline" size={14} color={ColoresApp.primario} />
                  <Text style={styles.botonDemoTexto}>PROBAR PLATO DE EJEMPLO</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                <View style={styles.miraContainer}>
                  <Image source={{ uri: fotoCapturada }} style={styles.miraImagen} resizeMode="cover" />
                  {analizandoFoto && (
                    <View style={styles.overlayAnalisis}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.textoAnalisis}>PROCESANDO CON VISIÓN IA...</Text>
                    </View>
                  )}
                </View>

                {resultadoEscaneo && (
                  <View style={styles.resultadoCaja}>
                    <View style={styles.resultadoHeader}>
                      <Text style={styles.resultadoPlato}>{resultadoEscaneo.plato.toUpperCase()}</Text>
                      <View style={styles.caloriasBadgeGrande}>
                        <Text style={styles.caloriasNumero}>{resultadoEscaneo.calorias}</Text>
                        <Text style={styles.caloriasEtiqueta}>KCAL</Text>
                      </View>
                    </View>

                    <View style={styles.resultadoMacrosRow}>
                      <View style={styles.resultadoMacroItem}>
                        <Text style={styles.resultadoMacroValor}>{resultadoEscaneo.proteina}</Text>
                        <Text style={styles.resultadoMacroLabel}>PROTEÍNA</Text>
                      </View>
                      <View style={styles.resultadoMacroItem}>
                        <Text style={styles.resultadoMacroValor}>{resultadoEscaneo.carbos}</Text>
                        <Text style={styles.resultadoMacroLabel}>CARBOS</Text>
                      </View>
                      <View style={styles.resultadoMacroItem}>
                        <Text style={styles.resultadoMacroValor}>{resultadoEscaneo.grasas}</Text>
                        <Text style={styles.resultadoMacroLabel}>GRASAS</Text>
                      </View>
                    </View>

                    <View style={styles.veredictoBox}>
                      <Ionicons name="sparkles" size={16} color={ColoresApp.primario} style={{ marginRight: 8, marginTop: 2 }} />
                      <Text style={styles.veredictoTexto}>{resultadoEscaneo.veredicto}</Text>
                    </View>

                    <Text style={styles.micronutrientesTexto}>
                      <Text style={{ fontWeight: '900', color: '#000000' }}>MICRONUTRIENTES: </Text>
                      {resultadoEscaneo.micronutrientes}
                    </Text>

                    <TouchableOpacity
                      style={styles.botonReiniciarFoto}
                      onPress={() => {
                        setFotoCapturada(null);
                        setResultadoEscaneo(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={16} color={ColoresApp.primario} />
                      <Text style={styles.botonReiniciarFotoTexto}>ESCANEAR OTRO PLATO</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DETALLE DE ALIMENTO */}
      <Modal
        visible={alimentoDetalle !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAlimentoDetalle(null)}
      >
        <View style={styles.modalFondoOscuro}>
          <View style={styles.modalSheetBlanco}>
            {alimentoDetalle && (
              <>
                <View style={styles.modalSheetHeader}>
                  <View style={styles.balanceadorEspacio} />
                  <Text style={styles.modalSheetTituloCentrado}>{alimentoDetalle.nombre.toUpperCase()}</Text>
                  <TouchableOpacity
                    onPress={() => setAlimentoDetalle(null)}
                    style={styles.botonCerrarCircular}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={20} color="#000000" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detalleImagenContainer}>
                  <Image source={{ uri: alimentoDetalle.imagen }} style={styles.detalleImagen} resizeMode="cover" />
                </View>

                <View style={styles.kpiMiniCard}>
                  <View style={styles.statusBadgeRow}>
                    <View style={[styles.statusDot, { backgroundColor: ColoresApp.primario }]} />
                    <Text style={styles.statusBadgeTexto}>{alimentoDetalle.categoria.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.kpiNumeroGrande}>{alimentoDetalle.calorias.toUpperCase()}</Text>
                  <View style={styles.kpiBarraPista}>
                    <View style={[styles.kpiBarraLlenado, { width: '100%' }]} />
                  </View>
                  <Text style={styles.kpiSubtexto}>VALOR NUTRICIONAL DE ALTA DENSIDAD</Text>
                </View>

                <View style={styles.detalleBeneficioCaja}>
                  <Text style={styles.detalleBeneficioTitulo}>IMPACTO METABÓLICO</Text>
                  <Text style={styles.detalleBeneficioTexto}>{alimentoDetalle.beneficio}</Text>
                </View>

                <TouchableOpacity
                  style={styles.botonEntendido}
                  onPress={() => setAlimentoDetalle(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.botonEntendidoTexto}>CERRAR</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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

  // Cabecera Minimalista
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
  saludoNegro: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  headerAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonMenuLineas: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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

  // Secciones Principales
  seccionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTituloNegroCentrado: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  categoriaSubtituloCentrado: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Lista de Alimentos en Columna (Una abajo de otra)
  listaAlimentosColumna: {
    gap: 10,
    marginBottom: 16,
  },
  tarjetaAlimentoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  imagenAlimentoFila: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  infoAlimentoFila: {
    flex: 1,
    marginLeft: 12,
  },
  filaSuperiorAlimento: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  nombreAlimento: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.3,
    flex: 1,
    marginRight: 6,
  },
  caloriasAlimento: {
    fontSize: 10.5,
    fontWeight: '900',
    color: ColoresApp.primario,
    letterSpacing: 0.3,
  },
  miniBarraTrack: {
    height: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  miniBarraFill: {
    width: '100%',
    height: '100%',
    backgroundColor: ColoresApp.primario,
  },
  beneficioAlimento: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    fontWeight: '500',
  },

  // APORTE NUTRICIONAL: EXACTO MISMO ESTILO QUE CONSUMO DE CALORÍAS (macroCard)
  aporteListaMacros: {
    gap: 10,
  },
  macroCardAporte: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
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
    marginVertical: 3,
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
    borderRadius: 1.5,
    overflow: 'hidden',
    marginVertical: 4,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  macroGramos: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.2,
  },

  // Modales
  modalFondoOscuro: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheetBlanco: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: '85%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceadorEspacio: {
    width: 44,
    height: 44,
  },
  modalSheetTituloCentrado: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1.0,
    textAlign: 'center',
    flex: 1,
    textTransform: 'uppercase',
  },
  botonCerrarCircular: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tarjeta de Analizar Comida en Modal
  tarjetaAnalizarComida: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 18,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  filaAnalizarComidaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconoComidaCaja: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: ColoresApp.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloAnalizarComidaCentrado: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
    textAlign: 'center',
    flex: 1,
  },
  indicacionPuntual: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // Modal Detalle Alimento
  kpiMiniCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeTexto: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.6,
  },
  kpiNumeroGrande: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  kpiBarraPista: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  kpiBarraLlenado: {
    height: '100%',
    backgroundColor: ColoresApp.primario,
    borderRadius: 2,
  },
  kpiSubtexto: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  botonEntendido: {
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  botonEntendidoTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.0,
  },

  // Modal Cámara
  seleccionFotoCaja: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  seleccionFotoTitulo: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  seleccionFotoSubtitulo: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  botonesFotoRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 14,
  },
  botonFotoAccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ColoresApp.primario,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  botonFotoAccionTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  botonFotoSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  botonFotoSecundarioTexto: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  botonDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  botonDemoTexto: {
    fontSize: 11,
    color: ColoresApp.primario,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  miraContainer: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
  },
  miraImagen: {
    width: '100%',
    height: '100%',
  },
  overlayAnalisis: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoAnalisis: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 10,
    letterSpacing: 0.8,
  },
  resultadoCaja: {
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultadoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultadoPlato: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    flex: 1,
    marginRight: 10,
  },
  caloriasBadgeGrande: {
    alignItems: 'flex-end',
  },
  caloriasNumero: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  caloriasEtiqueta: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  resultadoMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultadoMacroItem: {
    alignItems: 'center',
  },
  resultadoMacroValor: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  resultadoMacroLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '800',
    marginTop: 2,
  },
  veredictoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  veredictoTexto: {
    fontSize: 11.5,
    color: '#000000',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  micronutrientesTexto: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 12,
  },
  botonReiniciarFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  botonReiniciarFotoTexto: {
    fontSize: 11.5,
    fontWeight: '900',
    color: ColoresApp.primario,
    letterSpacing: 0.6,
  },

  // Detalle Alimento
  detalleImagenContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#F1F5F9',
  },
  detalleImagen: {
    width: '100%',
    height: '100%',
  },
  detalleBeneficioCaja: {
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detalleBeneficioTitulo: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detalleBeneficioTexto: {
    fontSize: 12,
    color: '#000000',
    lineHeight: 17,
    fontWeight: '500',
  },
});
