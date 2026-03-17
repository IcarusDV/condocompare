package com.condocompare.parceiros.repository;

import com.condocompare.parceiros.entity.CategoriaParceiro;
import com.condocompare.parceiros.entity.Parceiro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface ParceiroRepository extends JpaRepository<Parceiro, UUID> {

    // Buscar por categoria
    @Query("SELECT DISTINCT p FROM Parceiro p JOIN p.categorias c WHERE c = :categoria AND p.ativo = true")
    List<Parceiro> findByCategoria(@Param("categoria") CategoriaParceiro categoria);

    // Buscar por multiplas categorias
    @Query("SELECT DISTINCT p FROM Parceiro p JOIN p.categorias c WHERE c IN :categorias AND p.ativo = true")
    List<Parceiro> findByCategorias(@Param("categorias") Set<CategoriaParceiro> categorias);

    // Buscar por cidade e categoria
    @Query("SELECT DISTINCT p FROM Parceiro p JOIN p.categorias c WHERE c = :categoria AND LOWER(p.cidade) = LOWER(:cidade) AND p.ativo = true")
    List<Parceiro> findByCategoriaAndCidade(
        @Param("categoria") CategoriaParceiro categoria,
        @Param("cidade") String cidade
    );

    // Buscar por estado e categoria
    @Query("SELECT DISTINCT p FROM Parceiro p JOIN p.categorias c WHERE c = :categoria AND UPPER(p.estado) = UPPER(:estado) AND p.ativo = true")
    List<Parceiro> findByCategoriaAndEstado(
        @Param("categoria") CategoriaParceiro categoria,
        @Param("estado") String estado
    );

    // Busca com filtros - usando native query para evitar problemas com nulls
    @Query(value = """
        SELECT DISTINCT p.* FROM parceiros p
        LEFT JOIN parceiro_categorias c ON p.id = c.parceiro_id
        WHERE (CAST(:search AS VARCHAR) IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.nome_fantasia) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (CAST(:categoria AS VARCHAR) IS NULL OR c.categoria = :categoria)
        AND (CAST(:cidade AS VARCHAR) IS NULL OR LOWER(p.cidade) = LOWER(:cidade))
        AND (CAST(:estado AS VARCHAR) IS NULL OR UPPER(p.estado) = UPPER(:estado))
        AND (CAST(:ativo AS BOOLEAN) IS NULL OR p.ativo = :ativo)
        AND (CAST(:verificado AS BOOLEAN) IS NULL OR p.verificado = :verificado)
        ORDER BY p.nome
    """,
    countQuery = """
        SELECT COUNT(DISTINCT p.id) FROM parceiros p
        LEFT JOIN parceiro_categorias c ON p.id = c.parceiro_id
        WHERE (CAST(:search AS VARCHAR) IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.nome_fantasia) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (CAST(:categoria AS VARCHAR) IS NULL OR c.categoria = :categoria)
        AND (CAST(:cidade AS VARCHAR) IS NULL OR LOWER(p.cidade) = LOWER(:cidade))
        AND (CAST(:estado AS VARCHAR) IS NULL OR UPPER(p.estado) = UPPER(:estado))
        AND (CAST(:ativo AS BOOLEAN) IS NULL OR p.ativo = :ativo)
        AND (CAST(:verificado AS BOOLEAN) IS NULL OR p.verificado = :verificado)
    """,
    nativeQuery = true)
    Page<Parceiro> findWithFilters(
        @Param("search") String search,
        @Param("categoria") String categoria,
        @Param("cidade") String cidade,
        @Param("estado") String estado,
        @Param("ativo") Boolean ativo,
        @Param("verificado") Boolean verificado,
        Pageable pageable
    );

    // Contar por categoria
    @Query("SELECT COUNT(DISTINCT p) FROM Parceiro p JOIN p.categorias c WHERE c = :categoria AND p.ativo = true")
    long countByCategoria(@Param("categoria") CategoriaParceiro categoria);

    // Listar apenas ativos
    Page<Parceiro> findByAtivoTrue(Pageable pageable);

    // Listar verificados
    Page<Parceiro> findByVerificadoTrueAndAtivoTrue(Pageable pageable);

    // Buscar por CNPJ
    List<Parceiro> findByCnpj(String cnpj);

    // Buscar melhores avaliados
    @Query("SELECT p FROM Parceiro p WHERE p.ativo = true AND p.avaliacao IS NOT NULL ORDER BY p.avaliacao DESC")
    List<Parceiro> findTopRated(Pageable pageable);

    // Buscar melhores avaliados por categoria
    @Query("""
        SELECT DISTINCT p FROM Parceiro p
        JOIN p.categorias c
        WHERE c = :categoria AND p.ativo = true AND p.avaliacao IS NOT NULL
        ORDER BY p.avaliacao DESC
    """)
    List<Parceiro> findTopRatedByCategoria(@Param("categoria") CategoriaParceiro categoria, Pageable pageable);
}
