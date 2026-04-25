export interface Compound {
  id: string;
  name: string;
  smiles: string;
  source: 'ChEMBL' | 'PubChem';
  properties?: any;
}

export interface ADMETPrediction extends ADMETProperties {
  compoundId: string;
}

import { ADMETProperties } from './services/geminiService';
