export interface ProposalData {
  client: {
    name: string;
    phone: string;
    address: string;
  };
  commercial: {
    productName: string;
    power: string;
    price: number;
    installments: number;
    estimatedSavings: string;
    observations: string;
    deadline: string;
    conditions: string;
    imageUrl?: string;
    technicalSpecs: {
      powerSource: string;
      connectors: number;
      connectorType: string;
      communication: string;
      model: string;
    };
  };
  metadata: {
    templateId: string;
    emissionDate: string;
    validityDays: number;
  };
}
