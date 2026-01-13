/**
 * Camada de abstração para operações de storage
 *
 * Este arquivo serve como interface entre a aplicação e o serviço de storage.
 * Atualmente usa mock (localStorage), mas pode ser substituído por API real no futuro.
 */

import { Venda, Retirada, Fechamento, Abertura } from '../types';
import * as storageService from '../services/storageService';

let aberturaCache: Abertura | null = null;
let vendasCache: Venda[] = [];
let retiradasCache: Retirada[] = [];

export async function checkAndResetIfNewDay(): Promise<void> {
  // Função mantida por compatibilidade, mas não faz mais reset automático
  // Caixas devem persistir independente da data
  try {
    console.log('checkAndResetIfNewDay: Função desabilitada - caixas persistem independente da data');
  } catch (error) {
    console.error('Erro em checkAndResetIfNewDay:', error);
  }
}

export async function getVendasHoje(): Promise<Venda[]> {
  try {
    const abertura = await getAberturaHoje();
    if (!abertura) return [];

    vendasCache = await storageService.getVendasByAbertura(abertura.id);
    return vendasCache;
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return [];
  }
}

export async function saveVenda(venda: Venda): Promise<void> {
  try {
    const abertura = await getAberturaHoje();
    if (!abertura) throw new Error('Nenhuma abertura de caixa encontrada');

    await storageService.saveVenda(venda, abertura.id);
    vendasCache.push(venda);
  } catch (error) {
    console.error('Erro ao salvar venda:', error);
    throw error;
  }
}

export async function updateVenda(id: string, updatedVenda: Venda): Promise<void> {
  try {
    await storageService.updateVenda(id, updatedVenda);

    const index = vendasCache.findIndex(v => v.id === id);
    if (index !== -1) {
      vendasCache[index] = updatedVenda;
    }
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    throw error;
  }
}

export async function deleteVenda(id: string): Promise<void> {
  try {
    await storageService.deleteVenda(id);
    vendasCache = vendasCache.filter(v => v.id !== id);
  } catch (error) {
    console.error('Erro ao deletar venda:', error);
    throw error;
  }
}

export async function getRetiradasHoje(): Promise<Retirada[]> {
  try {
    const abertura = await getAberturaHoje();
    if (!abertura) return [];

    retiradasCache = await storageService.getRetiradasByAbertura(abertura.id);
    return retiradasCache;
  } catch (error) {
    console.error('Erro ao buscar retiradas:', error);
    return [];
  }
}

export async function saveRetirada(retirada: Retirada): Promise<void> {
  try {
    const abertura = await getAberturaHoje();
    if (!abertura) throw new Error('Nenhuma abertura de caixa encontrada');

    await storageService.saveRetirada(retirada, abertura.id);
    retiradasCache.push(retirada);
  } catch (error) {
    console.error('Erro ao salvar retirada:', error);
    throw error;
  }
}

export async function updateRetirada(id: string, updatedRetirada: Retirada): Promise<void> {
  try {
    await storageService.updateRetirada(id, updatedRetirada);

    const index = retiradasCache.findIndex(r => r.id === id);
    if (index !== -1) {
      retiradasCache[index] = updatedRetirada;
    }
  } catch (error) {
    console.error('Erro ao atualizar retirada:', error);
    throw error;
  }
}

export async function deleteRetirada(id: string): Promise<void> {
  try {
    await storageService.deleteRetirada(id);
    retiradasCache = retiradasCache.filter(r => r.id !== id);
  } catch (error) {
    console.error('Erro ao deletar retirada:', error);
    throw error;
  }
}

export async function getFechamentos(): Promise<Fechamento[]> {
  try {
    return await storageService.getFechamentos();
  } catch (error) {
    console.error('Erro ao buscar fechamentos:', error);
    alert('Erro ao carregar histórico: ' + (error instanceof Error ? error.message : String(error)));
    return [];
  }
}

export async function saveFechamento(fechamento: Fechamento): Promise<void> {
  try {
    const abertura = await getAberturaHoje();
    console.log('🔒 DEBUG: Salvando fechamento. Abertura:', abertura);

    if (abertura?.fechamentoOriginalId) {
      console.log('🔒 DEBUG: Atualizando fechamento existente:', abertura.fechamentoOriginalId);
      const updated = await storageService.updateFechamento(abertura.fechamentoOriginalId, fechamento, abertura.id);

      if (!updated) {
        console.log('🔒 DEBUG: Fechamento original não encontrado (pode ter sido deletado). Criando novo.');
        await storageService.saveFechamento(fechamento, abertura.id);
      }
    } else {
      console.log('🔒 DEBUG: Criando novo fechamento');
      await storageService.saveFechamento(fechamento, abertura?.id || null);
    }
    console.log('🔒 DEBUG: Fechamento salvo com sucesso');
  } catch (error) {
    console.error('Erro ao salvar fechamento:', error);
    throw error;
  }
}

export async function deleteFechamento(id: string): Promise<void> {
  try {
    await storageService.deleteFechamento(id);
  } catch (error) {
    console.error('Erro ao deletar fechamento:', error);
    throw error;
  }
}

export async function clearDayData(): Promise<void> {
  try {
    const abertura = await getAberturaHoje();
    if (!abertura) return;

    await storageService.clearDayData(abertura.id);

    aberturaCache = null;
    vendasCache = [];
    retiradasCache = [];
  } catch (error) {
    console.error('Erro ao limpar dados do dia:', error);
  }
}

export async function getAberturaHoje(): Promise<Abertura | null> {
  try {
    // Buscar o último caixa aberto, independente da data
    // Primeiro verifica se há cache válido
    if (aberturaCache) {
      // Verificar se o caixa em cache ainda está aberto
      const isFechado = await storageService.getFechamentoByAbertura(aberturaCache.id);
      if (!isFechado) {
        return aberturaCache;
      }
      // Se foi fechado, limpar cache
      aberturaCache = null;
    }

    // Buscar último caixa aberto do banco
    const abertura = await storageService.getUltimaAberturaAberta();

    if (abertura) {
      aberturaCache = abertura;
      return aberturaCache;
    }

    return null;
  } catch (error) {
    console.error('Erro em getAberturaHoje:', error);
    return null;
  }
}

export async function saveAbertura(abertura: Abertura): Promise<void> {
  try {
    await storageService.saveAbertura(abertura);
    aberturaCache = abertura;
  } catch (error) {
    if (error instanceof Error && error.message.includes('O caixa já foi aberto hoje')) {
      // Erro esperado de lógica, usar warn para não poluir console
      console.warn('Abertura bloqueada:', error.message);
    } else {
      console.error('Erro ao salvar abertura:', error);
    }
    throw error;
  }
}

export async function hasCaixaAberto(): Promise<boolean> {
  try {
    console.log('📋 hasCaixaAberto: Iniciando verificação...');
    const abertura = await getAberturaHoje();
    console.log('📋 hasCaixaAberto: Abertura encontrada?', !!abertura, abertura?.id);

    if (!abertura) {
      console.log('📋 hasCaixaAberto: Sem abertura → retornando FALSE');
      return false;
    }

    // Verificar se já existe um fechamento para esta abertura
    const isFechado = await storageService.getFechamentoByAbertura(abertura.id);
    console.log('📋 hasCaixaAberto: Já foi fechado?', isFechado);
    const resultado = !isFechado;
    console.log('📋 hasCaixaAberto: Resultado final:', resultado);
    return resultado;
  } catch (error) {
    console.error('Erro em hasCaixaAberto:', error);
    return false;
  }
}

export async function reabrirCaixa(fechamentoId: string): Promise<boolean> {
  try {
    const fechamentos = await getFechamentos();
    const fechamento = fechamentos.find(f => f.id === fechamentoId);

    if (!fechamento) return false;

    // Verificar se existe um caixa aberto atualmente
    const aberturaAtual = await getAberturaHoje();
    if (aberturaAtual) {
      // Se estamos tentando reabrir O MESMO caixa que já está aberto (caso de erro de estado), apenas retornamos true
      if (fechamento.aberturaId && aberturaAtual.id === fechamento.aberturaId) {
        console.log('📦 O caixa original já está aberto. Apenas removendo registro de fechamento redundante.');
        await deleteFechamento(fechamentoId);
        return true;
      }

      // Se há OUTRO caixa aberto, precisamos limpá-lo para reabrir o antigo
      // (Opcional: Poderíamos impedir isso e pedir para o usuário fechar o atual primeiro)
      await clearDayData();
    }

    // Tentar identificar o ID da abertura original
    const oldAberturaId = fechamento.aberturaId;

    if (oldAberturaId) {
      console.log('📦 Tentando restaurar abertura original:', oldAberturaId);
      // Basicamente, ao deletar o fechamento, a abertura original (se existir) volta a ser "a última aberta"
      await deleteFechamento(fechamentoId);

      // Verificar se a abertura realmente existe no banco para garantir consistência
      // Se não existir (foi deletada por algum motivo), precisamos recriá-la com o MESMO ID
      // Como não temos função para "check exists", tentamos ler
      // Mas o getUltimaAberturaAberta deve pegá-la agora que deletamos o fechamento.

      return true;
    } else {
      // Fallback para caixas antigos sem ID vinculado (cria novo, comportamento legado)
      console.warn('⚠️ Abertura original não identificada. Criando nova (Legado).');
      const abertura: Abertura = {
        id: crypto.randomUUID(),
        data: fechamento.data,
        hora: getCurrentTime(),
        valorAbertura: fechamento.valorAbertura,
        fechamentoOriginalId: fechamentoId,
      };

      await saveAbertura(abertura);

      for (const venda of fechamento.vendas) {
        await saveVenda(venda);
      }

      for (const retirada of fechamento.retiradas) {
        await saveRetirada(retirada);
      }

      await deleteFechamento(fechamentoId); // Remove o fechamento antigo pois agora foi "reaberto" como novo
      return true;
    }
  } catch (error) {
    console.error('Erro ao reabrir caixa:', error);
    return false;
  }
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
