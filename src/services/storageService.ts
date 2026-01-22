import { supabase } from '../lib/supabaseClient';
import { Venda, Retirada, Fechamento, Abertura, UserSettings } from '../types';

const isMock = !import.meta.env.VITE_SUPABASE_URL;

if (isMock) {
  console.warn('⚠️ VITE_SUPABASE_URL não detectado. Iniciando em MODO MOCK (Dados locais e voláteis).');
}

// Banco de dados em memória para Modo MOCK - Garantir que inicia ZERADO
const mockDB = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aberturas: [] as any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vendas: [] as any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  retiradas: [] as any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fechamentos: [] as any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user_settings: [] as any[]
};

async function getUserId(): Promise<string> {
  if (isMock) return 'mock-user-id';
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
}

export async function saveAbertura(abertura: Abertura): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = abertura.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

  if (isMock) {
    mockDB.aberturas.push({
      id: abertura.id,
      user_id: userId,
      data: dataFormatada,
      hora: abertura.hora,
      valor_abertura: abertura.valorAbertura,
      fechamento_original_id: abertura.fechamentoOriginalId || null,
    });

    return;
  }

  const { error } = await supabase.from('aberturas').insert({
    id: abertura.id,
    user_id: userId,
    data: dataFormatada,
    hora: abertura.hora,
    valor_abertura: abertura.valorAbertura,
    fechamento_original_id: abertura.fechamentoOriginalId || null,
  });

  // Se erro for de duplicidade (código 23505), isso deve ser resolvido pela migration que remove a restrição única
  // Mas se ainda ocorrer, vamos relançar o erro original para debug
  if (error) {
    if (error.code === '23505') {
      console.warn('Conflito de chave única detectado. Verifique se a constraint foi removida do banco.');
    }

    console.error('Erro ao inserir abertura no Supabase:', error);
    throw new Error(`Erro ao salvar abertura: ${error.message}`);
  }
}

export async function getAberturaHoje(data: string): Promise<Abertura | null> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD para busca
  const [dia, mes, ano] = data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

  if (isMock) {
    const abertura = mockDB.aberturas
      .filter(a => a.user_id === userId && a.data === dataFormatada)
      .sort((a, b) => b.hora.localeCompare(a.hora))[0];

    if (!abertura) return null;

    const [anoDb, mesDb, diaDb] = abertura.data.split('-');
    return {
      id: abertura.id,
      data: `${diaDb}/${mesDb}/${anoDb}`,
      hora: abertura.hora.substring(0, 5),
      valorAbertura: parseFloat(abertura.valor_abertura),
      fechamentoOriginalId: abertura.fechamentoOriginalId,
    };
  }

  const { data: result, error } = await supabase
    .from('aberturas')
    .select('*')
    .eq('user_id', userId)
    .eq('data', dataFormatada)
    .is('deleted_at', null) // Soft Delete check
    .order('hora', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!result) return null;

  // Converter data de YYYY-MM-DD para DD/MM/YYYY
  const [anoDb, mesDb, diaDb] = result.data.split('-');
  const dataOriginal = `${diaDb}/${mesDb}/${anoDb}`;

  // Converter hora de HH:MM:SS para HH:MM
  const horaFormatada = result.hora.substring(0, 5);

  return {
    id: result.id,
    data: dataOriginal,
    hora: horaFormatada,
    valorAbertura: parseFloat(result.valor_abertura),
    fechamentoOriginalId: result.fechamento_original_id,
  };
}

export async function getAberturaById(id: string): Promise<Abertura | null> {
  const userId = await getUserId();

  if (isMock) {
    const abertura = mockDB.aberturas.find(a => a.id === id && a.user_id === userId);

    if (!abertura) return null;

    const [anoDb, mesDb, diaDb] = abertura.data.split('-');
    return {
      id: abertura.id,
      data: `${diaDb}/${mesDb}/${anoDb}`,
      hora: abertura.hora.substring(0, 5),
      valorAbertura: parseFloat(abertura.valor_abertura),
      fechamentoOriginalId: abertura.fechamento_original_id,
    };
  }

  const { data: result, error } = await supabase
    .from('aberturas')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null) // Soft Delete check
    .single();

  if (error) {
    console.error('Erro ao buscar abertura por ID:', error);
    return null;
  }
  if (!result) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [anoDb, mesDb, diaDb] = (result as any).data.split('-');

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: (result as any).id,
    data: `${diaDb}/${mesDb}/${anoDb}`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hora: (result as any).hora.substring(0, 5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    valorAbertura: parseFloat((result as any).valor_abertura),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fechamentoOriginalId: (result as any).fechamento_original_id
  };
}

export async function getUltimaAberturaAberta(): Promise<Abertura | null> {
  const userId = await getUserId();

  if (isMock) {
    // Retorna a última abertura que não tem fechamento correspondente
    const aberturasUsuario = mockDB.aberturas
      .filter(a => a.user_id === userId)
      .sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora));

    for (const abertura of aberturasUsuario) {
      const fechado = mockDB.fechamentos.some(f => f.abertura_id === abertura.id);
      if (!fechado) {
        const [anoDb, mesDb, diaDb] = abertura.data.split('-');
        return {
          id: abertura.id,
          data: `${diaDb}/${mesDb}/${anoDb}`,
          hora: abertura.hora.substring(0, 5),
          valorAbertura: parseFloat(abertura.valor_abertura),
          fechamentoOriginalId: abertura.fechamento_original_id,
        };
      }
    }
    return null;
  }

  // Buscar as últimas 10 aberturas para garantir que encontramos a ativa
  // (Normalmente a ativa é a primeira, mas por segurança buscamos mais)
  const { data: aberturas, error } = await supabase
    .from('aberturas')
    .select('id, data, hora, valor_abertura, fechamento_original_id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('data', { ascending: false })
    .order('hora', { ascending: false })
    .limit(10);

  if (error) throw error;
  if (!aberturas || aberturas.length === 0) return null;

  // Coletar IDs das aberturas candidatas
  const aberturaIds = aberturas.map(a => a.id);

  // Buscar SE existe algum fechamento para essas aberturas
  const { data: fechamentos } = await supabase
    .from('fechamentos')
    .select('abertura_id')
    .in('abertura_id', aberturaIds)
    .eq('user_id', userId)
    .is('deleted_at', null);

  const fechamentosMap = new Set(fechamentos?.map(f => f.abertura_id));

  // Encontrar a primeira abertura que NÃO tem fechamento
  // SORT CRITICAL: Deve ser a mais recente
  const aberturaAberta = aberturas.find(a => !fechamentosMap.has(a.id));

  if (aberturaAberta) {
    // SECURITY CHECK: Se houver uma abertura MAIS RECENTE que esta (e que está fechada),
    // então esta abertura antiga provavelmente é um "zumbi" ou erro de consistência.
    // O sistema deve privilegiar a cronologia.
    const aberturasMaisRecentes = aberturas.filter(a =>
      (a.data > aberturaAberta.data) ||
      (a.data === aberturaAberta.data && a.hora > aberturaAberta.hora)
    );

    if (aberturasMaisRecentes.length > 0) {
      // Se existem aberturas posteriores fechadas, esta antiga deve ser ignorada
      // para não travar o usuário no passado.
      // Isso corrige o bug "Volta para o mesmo caixa aberto" se ele for antigo.
      return null;
    }

    // Converter data de YYYY-MM-DD para DD/MM/YYYY
    const [anoDb, mesDb, diaDb] = aberturaAberta.data.split('-');
    const dataOriginal = `${diaDb}/${mesDb}/${anoDb}`;

    // Converter hora de HH:MM:SS para HH:MM
    const horaFormatada = aberturaAberta.hora.substring(0, 5);

    return {
      id: aberturaAberta.id,
      data: dataOriginal,
      hora: horaFormatada,
      valorAbertura: parseFloat(aberturaAberta.valor_abertura),
      fechamentoOriginalId: aberturaAberta.fechamento_original_id,
    };
  }

  return null;
}


export async function saveVenda(venda: Venda, aberturaId: string): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = venda.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

  if (isMock) {
    mockDB.vendas.push({
      id: venda.id,
      user_id: userId,
      abertura_id: aberturaId,
      produto: venda.produto,
      quantidade: Math.floor(venda.quantidade),
      preco_unitario: venda.precoUnitario,
      total: venda.total,
      forma_pagamento: venda.formaPagamento,
      hora: venda.hora,
      data: dataFormatada,
    });
    return;
  }

  const { error } = await supabase.from('vendas').insert({
    id: venda.id,
    user_id: userId,
    abertura_id: aberturaId,
    produto: venda.produto,
    quantidade: Math.floor(venda.quantidade), // Converter para integer
    preco_unitario: venda.precoUnitario,
    total: venda.total,
    forma_pagamento: venda.formaPagamento,
    hora: venda.hora, // Formato HH:MM já é compatível
    data: dataFormatada, // Formato YYYY-MM-DD
  });

  if (error) {
    console.error('Erro ao inserir venda no Supabase:', error);
    throw new Error(`Erro ao salvar venda: ${error.message}`);
  }
}

export async function getVendasByAbertura(aberturaId: string): Promise<Venda[]> {
  const userId = await getUserId();

  if (isMock) {
    return mockDB.vendas
      .filter(v => v.user_id === userId && v.abertura_id === aberturaId)
      .sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.hora.localeCompare(b.hora);
      })
      .map(v => {
        const [ano, mes, dia] = v.data.split('-');
        return {
          id: v.id,
          produto: v.produto,
          quantidade: v.quantidade,
          precoUnitario: v.preco_unitario,
          total: v.total,
          formaPagamento: v.forma_pagamento,
          hora: v.hora.substring(0, 5),
          data: `${dia}/${mes}/${ano}`,
        };
      });
  }

  const { data: result, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId)
    .is('deleted_at', null) // Soft Delete check
    .order('data', { ascending: true })
    .order('hora', { ascending: true });

  if (error) throw error;

  return (result || []).map(v => {
    // Converter data de YYYY-MM-DD para DD/MM/YYYY
    const [ano, mes, dia] = v.data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // Converter hora de HH:MM:SS para HH:MM
    const horaFormatada = v.hora.substring(0, 5);

    return {
      id: v.id,
      produto: v.produto,
      quantidade: v.quantidade,
      precoUnitario: parseFloat(v.preco_unitario),
      total: parseFloat(v.total),
      formaPagamento: v.forma_pagamento,
      hora: horaFormatada,
      data: dataFormatada,
    };
  });
}

export async function updateVenda(id: string, updatedVenda: Venda): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = updatedVenda.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

  if (isMock) {
    const index = mockDB.vendas.findIndex(v => v.id === id && v.user_id === userId);
    if (index !== -1) {
      mockDB.vendas[index] = {
        ...mockDB.vendas[index],
        produto: updatedVenda.produto,
        quantidade: Math.floor(updatedVenda.quantidade),
        preco_unitario: updatedVenda.precoUnitario,
        total: updatedVenda.total,
        forma_pagamento: updatedVenda.formaPagamento,
        hora: updatedVenda.hora,
        data: dataFormatada,
      };
    }
    return;
  }

  await supabase
    .from('vendas')
    .update({
      produto: updatedVenda.produto,
      quantidade: Math.floor(updatedVenda.quantidade),
      preco_unitario: updatedVenda.precoUnitario,
      total: updatedVenda.total,
      forma_pagamento: updatedVenda.formaPagamento,
      hora: updatedVenda.hora,
      data: dataFormatada,
    })
    .eq('id', id)
    .eq('user_id', userId);
}

export async function deleteVenda(id: string): Promise<void> {
  const userId = await getUserId();

  if (isMock) {
    mockDB.vendas = mockDB.vendas.filter(v => !(v.id === id && v.user_id === userId));
    return;
  }

  const timestamp = new Date().toISOString();
  await supabase
    .from('vendas')
    .update({ deleted_at: timestamp })
    .eq('id', id)
    .eq('user_id', userId);
}


export async function saveRetirada(retirada: Retirada, aberturaId: string): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = retirada.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

  if (isMock) {
    mockDB.retiradas.push({
      id: retirada.id,
      user_id: userId,
      abertura_id: aberturaId,
      descricao: retirada.descricao,
      valor: retirada.valor,
      hora: retirada.hora,
      data: dataFormatada,
    });
    return;
  }

  const { error } = await supabase.from('retiradas').insert({
    id: retirada.id,
    user_id: userId,
    abertura_id: aberturaId,
    descricao: retirada.descricao,
    valor: retirada.valor,
    hora: retirada.hora,
    data: dataFormatada,
  });

  if (error) {
    console.error('Erro ao inserir retirada no Supabase:', error);
    throw new Error(`Erro ao salvar retirada: ${error.message}`);
  }
}

export async function getRetiradasByAbertura(aberturaId: string): Promise<Retirada[]> {
  const userId = await getUserId();

  if (isMock) {
    return mockDB.retiradas
      .filter(r => r.user_id === userId && r.abertura_id === aberturaId)
      .sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.hora.localeCompare(b.hora);
      })
      .map(r => {
        const [ano, mes, dia] = r.data.split('-');
        return {
          id: r.id,
          descricao: r.descricao,
          valor: parseFloat(r.valor),
          hora: r.hora.substring(0, 5),
          data: `${dia}/${mes}/${ano}`,
        };
      });
  }

  const { data: result, error } = await supabase
    .from('retiradas')
    .select('*')
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId)
    .is('deleted_at', null) // Soft Delete check
    .order('data', { ascending: true })
    .order('hora', { ascending: true });

  if (error) throw error;

  return (result || []).map(r => {
    // Converter data de YYYY-MM-DD para DD/MM/YYYY
    const [ano, mes, dia] = r.data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // Converter hora de HH:MM:SS para HH:MM
    const horaFormatada = r.hora.substring(0, 5);

    return {
      id: r.id,
      descricao: r.descricao,
      valor: parseFloat(r.valor),
      hora: horaFormatada,
      data: dataFormatada,
    };
  });
}

export async function updateRetirada(id: string, updatedRetirada: Retirada): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = updatedRetirada.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

  if (isMock) {
    const index = mockDB.retiradas.findIndex(r => r.id === id && r.user_id === userId);
    if (index !== -1) {
      mockDB.retiradas[index] = {
        ...mockDB.retiradas[index],
        descricao: updatedRetirada.descricao,
        valor: updatedRetirada.valor,
        hora: updatedRetirada.hora,
        data: dataFormatada,
      };
    }
    return;
  }

  await supabase
    .from('retiradas')
    .update({
      descricao: updatedRetirada.descricao,
      valor: updatedRetirada.valor,
      hora: updatedRetirada.hora,
      data: dataFormatada,
    })
    .eq('id', id)
    .eq('user_id', userId);
}

export async function deleteRetirada(id: string): Promise<void> {
  const userId = await getUserId();

  if (isMock) {
    mockDB.retiradas = mockDB.retiradas.filter(r => !(r.id === id && r.user_id === userId));
    return;
  }

  const timestamp = new Date().toISOString();
  await supabase
    .from('retiradas')
    .update({ deleted_at: timestamp })
    .eq('id', id)
    .eq('user_id', userId);
}

export async function saveFechamento(fechamento: Fechamento, aberturaId: string | null): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = fechamento.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

  if (isMock) {
    mockDB.fechamentos.push({
      id: fechamento.id,
      user_id: userId,
      abertura_id: aberturaId,
      data: dataFormatada,
      hora: fechamento.hora,
      total_vendas: fechamento.totalVendas,
      total_retiradas: fechamento.totalRetiradas,
      valor_abertura: fechamento.valorAbertura,
      valor_contado: fechamento.valorContado,
      saldo_esperado: fechamento.saldoEsperado,
      diferenca: fechamento.diferenca,
      vendas: fechamento.vendas,
      retiradas: fechamento.retiradas,
      status: fechamento.status,
      detalhe_especie: fechamento.detalheEspecie,
    });
    return;
  }

  const { error } = await supabase.from('fechamentos').insert({
    id: fechamento.id,
    user_id: userId,
    abertura_id: aberturaId,
    data: dataFormatada,
    hora: fechamento.hora,
    total_vendas: fechamento.totalVendas,
    total_retiradas: fechamento.totalRetiradas,
    valor_abertura: fechamento.valorAbertura,
    valor_contado: fechamento.valorContado,
    saldo_esperado: fechamento.saldoEsperado,
    diferenca: fechamento.diferenca,
    vendas: fechamento.vendas,
    retiradas: fechamento.retiradas,
    status: fechamento.status,
    detalhe_especie: fechamento.detalheEspecie,
  });

  if (error) {
    console.error('Erro ao inserir fechamento no Supabase:', error);
    throw new Error(`Erro ao salvar fechamento: ${error.message}`);
  }
}

export async function updateFechamento(id: string, fechamento: Fechamento, aberturaId: string | null): Promise<boolean> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = fechamento.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

  if (isMock) {
    const index = mockDB.fechamentos.findIndex(f => f.id === id && f.user_id === userId);
    if (index !== -1) {
      mockDB.fechamentos[index] = {
        ...mockDB.fechamentos[index],
        abertura_id: aberturaId || fechamento.aberturaId,
        data: dataFormatada,
        hora: fechamento.hora,
        total_vendas: fechamento.totalVendas,
        total_retiradas: fechamento.totalRetiradas,
        valor_abertura: fechamento.valorAbertura,
        valor_contado: fechamento.valorContado,
        saldo_esperado: fechamento.saldoEsperado,
        diferenca: fechamento.diferenca,
        vendas: fechamento.vendas,
        retiradas: fechamento.retiradas,
        status: fechamento.status,
        detalhe_especie: fechamento.detalheEspecie
      };
      return true;
    }
    return false;
  }

  const { data, error } = await supabase
    .from('fechamentos')
    .update({
      abertura_id: aberturaId,
      data: dataFormatada,
      hora: fechamento.hora,
      total_vendas: fechamento.totalVendas,
      total_retiradas: fechamento.totalRetiradas,
      valor_abertura: fechamento.valorAbertura,
      valor_contado: fechamento.valorContado,
      saldo_esperado: fechamento.saldoEsperado,
      diferenca: fechamento.diferenca,
      vendas: fechamento.vendas,
      retiradas: fechamento.retiradas,
      status: fechamento.status,
      detalhe_especie: fechamento.detalheEspecie,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Erro ao atualizar fechamento no Supabase:', error);
    throw new Error(`Erro ao atualizar fechamento: ${error.message}`);
  }

  return data && data.length > 0;
}

export async function getFechamentos(): Promise<Fechamento[]> {
  const userId = await getUserId();


  if (isMock) {
    return mockDB.fechamentos
      .filter(f => f.user_id === userId)
      .sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora))
      .map(f => {
        const [ano, mes, dia] = f.data.split('-');
        return {
          id: f.id,
          aberturaId: f.abertura_id, // Include mapping
          data: `${dia}/${mes}/${ano}`,
          hora: f.hora.substring(0, 5),
          totalVendas: parseFloat(f.total_vendas),
          totalRetiradas: parseFloat(f.total_retiradas),
          valorAbertura: parseFloat(f.valor_abertura),
          valorContado: parseFloat(f.valor_contado),
          saldoEsperado: parseFloat(f.saldo_esperado),
          diferenca: parseFloat(f.diferenca),
          vendas: f.vendas || [],
          retiradas: f.retiradas || [],
          status: f.status,
          detalheEspecie: f.detalhe_especie,
        };
      });
  }

  const { data: result, error } = await supabase
    .from('fechamentos')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null) // Soft Delete check
    .order('data', { ascending: false })
    .order('hora', { ascending: false });

  if (error) {
    console.error('Erro ao buscar fechamentos:', error);
    throw error;
  }



  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((result as any[]) || []).map(f => {
    // Converter data de YYYY-MM-DD para DD/MM/YYYY
    const [ano, mes, dia] = f.data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // Converter hora de HH:MM:SS para HH:MM
    const horaFormatada = f.hora.substring(0, 5);

    return {
      id: f.id,
      aberturaId: f.abertura_id, // Include mapping
      data: dataFormatada,
      hora: horaFormatada,
      totalVendas: parseFloat(f.total_vendas),
      totalRetiradas: parseFloat(f.total_retiradas),
      valorAbertura: parseFloat(f.valor_abertura),
      valorContado: parseFloat(f.valor_contado),
      saldoEsperado: parseFloat(f.saldo_esperado),
      diferenca: parseFloat(f.diferenca),
      vendas: f.vendas || [],
      retiradas: f.retiradas || [],
      status: f.status,
      detalheEspecie: f.detalhe_especie
    };
  });
}

/**
 * Buscar fechamentos de um mês específico (para relatório mensal)
 * Regras contábeis estritas:
 * - Apenas fechamentos com deleted_at IS NULL
 * - Apenas do usuário autenticado (user_id = auth.uid())
 * - Apenas dentro do mês/ano especificado
 */
export async function getFechamentosMensais(ano: number, mes: number): Promise<Fechamento[]> {
  const userId = await getUserId();

  // Calcular intervalo de datas (YYYY-MM-01 até YYYY-(MM+1)-01)
  const startDate = `${ano}-${mes.toString().padStart(2, '0')}-01`;
  const nextMonth = mes === 12 ? 1 : mes + 1;
  const nextYear = mes === 12 ? ano + 1 : ano;
  const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

  if (isMock) {
    return mockDB.fechamentos
      .filter(f =>
        f.user_id === userId &&
        f.data >= startDate &&
        f.data < endDate
      )
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(f => {
        const [ano, mes, dia] = f.data.split('-');
        return {
          id: f.id,
          aberturaId: f.abertura_id,
          data: `${dia}/${mes}/${ano}`,
          hora: f.hora.substring(0, 5),
          totalVendas: parseFloat(f.total_vendas),
          totalRetiradas: parseFloat(f.total_retiradas),
          valorAbertura: parseFloat(f.valor_abertura),
          valorContado: parseFloat(f.valor_contado),
          saldoEsperado: parseFloat(f.saldo_esperado),
          diferenca: parseFloat(f.diferenca),
          vendas: f.vendas || [],
          retiradas: f.retiradas || [],
          status: f.status,
          detalheEspecie: f.detalhe_especie,
        };
      });
  }

  const { data: result, error } = await supabase
    .from('fechamentos')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null) // Filtro obrigatório: apenas não-deletados
    .gte('data', startDate)
    .lt('data', endDate)
    .order('data', { ascending: true }); // Ordem cronológica

  if (error) {
    console.error('Erro ao buscar fechamentos mensais:', error);
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((result as any[]) || []).map(f => {
    const [ano, mes, dia] = f.data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const horaFormatada = f.hora.substring(0, 5);

    return {
      id: f.id,
      aberturaId: f.abertura_id,
      data: dataFormatada,
      hora: horaFormatada,
      totalVendas: parseFloat(f.total_vendas),
      totalRetiradas: parseFloat(f.total_retiradas),
      valorAbertura: parseFloat(f.valor_abertura),
      valorContado: parseFloat(f.valor_contado),
      saldoEsperado: parseFloat(f.saldo_esperado),
      diferenca: parseFloat(f.diferenca),
      vendas: f.vendas || [],
      retiradas: f.retiradas || [],
      status: f.status,
      detalheEspecie: f.detalhe_especie
    };
  });
}

export async function deleteFechamento(id: string): Promise<void> {
  const userId = await getUserId();

  if (isMock) {
    mockDB.fechamentos = mockDB.fechamentos.filter(f => !(f.id === id && f.user_id === userId));
    return;
  }

  const timestamp = new Date().toISOString();
  await supabase
    .from('fechamentos')
    .update({ deleted_at: timestamp })
    .eq('id', id)
    .eq('user_id', userId);
}

/**
 * Remove COMPLETAMENTE um registro do histórico.
 * Isso inclui o Fechamento, a Abertura vinculada e todas as Vendas/Retiradas.
 * Diferente de 'deleteFechamento' (que apenas 'reabre' o caixa), esta função apaga o dia.
 */
export async function deleteHistoricoCompleto(fechamentoId: string): Promise<void> {
  const userId = await getUserId();
  const timestamp = new Date().toISOString();

  // 1. Buscar o fechamento para descobrir qual a abertura vinculada
  const { data: fechamento } = await supabase
    .from('fechamentos')
    .select('abertura_id')
    .eq('id', fechamentoId)
    .single();

  if (!fechamento) return; // Já não existe

  // 2. Soft Delete no Fechamento
  await supabase
    .from('fechamentos')
    .update({ deleted_at: timestamp })
    .eq('id', fechamentoId)
    .eq('user_id', userId);

  // 3. Se houver abertura vinculada, deletar ela e seus itens
  if (fechamento.abertura_id) {
    const aberturaId = fechamento.abertura_id;

    // Soft Delete na Abertura
    await supabase
      .from('aberturas')
      .update({ deleted_at: timestamp })
      .eq('id', aberturaId)
      .eq('user_id', userId);

    // Soft Delete nas Vendas
    await supabase
      .from('vendas')
      .update({ deleted_at: timestamp })
      .eq('abertura_id', aberturaId)
      .eq('user_id', userId);

    // Soft Delete nas Retiradas
    await supabase
      .from('retiradas')
      .update({ deleted_at: timestamp })
      .eq('abertura_id', aberturaId)
      .eq('user_id', userId);
  }
}

export async function clearDayData(aberturaId: string): Promise<void> {
  const userId = await getUserId();

  if (isMock) {
    mockDB.vendas = mockDB.vendas.filter(v => !(v.user_id === userId && v.abertura_id === aberturaId));
    mockDB.retiradas = mockDB.retiradas.filter(r => !(r.user_id === userId && r.abertura_id === aberturaId));
    mockDB.aberturas = mockDB.aberturas.filter(a => !(a.user_id === userId && a.id === aberturaId));
    // Nota: Fechamentos geralmente não são deletados por 'clearDayData' no fluxo original, mas se necessário, adicione aqui.
    return;
  }

  const timestamp = new Date().toISOString();

  await supabase
    .from('vendas')
    .update({ deleted_at: timestamp })
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId);

  await supabase
    .from('retiradas')
    .update({ deleted_at: timestamp })
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId);

  await supabase
    .from('aberturas')
    .update({ deleted_at: timestamp })
    .eq('id', aberturaId)
    .eq('user_id', userId);
}

export async function getFechamentoByAbertura(aberturaId: string): Promise<boolean> {
  const userId = await getUserId();

  if (isMock) {
    const fechamento = mockDB.fechamentos.find(f => f.user_id === userId && f.abertura_id === aberturaId);
    return !!fechamento;
  }

  const { data, error } = await supabase
    .from('fechamentos')
    .select('id')
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId)
    .is('deleted_at', null) // Soft Delete check
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar fechamento por abertura:', error);
    return false;
  }

  return !!data;
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const userId = await getUserId();

  if (isMock) {
    const settings = mockDB.user_settings.find(s => s.user_id === userId);
    if (!settings) return null;
    return {
      userId: settings.user_id,
      companyName: settings.company_name || '',
    };
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar configurações do usuário:', error);
    return null;
  }

  if (!data) return null;

  return {
    userId: data.user_id,
    companyName: data.company_name || '',
  };
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const userId = await getUserId();

  if (isMock) {
    const index = mockDB.user_settings.findIndex(s => s.user_id === userId);
    const newSettings = {
      user_id: userId,
      company_name: settings.companyName,
      updated_at: new Date().toISOString(),
    };

    if (index !== -1) {
      mockDB.user_settings[index] = newSettings;
    } else {
      mockDB.user_settings.push(newSettings);
    }
    return;
  }

  // Upsert (insert or update) based on user_id
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      company_name: settings.companyName,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Erro ao salvar configurações do usuário:', error);
    throw new Error(`Erro ao salvar configurações: ${error.message}`);
  }
}
