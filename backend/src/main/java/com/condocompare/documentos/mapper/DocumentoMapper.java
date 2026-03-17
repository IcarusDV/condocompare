package com.condocompare.documentos.mapper;

import com.condocompare.documentos.dto.DocumentoListResponse;
import com.condocompare.documentos.dto.DocumentoResponse;
import com.condocompare.documentos.entity.Documento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DocumentoMapper {

    @Mapping(target = "createdBy", source = "createdBy")
    DocumentoResponse toResponse(Documento documento);

    DocumentoListResponse toListResponse(Documento documento);
}
