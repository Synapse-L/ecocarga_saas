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
    /**
     * Quais cards de preço aparecem na página 6.
     * Opcionais e tratados como `true` quando ausentes, para que propostas
     * salvas antes deste campo continuem mostrando as duas formas de pagamento.
     */
    showCashPrice?: boolean;
    showInstallments?: boolean;
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
