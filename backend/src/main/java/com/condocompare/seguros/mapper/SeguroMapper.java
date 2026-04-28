package com.condocompare.seguros.mapper;

import com.condocompare.seguros.dto.*;
import com.condocompare.seguros.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SeguroMapper {

    public SeguradoraResponse toSeguradoraResponse(Seguradora seguradora) {
        return new SeguradoraResponse(
            seguradora.getId(),
            seguradora.getNome(),
            seguradora.getCnpj(),
            seguradora.getCodigoSusep(),
            seguradora.getTelefone(),
            seguradora.getEmail(),
            seguradora.getWebsite(),
            seguradora.getEnderecoCompleto(),
            seguradora.getLogoUrl(),
            seguradora.getObservacoes(),
            seguradora.getDescricao(),
            seguradora.getEspecialidades() != null ? java.util.Arrays.asList(seguradora.getEspecialidades()) : java.util.Collections.emptyList(),
            seguradora.getRegras() != null ? java.util.Arrays.asList(seguradora.getRegras()) : java.util.Collections.emptyList(),
            seguradora.getIaConhecimento() != null ? java.util.Arrays.asList(seguradora.getIaConhecimento()) : java.util.Collections.emptyList(),
            seguradora.getRating(),
            seguradora.getTotalAvaliacoes(),
            seguradora.getCondicoesGeraisUrl(),
            seguradora.getCondicoesGeraisNomeArquivo(),
            seguradora.getCondicoesGeraisAtualizadoEm()
        );
    }

    public Seguradora toSeguradora(CreateSeguradoraRequest request) {
        return Seguradora.builder()
            .nome(request.nome())
            .cnpj(request.cnpj())
            .codigoSusep(request.codigoSusep())
            .telefone(request.telefone())
            .email(request.email())
            .website(request.website())
            .enderecoCompleto(request.enderecoCompleto())
            .logoUrl(request.logoUrl())
            .observacoes(request.observacoes())
            .descricao(request.descricao())
            .especialidades(request.especialidades() != null ? request.especialidades().toArray(new String[0]) : null)
            .regras(request.regras() != null ? request.regras().toArray(new String[0]) : null)
            .iaConhecimento(request.iaConhecimento() != null ? request.iaConhecimento().toArray(new String[0]) : null)
            .build();
    }

    public CoberturaResponse toCoberturaResponse(Cobertura cobertura) {
        return new CoberturaResponse(
            cobertura.getId(),
            cobertura.getTipo(),
            cobertura.getDescricao(),
            cobertura.getLimiteMaximo(),
            cobertura.getFranquia(),
            cobertura.getFranquiaPercentual(),
            cobertura.getCarenciaDias(),
            cobertura.getCondicoesEspeciais(),
            cobertura.getExclusoes(),
            cobertura.isContratada(),
            cobertura.isObrigatoria(),
            cobertura.isRecomendada()
        );
    }

    public Cobertura toCobertura(CreateCoberturaRequest request) {
        return Cobertura.builder()
            .tipo(request.tipo())
            .descricao(request.descricao())
            .limiteMaximo(request.limiteMaximo())
            .franquia(request.franquia())
            .franquiaPercentual(request.franquiaPercentual())
            .carenciaDias(request.carenciaDias())
            .condicoesEspeciais(request.condicoesEspeciais())
            .exclusoes(request.exclusoes())
            .contratada(request.contratada() != null ? request.contratada() : true)
            .obrigatoria(request.obrigatoria() != null ? request.obrigatoria() : false)
            .recomendada(request.recomendada() != null ? request.recomendada() : false)
            .build();
    }

    public ApoliceResponse toApoliceResponse(Apolice apolice) {
        List<CoberturaResponse> coberturas = apolice.getCoberturas().stream()
            .map(this::toCoberturaResponse)
            .toList();

        return new ApoliceResponse(
            apolice.getId(),
            apolice.getNumeroApolice(),
            apolice.getCondominio().getId(),
            apolice.getCondominio().getNome(),
            apolice.getSeguradora().getId(),
            apolice.getSeguradora().getNome(),
            apolice.getStatus(),
            apolice.getDataInicio(),
            apolice.getDataFim(),
            apolice.getPremioTotal(),
            apolice.getPremioLiquido(),
            apolice.getIof(),
            apolice.getFormaPagamento(),
            apolice.getNumeroParcelas(),
            apolice.getValorParcela(),
            apolice.getImportanciaSeguradaTotal(),
            apolice.getDocumentoId(),
            apolice.getPropostaId(),
            apolice.getCorretorNome(),
            apolice.getCorretorSusep(),
            apolice.getCorretorTelefone(),
            apolice.getCorretorEmail(),
            apolice.getObservacoes(),
            apolice.getClausulasEspeciais(),
            coberturas,
            apolice.diasParaVencimento(),
            apolice.isVigente(),
            apolice.getCreatedAt(),
            apolice.getUpdatedAt()
        );
    }

    public ApoliceListResponse toApoliceListResponse(Apolice apolice) {
        return new ApoliceListResponse(
            apolice.getId(),
            apolice.getNumeroApolice(),
            apolice.getCondominio().getId(),
            apolice.getCondominio().getNome(),
            apolice.getSeguradora().getNome(),
            apolice.getStatus(),
            apolice.getDataInicio(),
            apolice.getDataFim(),
            apolice.getPremioTotal(),
            apolice.getImportanciaSeguradaTotal(),
            apolice.getCoberturas().size(),
            apolice.diasParaVencimento(),
            apolice.isVigente()
        );
    }
}
