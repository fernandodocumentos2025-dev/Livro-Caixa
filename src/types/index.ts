export interface Venda {
  id: string;
  produto: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  formaPagamento: string;
  hora: string;
  data: string;
  deletedAt?: string;
}

export interface Retirada {
  id: string;
  descricao: string;
  valor: number;
  hora: string;
  data: string;
  deletedAt?: string;
}

export interface Abertura {
  id: string;
  data: string;
  hora: string;
  valorAbertura: number;
  fechamentoOriginalId?: string;
  deletedAt?: string;
}

export interface Fechamento {
  id: string;
  aberturaId?: string;
  data: string;
  hora: string;
  totalVendas: number;
  totalRetiradas: number;
  valorAbertura: number;
  valorContado: number;
  saldoEsperado: number;
  diferenca: number;
  vendas: Venda[];
  retiradas: Retirada[];
  status?: 'fechado' | 'reaberto';
  detalheEspecie?: {
    notas: number;
    moedas: number;
  };
  deletedAt?: string;
}

export interface UserSettings {
  userId: string;
  companyName: string;
}
