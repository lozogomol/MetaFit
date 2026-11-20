import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColoresApp } from '../theme/colors';
import Svg, { Line, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

export const PantallaCamaraPose = ({ route }: any) => {
  const navigation = useNavigation();
  const nombreEjercicio = route?.params?.nombreEjercicio || 'Ejercicio';

  const [repeticiones, setRepeticiones] = useState(0);
  const [mensajeFeedback, setMensajeFeedback] = useState('Posiciónate frente a la cámara...');
  const [colorFeedback, setColorFeedback] = useState('#FFFFFF');
  const [analizando, setAnalizando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const t = setTimeout(() => {
      setAnalizando(true);
      setMensajeFeedback('Cuerpo detectado. ¡Comienza!');
      setColorFeedback('#00E676');
      
      let reps = 0;
      let ticks = 0;
      interval = setInterval(() => {
        ticks++;
        if (ticks % 3 === 0) {
          setMensajeFeedback('Baja un poco más');
          setColorFeedback('#FF5252');
        } else {
          reps++;
          setRepeticiones(reps);
          setMensajeFeedback('¡Excelente!');
          setColorFeedback('#00E676');

          if (reps >= 12) {
            clearInterval(interval);
            setModalVisible(true);
          }
        }
      }, 4000);
    }, 2000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  const finalizarRutina = () => {
    setModalVisible(false);
    navigation.goBack();
  };

  const { width, height } = Dimensions.get('window');
  const cx = width / 2;
  const cy = height / 2;

  const points = {
    head: {x: cx, y: cy - 140},
    neck: {x: cx, y: cy - 90},
    lShoulder: {x: cx - 50, y: cy - 80},
    rShoulder: {x: cx + 50, y: cy - 80},
    lElbow: {x: cx - 70, y: cy - 20},
    rElbow: {x: cx + 70, y: cy - 20},
    lWrist: {x: cx - 60, y: cy + 40},
    rWrist: {x: cx + 60, y: cy + 40},
    lHip: {x: cx - 30, y: cy + 40},
    rHip: {x: cx + 30, y: cy + 40},
    lKnee: {x: cx - 35, y: cy + 130},
    rKnee: {x: cx + 35, y: cy + 130},
    lAnkle: {x: cx - 40, y: cy + 220},
    rAnkle: {x: cx + 40, y: cy + 220},
  };

  const connections = [
    [points.head, points.neck],
    [points.neck, points.lShoulder], [points.neck, points.rShoulder],
    [points.lShoulder, points.lElbow], [points.lElbow, points.lWrist],
    [points.rShoulder, points.rElbow], [points.rElbow, points.rWrist],
    [points.neck, points.lHip], [points.neck, points.rHip],
    [points.lHip, points.rHip],
    [points.lHip, points.lKnee], [points.lKnee, points.lAnkle],
    [points.rHip, points.rKnee], [points.rKnee, points.rAnkle],
  ];

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/Logo_Meta_Fit.png')} 
        style={[styles.cameraFeed, {opacity: analizando ? 0.3 : 0.1}]}
        resizeMode="contain"
      />
      
      {analizando && (
        <View style={StyleSheet.absoluteFill}>
          <Svg height="100%" width="100%">
            {connections.map((line, idx) => (
              <Line key={idx} x1={line[0].x} y1={line[0].y} x2={line[1].x} y2={line[1].y} stroke={colorFeedback} strokeWidth="4" strokeOpacity="0.6" strokeLinecap="round" />
            ))}
            {Object.values(points).map((pt, idx) => (
              <React.Fragment key={`pt-${idx}`}>
                <Circle cx={pt.x} cy={pt.y} r="9" stroke={colorFeedback} strokeWidth="3" />
                <Circle cx={pt.x} cy={pt.y} r="6" fill="#FFF" />
              </React.Fragment>
            ))}
          </Svg>
        </View>
      )}

      {/* Overlays */}
      <View style={styles.topGradient} />
      <View style={styles.bottomGradient} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.titleArea}>
          <Text style={styles.smallText}>ANALIZANDO</Text>
          <Text style={styles.exerciseName}>{nombreEjercicio}</Text>
        </View>
        <View style={[styles.aiBadge, {borderColor: analizando ? '#00E676' : 'orange', backgroundColor: analizando ? 'rgba(0,230,118,0.2)' : 'rgba(255,165,0,0.2)'}]}>
          <Ionicons name={analizando ? "flash" : "hourglass"} size={12} color={analizando ? '#00E676' : 'orange'} />
          <Text style={[styles.aiBadgeText, {color: analizando ? '#00E676' : 'orange'}]}>{analizando ? 'IA ACTIVA' : 'CALIBRANDO'}</Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <View style={[styles.feedbackBox, {backgroundColor: colorFeedback + '26', borderColor: colorFeedback + '80'}]}>
          <Text style={[styles.feedbackText, {color: colorFeedback}]}>{mensajeFeedback.toUpperCase()}</Text>
        </View>

        <View style={styles.statsRow}>
          <View>
            <Text style={styles.smallText}>REPETICIONES</Text>
            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
              <Text style={styles.repCount}>{repeticiones}</Text>
              <Text style={styles.repTotal}> / 12</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.stopBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="stop" size={18} color="#000" />
            <Text style={styles.stopText}>DETENER</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¡Rutina completada!</Text>
            <Ionicons name="checkmark-circle" size={60} color="#00E676" style={{marginVertical: 16}} />
            <Text style={styles.modalStat}>Repeticiones: {repeticiones}/12</Text>
            <Text style={styles.modalSubStat}>Técnica: 85/100</Text>
            <Text style={styles.modalSuccessText}>¡Muy buen trabajo!</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={finalizarRutina}>
              <Text style={styles.modalBtnText}>FINALIZAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraFeed: { width: '100%', height: '100%', position: 'absolute' },
  topGradient: { position: 'absolute', top: 0, width: '100%', height: 120, backgroundColor: 'rgba(0,0,0,0.5)' }, // simplified gradient
  bottomGradient: { position: 'absolute', bottom: 0, width: '100%', height: 180, backgroundColor: 'rgba(0,0,0,0.6)' },
  topBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 4, marginRight: 12 },
  titleArea: { flex: 1 },
  smallText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  exerciseName: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  aiBadgeText: { fontSize: 10, fontWeight: '800', marginLeft: 4 },
  bottomBar: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  feedbackBox: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, borderWidth: 2, alignSelf: 'center' },
  feedbackText: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32 },
  repCount: { color: '#FFF', fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  repTotal: { color: 'rgba(255,255,255,0.7)', fontSize: 24, fontWeight: '700' },
  stopBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30 },
  stopText: { color: '#000', fontWeight: '900', marginLeft: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: ColoresApp.fondo, borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: ColoresApp.texto },
  modalStat: { fontSize: 16, fontWeight: '700', color: ColoresApp.texto, marginBottom: 8 },
  modalSubStat: { fontSize: 16, fontWeight: '700', color: ColoresApp.textoSecundario, marginBottom: 16 },
  modalSuccessText: { fontSize: 18, fontWeight: '900', color: ColoresApp.primario, marginBottom: 24 },
  modalBtn: { backgroundColor: ColoresApp.primario, width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
