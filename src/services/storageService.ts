import { supabase } from '../lib/supabaseClient';
import { Venda, Retirada, Fechamento, Abertura, UserSettings } from '../types';

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
}

export async function saveAbertura(abertura: Abertura): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = abertura.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

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

  const { data: result, error } = await supabase
    .from('aberturas')
    .select('*')
    .eq('user_id', userId)
    .eq('data', dataFormatada)
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

export async function saveVenda(venda: Venda, aberturaId: string): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = venda.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

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
  const { data: result, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId);

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
  await supabase
    .from('vendas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
}

export async function saveRetirada(retirada: Retirada, aberturaId: string): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = retirada.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

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
  const { data: result, error } = await supabase
    .from('retiradas')
    .select('*')
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId);

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
  await supabase
    .from('retiradas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
}

export async function saveFechamento(fechamento: Fechamento, aberturaId: string | null): Promise<void> {
  const userId = await getUserId();

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const [dia, mes, ano] = fechamento.data.split('/');
  const dataFormatada = `${ano}-${mes}-${dia}`;

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
  console.log('🔒 DEBUG: Current User ID:', userId);

  const { data: result, error } = await supabase
    .from('fechamentos')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .order('hora', { ascending: false });

  if (error) {
    console.error('Erro ao buscar fechamentos:', error);
    throw error;
  }

  console.log('🔒 DEBUG: getFechamentos result:', result);

  return (result || []).map(f => {
    // Converter data de YYYY-MM-DD para DD/MM/YYYY
    const [ano, mes, dia] = f.data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // Converter hora de HH:MM:SS para HH:MM
    const horaFormatada = f.hora.substring(0, 5);

    return {
      id: f.id,
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
      detalheEspecie: f.detalhe_especie,
    };
  });
}

export async function deleteFechamento(id: string): Promise<void> {
  const userId = await getUserId();
  await supabase
    .from('fechamentos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
}

export async function clearDayData(aberturaId: string): Promise<void> {
  const userId = await getUserId();

  await supabase
    .from('vendas')
    .delete()
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId);

  await supabase
    .from('retiradas')
    .delete()
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId);

  await supabase
    .from('aberturas')
    .delete()
    .eq('id', aberturaId)
    .eq('user_id', userId);
}

export async function getFechamentoByAbertura(aberturaId: string): Promise<boolean> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('fechamentos')
    .select('id')
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar fechamento por abertura:', error);
    return false;
  }

  return !!data;
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const userId = await getUserId();

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
