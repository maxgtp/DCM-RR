/**
 * LocalStorageManager - Gerencia persistência de relatórios no localStorage
 * 
 * Responsável por:
 * - Salvar relatórios completos (campos + imagens Base64)
 * - Recuperar relatórios salvos
 * - Listar relatórios pendentes
 * - Gerenciar espaço disponível
 * - Tratar quota excedida com fallback gracioso
 */

const LocalStorageManager = (function() {
    'use strict';

    // Prefixos para chaves do localStorage
    const REPORT_PREFIX = 'relatorio_pendente_';
    const PDF_PREFIX = 'pdf_pendente_';
    
    // Tamanho estimado de quota do localStorage (5MB na maioria dos navegadores)
    const ESTIMATED_QUOTA = 5 * 1024 * 1024; // 5MB em bytes
    
    /**
     * Estima o tamanho de um objeto em bytes quando serializado
     */
    function estimateSize(obj) {
        try {
            const jsonString = JSON.stringify(obj);
            // Cada caractere em UTF-16 ocupa 2 bytes
            return jsonString.length * 2;
        } catch (error) {
            console.error('Erro ao estimar tamanho:', error);
            return 0;
        }
    }
    
    /**
     * Obtém o tamanho atual usado no localStorage
     */
    function getCurrentUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += (localStorage[key].length + key.length) * 2;
            }
        }
        return total;
    }
    
    /**
     * Verifica se há espaço suficiente no localStorage
     */
    function hasSpace(dataSize) {
        const currentUsage = getCurrentUsage();
        const availableSpace = ESTIMATED_QUOTA - currentUsage;
        return availableSpace >= dataSize;
    }
    
    /**
     * Salva relatório completo no localStorage
     * Inclui todos os campos e imagens em Base64
     */
    function saveReport(reportData) {
        if (!reportData || !reportData.protocol) {
            throw new Error('Dados do relatório inválidos: protocol é obrigatório');
        }
        
        const key = REPORT_PREFIX + reportData.protocol;
        
        try {
            // Adiciona timestamp de salvamento
            const dataToSave = {
                ...reportData,
                savedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            const jsonData = JSON.stringify(dataToSave);
            localStorage.setItem(key, jsonData);
            
            console.log(`Relatório ${reportData.protocol} salvo com sucesso no localStorage`);
            return { success: true, protocol: reportData.protocol };
            
        } catch (error) {
            // Se erro de quota, tenta estratégias de fallback
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                return handleQuotaExceeded(reportData);
            }
            
            console.error('Erro ao salvar relatório:', error);
            throw error;
        }
    }
    
    /**
     * Trata erro de quota excedida com estratégias de fallback
     * 1. Tenta salvar sem imagens
     * 2. Se ainda falhar, salva apenas campos essenciais
     */
    function handleQuotaExceeded(reportData) {
        console.warn('Quota do localStorage excedida. Tentando estratégias de fallback...');
        
        const key = REPORT_PREFIX + reportData.protocol;
        
        // Estratégia 1: Salvar sem imagens
        try {
            const dataWithoutImages = {
                ...reportData,
                photos: [], // Remove imagens
                savedAt: new Date().toISOString(),
                version: '1.0',
                fallbackLevel: 'no_images'
            };
            
            const jsonData = JSON.stringify(dataWithoutImages);
            localStorage.setItem(key, jsonData);
            
            console.log(`Relatório ${reportData.protocol} salvo sem imagens (fallback nível 1)`);
            return { 
                success: true, 
                protocol: reportData.protocol,
                warning: 'Salvo sem imagens devido a limitação de espaço'
            };
            
        } catch (error) {
            console.warn('Falha ao salvar sem imagens. Tentando salvar apenas campos essenciais...');
        }
        
        // Estratégia 2: Salvar apenas campos essenciais
        try {
            const essentialData = {
                protocol: reportData.protocol,
                citizenName: reportData.citizenName,
                serviceDate: reportData.serviceDate,
                address: reportData.address,
                description: reportData.description,
                technicalAnalysis: reportData.technicalAnalysis,
                recommendations: reportData.recommendations,
                agentName: reportData.agentName,
                savedAt: new Date().toISOString(),
                version: '1.0',
                fallbackLevel: 'essential_only'
            };
            
            const jsonData = JSON.stringify(essentialData);
            localStorage.setItem(key, jsonData);
            
            console.log(`Relatório ${reportData.protocol} salvo apenas com campos essenciais (fallback nível 2)`);
            return { 
                success: true, 
                protocol: reportData.protocol,
                warning: 'Salvo apenas campos essenciais devido a limitação de espaço'
            };
            
        } catch (error) {
            console.error('Falha ao salvar mesmo com campos essenciais:', error);
            return {
                success: false,
                protocol: reportData.protocol,
                error: 'Não foi possível salvar devido a limitação de espaço'
            };
        }
    }
    
    /**
     * Recupera relatório do localStorage
     */
    function getReport(protocol) {
        if (!protocol) {
            throw new Error('Protocol é obrigatório para recuperar relatório');
        }
        
        const key = REPORT_PREFIX + protocol;
        
        try {
            const jsonData = localStorage.getItem(key);
            
            if (!jsonData) {
                return null;
            }
            
            const reportData = JSON.parse(jsonData);
            console.log(`Relatório ${protocol} recuperado do localStorage`);
            return reportData;
            
        } catch (error) {
            console.error(`Erro ao recuperar relatório ${protocol}:`, error);
            return null;
        }
    }
    
    /**
     * Remove relatório do localStorage
     */
    function removeReport(protocol) {
        if (!protocol) {
            throw new Error('Protocol é obrigatório para remover relatório');
        }
        
        const reportKey = REPORT_PREFIX + protocol;
        const pdfKey = PDF_PREFIX + protocol;
        
        try {
            localStorage.removeItem(reportKey);
            localStorage.removeItem(pdfKey);
            
            console.log(`Relatório ${protocol} removido do localStorage`);
            return { success: true, protocol: protocol };
            
        } catch (error) {
            console.error(`Erro ao remover relatório ${protocol}:`, error);
            return { success: false, protocol: protocol, error: error.message };
        }
    }
    
    /**
     * Lista todos os relatórios pendentes no localStorage
     */
    function listPendingReports() {
        const pendingReports = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                if (key && key.startsWith(REPORT_PREFIX)) {
                    const protocol = key.replace(REPORT_PREFIX, '');
                    const reportData = getReport(protocol);
                    
                    if (reportData) {
                        pendingReports.push({
                            protocol: protocol,
                            citizenName: reportData.citizenName || 'N/A',
                            date: reportData.serviceDate || reportData.savedAt || 'N/A',
                            savedAt: reportData.savedAt,
                            fallbackLevel: reportData.fallbackLevel || 'complete',
                            data: reportData
                        });
                    }
                }
            }
            
            // Ordena por data de salvamento (mais recente primeiro)
            pendingReports.sort((a, b) => {
                const dateA = new Date(a.savedAt || 0);
                const dateB = new Date(b.savedAt || 0);
                return dateB - dateA;
            });
            
            console.log(`${pendingReports.length} relatórios pendentes encontrados`);
            return pendingReports;
            
        } catch (error) {
            console.error('Erro ao listar relatórios pendentes:', error);
            return [];
        }
    }
    
    /**
     * Salva PDF no localStorage (se houver espaço)
     */
    function savePDF(protocol, pdfBase64) {
        if (!protocol || !pdfBase64) {
            throw new Error('Protocol e pdfBase64 são obrigatórios');
        }
        
        const key = PDF_PREFIX + protocol;
        
        try {
            const dataSize = estimateSize(pdfBase64);
            
            if (!hasSpace(dataSize)) {
                console.warn(`Não há espaço suficiente para salvar PDF do relatório ${protocol}`);
                return { success: false, reason: 'insufficient_space' };
            }
            
            localStorage.setItem(key, pdfBase64);
            console.log(`PDF do relatório ${protocol} salvo no localStorage`);
            return { success: true, protocol: protocol };
            
        } catch (error) {
            console.error(`Erro ao salvar PDF do relatório ${protocol}:`, error);
            return { success: false, protocol: protocol, error: error.message };
        }
    }
    
    /**
     * Recupera PDF do localStorage
     */
    function getPDF(protocol) {
        if (!protocol) {
            throw new Error('Protocol é obrigatório para recuperar PDF');
        }
        
        const key = PDF_PREFIX + protocol;
        
        try {
            const pdfBase64 = localStorage.getItem(key);
            return pdfBase64;
            
        } catch (error) {
            console.error(`Erro ao recuperar PDF do relatório ${protocol}:`, error);
            return null;
        }
    }
    
    /**
     * Limpa todos os relatórios pendentes (usar com cuidado!)
     */
    function clearAllPending() {
        try {
            const keys = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith(REPORT_PREFIX) || key.startsWith(PDF_PREFIX))) {
                    keys.push(key);
                }
            }
            
            keys.forEach(key => localStorage.removeItem(key));
            
            console.log(`${keys.length} itens pendentes removidos do localStorage`);
            return { success: true, count: keys.length };
            
        } catch (error) {
            console.error('Erro ao limpar relatórios pendentes:', error);
            return { success: false, error: error.message };
        }
    }
    
    // API pública
    return {
        saveReport: saveReport,
        getReport: getReport,
        removeReport: removeReport,
        listPendingReports: listPendingReports,
        hasSpace: hasSpace,
        handleQuotaExceeded: handleQuotaExceeded,
        savePDF: savePDF,
        getPDF: getPDF,
        clearAllPending: clearAllPending,
        
        // Utilitários expostos para testes
        _estimateSize: estimateSize,
        _getCurrentUsage: getCurrentUsage
    };
})();

// Exporta para uso em módulos (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageManager;
}
