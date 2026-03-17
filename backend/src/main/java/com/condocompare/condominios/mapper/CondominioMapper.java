package com.condocompare.condominios.mapper;

import com.condocompare.condominios.dto.*;
import com.condocompare.condominios.dto.CondominioListResponse.StatusApolice;
import com.condocompare.condominios.entity.Condominio;
import org.mapstruct.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Mapper(componentModel = "spring")
public interface CondominioMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "administradoraId", ignore = true)
    @Mapping(target = "administradoraNome", ignore = true)
    @Mapping(target = "sindicoId", ignore = true)
    Condominio toEntity(CreateCondominioRequest request);

    @AfterMapping
    default void setActiveTrue(@MappingTarget Condominio condominio) {
        if (condominio.getId() == null) { // Novo registro
            condominio.setActive(true);
        }
    }

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "administradoraId", ignore = true)
    @Mapping(target = "administradoraNome", ignore = true)
    @Mapping(target = "sindicoId", ignore = true)
    void updateEntity(UpdateCondominioRequest request, @MappingTarget Condominio condominio);

    @Mapping(target = "endereco", expression = "java(toEnderecoResponse(condominio))")
    @Mapping(target = "caracteristicas", expression = "java(toCaracteristicasResponse(condominio))")
    @Mapping(target = "amenidades", expression = "java(toAmenidadesResponse(condominio))")
    @Mapping(target = "sindico", expression = "java(toSindicoResponse(condominio))")
    @Mapping(target = "seguro", expression = "java(toSeguroResponse(condominio))")
    CondominioResponse toResponse(Condominio condominio);

    @Mapping(target = "diasParaVencimento", expression = "java(calcularDiasParaVencimento(condominio.getVencimentoApolice()))")
    @Mapping(target = "statusApolice", expression = "java(calcularStatusApolice(condominio.getVencimentoApolice()))")
    CondominioListResponse toListResponse(Condominio condominio);

    default CondominioResponse.EnderecoResponse toEnderecoResponse(Condominio c) {
        return new CondominioResponse.EnderecoResponse(
            c.getEndereco(),
            c.getNumero(),
            c.getComplemento(),
            c.getBairro(),
            c.getCidade(),
            c.getEstado(),
            c.getCep()
        );
    }

    default CondominioResponse.CaracteristicasResponse toCaracteristicasResponse(Condominio c) {
        return new CondominioResponse.CaracteristicasResponse(
            c.getAreaConstruida(),
            c.getAreaTotal(),
            c.getNumeroUnidades(),
            c.getNumeroBlocos(),
            c.getNumeroElevadores(),
            c.getNumeroAndares(),
            c.getNumeroFuncionarios(),
            c.getAnoConstrucao(),
            c.getTipoConstrucao()
        );
    }

    default CondominioResponse.AmenidadesResponse toAmenidadesResponse(Condominio c) {
        return new CondominioResponse.AmenidadesResponse(
            c.getTemPlacasSolares(),
            c.getTemPiscina(),
            c.getTemAcademia(),
            c.getTemSalaoFestas(),
            c.getTemPlayground(),
            c.getTemChurrasqueira(),
            c.getTemQuadra(),
            c.getTemPortaria24h()
        );
    }

    default CondominioResponse.SindicoResponse toSindicoResponse(Condominio c) {
        return new CondominioResponse.SindicoResponse(
            c.getSindicoId(),
            c.getSindicoNome(),
            c.getSindicoEmail(),
            c.getSindicoTelefone()
        );
    }

    default CondominioResponse.SeguroResponse toSeguroResponse(Condominio c) {
        return new CondominioResponse.SeguroResponse(
            c.getVencimentoApolice(),
            c.getSeguradoraAtual(),
            calcularDiasParaVencimento(c.getVencimentoApolice())
        );
    }

    default Integer calcularDiasParaVencimento(LocalDate vencimento) {
        if (vencimento == null) {
            return null;
        }
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), vencimento);
    }

    default StatusApolice calcularStatusApolice(LocalDate vencimento) {
        if (vencimento == null) {
            return StatusApolice.SEM_APOLICE;
        }
        long dias = ChronoUnit.DAYS.between(LocalDate.now(), vencimento);
        if (dias < 0) {
            return StatusApolice.VENCIDA;
        } else if (dias <= 30) {
            return StatusApolice.VENCENDO;
        } else {
            return StatusApolice.VIGENTE;
        }
    }
}
