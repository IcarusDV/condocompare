package com.condocompare.parceiros.service;

import com.condocompare.parceiros.dto.*;
import com.condocompare.parceiros.entity.CategoriaParceiro;
import com.condocompare.parceiros.entity.Parceiro;
import com.condocompare.parceiros.repository.ParceiroRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class ParceiroService {

    private final ParceiroRepository parceiroRepository;

    public ParceiroService(ParceiroRepository parceiroRepository) {
        this.parceiroRepository = parceiroRepository;
    }

    @Transactional
    public ParceiroResponse create(CreateParceiroRequest request) {
        Parceiro parceiro = new Parceiro();
        mapRequestToEntity(request, parceiro);
        parceiro.setAtivo(true);
        parceiro.setVerificado(false);
        parceiro.setAvaliacao(null);
        parceiro.setTotalAvaliacoes(0);

        Parceiro saved = parceiroRepository.save(parceiro);
        return ParceiroResponse.from(saved);
    }

    @Transactional
    public ParceiroResponse update(UUID id, UpdateParceiroRequest request) {
        Parceiro parceiro = parceiroRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Parceiro nao encontrado: " + id));

        if (request.nome() != null) parceiro.setNome(request.nome());
        if (request.nomeFantasia() != null) parceiro.setNomeFantasia(request.nomeFantasia());
        if (request.cnpj() != null) parceiro.setCnpj(request.cnpj());
        if (request.cpf() != null) parceiro.setCpf(request.cpf());
        if (request.email() != null) parceiro.setEmail(request.email());
        if (request.telefone() != null) parceiro.setTelefone(request.telefone());
        if (request.celular() != null) parceiro.setCelular(request.celular());
        if (request.website() != null) parceiro.setWebsite(request.website());
        if (request.endereco() != null) parceiro.setEndereco(request.endereco());
        if (request.numero() != null) parceiro.setNumero(request.numero());
        if (request.complemento() != null) parceiro.setComplemento(request.complemento());
        if (request.bairro() != null) parceiro.setBairro(request.bairro());
        if (request.cidade() != null) parceiro.setCidade(request.cidade());
        if (request.estado() != null) parceiro.setEstado(request.estado());
        if (request.cep() != null) parceiro.setCep(request.cep());
        if (request.categorias() != null && !request.categorias().isEmpty()) {
            parceiro.setCategorias(request.categorias());
        }
        if (request.descricaoServicos() != null) parceiro.setDescricaoServicos(request.descricaoServicos());
        if (request.areaAtuacao() != null) parceiro.setAreaAtuacao(request.areaAtuacao());
        if (request.contatoNome() != null) parceiro.setContatoNome(request.contatoNome());
        if (request.contatoCargo() != null) parceiro.setContatoCargo(request.contatoCargo());
        if (request.observacoes() != null) parceiro.setObservacoes(request.observacoes());
        if (request.logoUrl() != null) parceiro.setLogoUrl(request.logoUrl());
        if (request.ativo() != null) parceiro.setAtivo(request.ativo());
        if (request.verificado() != null) parceiro.setVerificado(request.verificado());

        Parceiro saved = parceiroRepository.save(parceiro);
        return ParceiroResponse.from(saved);
    }

    public ParceiroResponse getById(UUID id) {
        Parceiro parceiro = parceiroRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Parceiro nao encontrado: " + id));
        return ParceiroResponse.from(parceiro);
    }

    public Page<ParceiroListResponse> list(
        String search,
        CategoriaParceiro categoria,
        String cidade,
        String estado,
        Boolean ativo,
        Boolean verificado,
        Pageable pageable
    ) {
        String categoriaStr = categoria != null ? categoria.name() : null;
        return parceiroRepository.findWithFilters(search, categoriaStr, cidade, estado, ativo, verificado, pageable)
            .map(ParceiroListResponse::from);
    }

    @Transactional
    public void delete(UUID id) {
        Parceiro parceiro = parceiroRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Parceiro nao encontrado: " + id));
        parceiroRepository.delete(parceiro);
    }

    @Transactional
    public void deactivate(UUID id) {
        Parceiro parceiro = parceiroRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Parceiro nao encontrado: " + id));
        parceiro.setAtivo(false);
        parceiroRepository.save(parceiro);
    }

    @Transactional
    public void activate(UUID id) {
        Parceiro parceiro = parceiroRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Parceiro nao encontrado: " + id));
        parceiro.setAtivo(true);
        parceiroRepository.save(parceiro);
    }

    @Transactional
    public void verify(UUID id) {
        Parceiro parceiro = parceiroRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Parceiro nao encontrado: " + id));
        parceiro.setVerificado(true);
        parceiroRepository.save(parceiro);
    }

    public List<ParceiroListResponse> findByCategoria(CategoriaParceiro categoria) {
        return parceiroRepository.findByCategoria(categoria).stream()
            .map(ParceiroListResponse::from)
            .toList();
    }

    public List<ParceiroListResponse> findByCategoriaAndCidade(CategoriaParceiro categoria, String cidade) {
        return parceiroRepository.findByCategoriaAndCidade(categoria, cidade).stream()
            .map(ParceiroListResponse::from)
            .toList();
    }

    public List<ParceiroListResponse> findByCategoriaAndEstado(CategoriaParceiro categoria, String estado) {
        return parceiroRepository.findByCategoriaAndEstado(categoria, estado).stream()
            .map(ParceiroListResponse::from)
            .toList();
    }

    public List<ParceiroListResponse> findTopRated(int limit) {
        return parceiroRepository.findTopRated(PageRequest.of(0, limit)).stream()
            .map(ParceiroListResponse::from)
            .toList();
    }

    public List<ParceiroListResponse> findTopRatedByCategoria(CategoriaParceiro categoria, int limit) {
        return parceiroRepository.findTopRatedByCategoria(categoria, PageRequest.of(0, limit)).stream()
            .map(ParceiroListResponse::from)
            .toList();
    }

    public Map<CategoriaParceiro, Long> countByCategoria() {
        Map<CategoriaParceiro, Long> counts = new EnumMap<>(CategoriaParceiro.class);
        for (CategoriaParceiro categoria : CategoriaParceiro.values()) {
            counts.put(categoria, parceiroRepository.countByCategoria(categoria));
        }
        return counts;
    }

    public List<CategoriaParceiro> getCategorias() {
        return Arrays.asList(CategoriaParceiro.values());
    }

    private void mapRequestToEntity(CreateParceiroRequest request, Parceiro parceiro) {
        parceiro.setNome(request.nome());
        parceiro.setNomeFantasia(request.nomeFantasia());
        parceiro.setCnpj(request.cnpj());
        parceiro.setCpf(request.cpf());
        parceiro.setEmail(request.email());
        parceiro.setTelefone(request.telefone());
        parceiro.setCelular(request.celular());
        parceiro.setWebsite(request.website());
        parceiro.setEndereco(request.endereco());
        parceiro.setNumero(request.numero());
        parceiro.setComplemento(request.complemento());
        parceiro.setBairro(request.bairro());
        parceiro.setCidade(request.cidade());
        parceiro.setEstado(request.estado());
        parceiro.setCep(request.cep());
        parceiro.setCategorias(request.categorias() != null ? request.categorias() : new HashSet<>());
        parceiro.setDescricaoServicos(request.descricaoServicos());
        parceiro.setAreaAtuacao(request.areaAtuacao());
        parceiro.setContatoNome(request.contatoNome());
        parceiro.setContatoCargo(request.contatoCargo());
        parceiro.setObservacoes(request.observacoes());
        parceiro.setLogoUrl(request.logoUrl());
    }
}
