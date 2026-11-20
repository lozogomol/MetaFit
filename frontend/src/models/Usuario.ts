import { ColoresApp } from '../theme/colors';

export type Genero = 'M' | 'F';

export enum CategoriaGrasa {
  esencial = 'esencial',
  atletas = 'atletas',
  fitness = 'fitness',
  aceptable = 'aceptable',
  elevado = 'elevado',
  critico = 'critico',
}

export function getCategoriaGrasaInfo(cat: CategoriaGrasa) {
  switch (cat) {
    case CategoriaGrasa.esencial:
      return { titulo: 'Grasa Esencial', color: '#29B6F6' };
    case CategoriaGrasa.atletas:
      return { titulo: 'Atleta', color: '#00E5FF' };
    case CategoriaGrasa.fitness:
      return { titulo: 'Fitness / Óptimo', color: '#00E676' };
    case CategoriaGrasa.aceptable:
      return { titulo: 'Aceptable / Promedio', color: '#FFD600' };
    case CategoriaGrasa.elevado:
      return { titulo: 'Grasa Elevada', color: '#FF9100' };
    case CategoriaGrasa.critico:
      return { titulo: 'Grasa Crítica / Obesidad', color: ColoresApp.primario };
  }
}

export class UsuarioLogic {
  nombre: string;
  correo: string;
  estatura: number;
  peso: number;
  edad: number;
  genero: Genero;
  evaluacionCompletada: boolean;
  avatarIndex: number;

  constructor(data: any) {
    this.nombre = data.nombre || 'Usuario';
    this.correo = data.correo || 'usuario@metafit.app';
    this.estatura = data.estatura || 175.0;
    this.peso = data.peso || 74.0;
    this.edad = data.edad || 24;
    this.genero = data.genero || 'M';
    this.evaluacionCompletada = data.evaluacionCompletada || false;
    this.avatarIndex = data.avatarIndex || 0;
  }

  get imc(): number {
    if (this.estatura <= 0) return 0;
    const alturaMetros = this.estatura / 100;
    return this.peso / (alturaMetros * alturaMetros);
  }

  get categoriaImc(): string {
    const v = this.imc;
    if (v <= 0) return 'Sin datos';
    if (v < 18.5) return 'Bajo Peso';
    if (v < 25.0) return 'Peso Normal / Saludable';
    if (v < 30.0) return 'Sobrepeso';
    if (v < 35.0) return 'Obesidad Grado I';
    if (v < 40.0) return 'Obesidad Grado II';
    return 'Obesidad Grado III';
  }

  get colorImc(): string {
    const v = this.imc;
    if (v < 18.5) return '#29B6F6';
    if (v < 25.0) return '#00E676';
    if (v < 30.0) return '#FFD600';
    if (v < 35.0) return '#FF9100';
    return ColoresApp.primario;
  }

  get porcentajeGrasa(): number {
    if (this.imc <= 0 || this.edad <= 0) return 0;
    const sexoFactor = this.genero === 'M' ? 1.0 : 0.0;
    const grasa = (1.20 * this.imc) + (0.23 * this.edad) - (10.8 * sexoFactor) - 5.4;
    return Math.max(0.0, parseFloat(grasa.toFixed(1)));
  }

  get categoriaGrasa(): CategoriaGrasa {
    const g = this.porcentajeGrasa;
    if (this.genero === 'M') {
      if (g < 6.0) return CategoriaGrasa.esencial;
      if (g < 14.0) return CategoriaGrasa.atletas;
      if (g < 18.0) return CategoriaGrasa.fitness;
      if (g < 25.0) return CategoriaGrasa.aceptable;
      if (g < 30.0) return CategoriaGrasa.elevado;
      return CategoriaGrasa.critico;
    } else {
      if (g < 14.0) return CategoriaGrasa.esencial;
      if (g < 21.0) return CategoriaGrasa.atletas;
      if (g < 25.0) return CategoriaGrasa.fitness;
      if (g < 32.0) return CategoriaGrasa.aceptable;
      if (g < 38.0) return CategoriaGrasa.elevado;
      return CategoriaGrasa.critico;
    }
  }

  get masaGrasaKg(): number {
    return (this.peso * Math.max(0, Math.min(this.porcentajeGrasa, 100))) / 100;
  }

  get masaMagraKg(): number {
    return Math.max(0.0, this.peso - this.masaGrasaKg);
  }

  get masaMuscularKg(): number {
    const factor = this.genero === 'M' ? 0.54 : 0.50;
    return this.masaMagraKg * factor;
  }
}
