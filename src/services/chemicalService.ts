import axios from 'axios';

export interface Compound {
  id: string;
  name: string;
  smiles: string;
  source: 'ChEMBL' | 'PubChem';
  properties?: any;
}

export async function fetchCompoundsByDisease(disease: string): Promise<Compound[]> {
  try {
    // Note: In a real-world scenario, we'd search targets for the disease first, then bioactives.
    // For this demo, we'll fetch recently published compounds associated with therapeutic areas.
    const chemblUrl = `https://www.ebi.ac.uk/chembl/api/data/molecule.json?limit=10&format=json`;
    const response = await axios.get(chemblUrl);
    
    return (response.data.molecules || []).map((m: any) => ({
      id: m.molecule_chembl_id,
      name: m.pref_name || m.molecule_chembl_id,
      smiles: m.molecule_structures?.canonical_smiles || '',
      source: 'ChEMBL',
      properties: m.molecule_properties
    })).filter((c: Compound) => c.smiles);
  } catch (error) {
    console.error('Error fetching from ChEMBL:', error);
    return [];
  }
}

export async function fetchPubChemCompound(name: string): Promise<Compound | null> {
  try {
    // Try property search first
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CanonicalSMILES/JSON`;
    const response = await axios.get(url);
    const data = response.data.PropertyTable.Properties[0];
    return {
      id: data.CID.toString(),
      name: name,
      smiles: data.CanonicalSMILES,
      source: 'PubChem'
    };
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      // Just return null for 404
      return null;
    }
    console.error('Error fetching from PubChem:', error);
    return null;
  }
}
